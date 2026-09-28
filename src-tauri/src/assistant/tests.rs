use super::{documents, index, storage, types::*, workflow};
use serde_json::json;

async fn pool() -> sqlx::SqlitePool {
    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .unwrap();
    storage::migrate(&pool).await.unwrap();
    pool
}
fn source() -> Source {
    Source {
        id: "s1".into(),
        path: "regulamin.txt".into(),
        location: "akapit 1".into(),
        version: "v1".into(),
        text: "Termin zgłoszeń: 20 września 2026.".into(),
        fetched_at: None,
    }
}
#[test]
fn fabricated_citations_are_rejected() {
    let sources = vec![source()];
    let good = json!({"facts":[{"text":"Termin zgłoszeń","sourceId":"s1","quote":"20 września 2026"}],"missing":[],"conflicts":[]});
    assert!(workflow::validate_facts(&good, &sources).is_ok());
    for fact in [
        json!({"text":"Termin","sourceId":"fake","quote":"20 września 2026"}),
        json!({"text":"Termin","sourceId":"s1","quote":"30 września 2027"}),
        json!({"text":"Termin","sourceId":"s1","quote":""}),
    ] {
        assert!(workflow::validate_facts(
            &json!({"facts":[fact],"missing":[],"conflicts":[]}),
            &sources
        )
        .is_err());
    }
}
#[test]
fn edits_and_evidence_change_fingerprint() {
    let draft = json!({"body":"Zaproszenie","sources":[source()],"date":"2026-09-10"});
    for key in [
        "body",
        "date",
        "recipient",
        "signature",
        "request",
        "caseSign",
        "sources",
        "missing",
    ] {
        let mut edited = draft.clone();
        edited[key] = json!("zmiana");
        assert_ne!(
            workflow::fingerprint(&draft),
            workflow::fingerprint(&edited)
        );
    }
}
#[test]
fn scoped_index_tracks_changes_deletions_and_inaccessible_root() {
    tauri::async_runtime::block_on(async {
        let pool = pool().await;
        let dir = std::env::temp_dir().join(format!("ozipz-assistant-test-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("a")).unwrap();
        std::fs::create_dir_all(dir.join("b")).unwrap();
        let file = dir.join("a/regulamin.txt");
        std::fs::write(&file, "Termin zgłoszeń HNT: 20 września 2026.").unwrap();
        std::fs::write(
            dir.join("b/regulamin.txt"),
            "Termin zgłoszeń: 30 października 2025.",
        )
        .unwrap();
        let cfg = Config {
            programs: vec![
                ProgramFolder {
                    id: "a".into(),
                    name: "HNT".into(),
                    folder: dir.join("a").to_string_lossy().into(),
                    edition: "2026".into(),
                    aliases: vec![],
                },
                ProgramFolder {
                    id: "b".into(),
                    name: "HNT".into(),
                    folder: dir.join("b").to_string_lossy().into(),
                    edition: "2025".into(),
                    aliases: vec![],
                },
            ],
            ..Config::default()
        };
        index::refresh(&pool, &cfg).await.unwrap();
        let hits = index::search(&pool, "a", "termin", 0).await.unwrap();
        assert_eq!(hits.len(), 1);
        assert!(hits[0].text.contains("2026"));
        assert!(index::search(&pool, "absent", "termin", 0)
            .await
            .unwrap()
            .is_empty());
        assert_eq!(
            index::search(&pool, "a", "xyz unmatched", 0)
                .await
                .unwrap()
                .len(),
            1
        );
        std::fs::write(&file, "Termin zgłoszeń HNT: 21 września 2026.").unwrap();
        index::refresh(&pool, &cfg).await.unwrap();
        assert!(index::validate_sources(&pool, &hits).await.is_err());
        let fresh = index::search(&pool, "a", "termin", 0).await.unwrap();
        assert_ne!(hits[0].version, fresh[0].version);
        let mut invalid = cfg.clone();
        invalid.programs[0].folder = dir.join("missing").to_string_lossy().into();
        assert!(index::refresh(&pool, &invalid).await.is_err());
        assert_eq!(
            index::search(&pool, "a", "termin", 0).await.unwrap()[0].id,
            fresh[0].id
        );
        std::fs::remove_file(file).unwrap();
        index::refresh_program(&pool, &cfg, "a").await.unwrap();
        assert!(index::search(&pool, "a", "termin", 0)
            .await
            .unwrap()
            .is_empty());
        assert_eq!(
            index::search(&pool, "b", "termin", 0).await.unwrap().len(),
            1
        );
        std::fs::remove_dir_all(dir).unwrap();
        pool.close().await;
    });
}
#[test]
fn drafts_survive_reload_and_schema_is_idempotent() {
    tauri::async_runtime::block_on(async {
        let pool = pool().await;
        let draft = json!({"id":"d1","body":"Zażółć gęślą jaźń","sources":[source()],"missing":["Podaj termin"]});
        storage::save_draft(&pool, draft.clone()).await.unwrap();
        storage::migrate(&pool).await.unwrap();
        assert_eq!(storage::drafts(&pool).await.unwrap()[0], draft);
        assert_eq!(storage::usage(&pool).await.unwrap()["cost"], 0.0);
    });
}
#[test]
fn docx_extracts_split_runs_and_xml_entities() {
    use std::io::Write;
    let cursor = std::io::Cursor::new(Vec::new());
    let mut writer = zip::ZipWriter::new(cursor);
    writer
        .start_file(
            "word/document.xml",
            zip::write::SimpleFileOptions::default(),
        )
        .unwrap();
    writer.write_all(br#"<w:document xmlns:w="test"><w:body><w:p><w:r><w:t>HNT &amp; </w:t></w:r><w:r><w:t>szkoly</w:t></w:r></w:p></w:body></w:document>"#).unwrap();
    let bytes = writer.finish().unwrap().into_inner();
    let text = documents::extract(std::path::Path::new("test.docx"), &bytes).unwrap();
    assert_eq!(text[0].1.trim(), "HNT & szkoly");
}

#[test]
fn changed_user_answers_require_regeneration() {
    let mut user = source();
    user.path = "Użytkownik".into();
    user.text = "Termin: 20 września".into();
    user.version = hash(&user.text);
    user.id = user.version.clone();
    assert!(workflow::ensure_user_evidence(&json!({"request":user.text}), &[user.clone()]).is_ok());
    assert!(
        workflow::ensure_user_evidence(&json!({"request":"Termin: 30 września"}), &[user]).is_err()
    );
}

#[test]
fn export_requires_persisted_approval_for_current_program_and_content() {
    tauri::async_runtime::block_on(async {
        let pool = pool().await;
        let dir = std::env::temp_dir().join(format!(
            "ozipz-assistant-export-test-{}",
            std::process::id()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        let cfg = Config {
            programs: vec![ProgramFolder {
                id: "p".into(),
                name: "HNT".into(),
                folder: dir.to_string_lossy().into(),
                edition: "2026".into(),
                aliases: vec![],
            }],
            ..Config::default()
        };
        let mut draft = json!({"id":"d","programId":"p","edition":"2026","body":"Zaproszenie","sources":[],"review":null});
        storage::save_draft(&pool, draft.clone()).await.unwrap();
        assert!(workflow::exportable(&pool, &cfg, "d").await.is_err());
        draft["review"] = json!({"passed":true,"fingerprint":workflow::fingerprint(&draft)});
        storage::save_draft(&pool, draft.clone()).await.unwrap();
        assert!(workflow::exportable(&pool, &cfg, "d").await.is_ok());
        draft["body"] = json!("Zmieniono termin");
        storage::save_draft(&pool, draft).await.unwrap();
        assert!(workflow::exportable(&pool, &cfg, "d").await.is_err());
        std::fs::remove_dir_all(&dir).unwrap();
    });
}

#[test]
fn pdf_citations_keep_real_page_numbers_and_blank_scans_are_flagged() {
    fn pdf(with_text: bool) -> Vec<u8> {
        let first = if with_text {
            "BT /F1 12 Tf 10 100 Td (HNT first page) Tj ET"
        } else {
            ""
        };
        let second = if with_text {
            "BT /F1 12 Tf 10 100 Td (Second page deadline) Tj ET"
        } else {
            ""
        };
        let objects=vec!["<< /Type /Catalog /Pages 2 0 R >>".to_string(),"<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>".into(),
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>".into(),
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>".into(),
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>".into(),
        format!("<< /Length {} >>\nstream\n{}\nendstream",first.len(),first),format!("<< /Length {} >>\nstream\n{}\nendstream",second.len(),second)];
        let mut bytes = b"%PDF-1.4\n".to_vec();
        let mut offsets = vec![];
        for (i, obj) in objects.iter().enumerate() {
            offsets.push(bytes.len());
            bytes.extend_from_slice(format!("{} 0 obj\n{}\nendobj\n", i + 1, obj).as_bytes());
        }
        let xref = bytes.len();
        bytes.extend_from_slice(b"xref\n0 8\n0000000000 65535 f \n");
        for offset in offsets {
            bytes.extend_from_slice(format!("{offset:010} 00000 n \n").as_bytes());
        }
        bytes.extend_from_slice(
            format!("trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF").as_bytes(),
        );
        bytes
    }
    let sections = documents::extract(std::path::Path::new("test.pdf"), &pdf(true)).unwrap();
    assert_eq!(sections.len(), 2);
    assert_eq!(sections[1].0, "strona 2");
    assert!(sections[1].1.contains("Second page"));
    assert!(
        documents::extract(std::path::Path::new("scan.pdf"), &pdf(false))
            .unwrap_err()
            .contains("wymaga odczytu skanu")
    );
}

#[test]
fn library_index_discovers_new_programs_and_keeps_scope_inside_the_subfolder() {
    tauri::async_runtime::block_on(async {
        let pool = pool().await;
        let root = std::env::temp_dir().join(format!("ozipz-library-index-{}", std::process::id()));
        std::fs::create_dir_all(root.join("Higiena naszą tarczą/2026")).unwrap();
        std::fs::write(
            root.join("Higiena naszą tarczą/2026/regulamin.txt"),
            "Materiały HNT z edycji 2026",
        )
        .unwrap();
        let mut cfg = Config {
            root_folder: root.to_string_lossy().into(),
            ..Config::default()
        };
        storage::save_config(&pool, &cfg).await.unwrap();
        cfg = storage::config(&pool).await.unwrap();
        assert_eq!(cfg.programs.len(), 1);
        let hnt = cfg.programs[0].id.clone();
        index::refresh(&pool, &cfg).await.unwrap();
        std::fs::create_dir_all(root.join("Inny program")).unwrap();
        std::fs::write(root.join("Inny program/opis.txt"), "Inne zasady, nie HNT").unwrap();
        cfg = storage::config(&pool).await.unwrap();
        assert_eq!(cfg.programs.len(), 2);
        index::refresh(&pool, &cfg).await.unwrap();
        let hits = index::search(&pool, &hnt, "zasady", 0).await.unwrap();
        assert_eq!(hits.len(), 1);
        assert!(hits[0].path.contains("Higiena naszą tarczą"));
        std::fs::remove_dir_all(root.join("Inny program")).unwrap();
        index::refresh(&pool, &cfg).await.unwrap();
        assert_eq!(index::statuses(&pool).await.unwrap().len(), 1);
        std::fs::remove_dir_all(root).unwrap();
    });
}
