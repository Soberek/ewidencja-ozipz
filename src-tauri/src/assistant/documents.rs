use super::types::{err, hash, Source};
use std::{io::Read, path::Path};

pub const MAX_FILE_BYTES: u64 = 25 * 1024 * 1024;
pub fn read_bytes(path: &Path) -> Result<Vec<u8>, String> {
    if std::fs::metadata(path).map_err(err)?.len() > MAX_FILE_BYTES {
        return Err("Plik przekracza limit 25 MB".into());
    }
    std::fs::read(path).map_err(err)
}
pub fn extract(path: &Path, bytes: &[u8]) -> Result<Vec<(String, String)>, String> {
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "txt" | "md" => Ok(vec![(
            "tekst".into(),
            String::from_utf8(bytes.to_vec())
                .map_err(|_| "Plik tekstowy wymaga kodowania UTF-8")?,
        )]),
        "docx" => {
            let mut archive = zip::ZipArchive::new(std::io::Cursor::new(bytes)).map_err(err)?;
            let mut xml = String::new();
            archive
                .by_name("word/document.xml")
                .map_err(err)?
                .take(MAX_FILE_BYTES + 1)
                .read_to_string(&mut xml)
                .map_err(err)?;
            if xml.len() as u64 > MAX_FILE_BYTES {
                return Err("Zbyt duży dokument po rozpakowaniu".into());
            }
            let mut reader = quick_xml::Reader::from_str(&xml);
            let mut text = String::new();
            loop {
                use quick_xml::events::Event;
                match reader.read_event().map_err(err)? {
                    Event::Text(t) => {
                        let decoded = t.decode().map_err(err)?;
                        text.push_str(&quick_xml::escape::unescape(&decoded).map_err(err)?);
                    }
                    Event::GeneralRef(r) => {
                        let s = format!("&{};", r.decode().map_err(err)?);
                        text.push_str(&quick_xml::escape::unescape(&s).map_err(err)?);
                    }
                    Event::End(e) if e.name().as_ref() == b"w:p" => text.push_str("\n\n"),
                    Event::Empty(e) if e.name().as_ref() == b"w:tab" => text.push('\t'),
                    Event::Empty(e) if e.name().as_ref() == b"w:br" => text.push('\n'),
                    Event::Eof => break,
                    _ => {}
                }
            }
            Ok(vec![("akapit".into(), text)])
        }
        "pdf" => {
            let text = pdf_extract::extract_text_from_mem(bytes).map_err(err)?;
            if text.trim().chars().filter(|c| c.is_alphanumeric()).count() < 10 {
                return Err("wymaga odczytu skanu".into());
            }
            Ok(pdf_extract::extract_text_from_mem_by_pages(bytes)
                .map_err(err)?
                .into_iter()
                .enumerate()
                .map(|(i, text)| (format!("strona {}", i + 1), text))
                .collect())
        }
        _ => Err("Nieobsługiwany format".into()),
    }
}
pub fn chunks(path: &str, version: &str, sections: Vec<(String, String)>) -> Vec<Source> {
    let mut result = vec![];
    for (location, text) in sections {
        for (paragraph, block) in text.split("\n\n").enumerate() {
            let chars: Vec<char> = block.trim().chars().collect();
            for (part, piece) in chars.chunks(2400).enumerate() {
                let text: String = piece.iter().collect();
                if text.trim().is_empty() {
                    continue;
                }
                let location = format!("{location}, fragment {}.{}", paragraph + 1, part + 1);
                result.push(Source {
                    id: hash(format!("{path}|{version}|{location}")),
                    path: path.into(),
                    location,
                    version: version.into(),
                    text,
                    fetched_at: None,
                });
            }
        }
    }
    result
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn polish_text_has_stable_nonempty_chunks() {
        let text = "Zażółć gęślą jaźń. ".repeat(1000);
        let values = chunks("pismo.txt", "v1", vec![("tekst".into(), text.clone())]);
        assert!(values.len() > 1);
        assert!(values.iter().all(|s| s.text.chars().count() <= 2400));
        assert_eq!(
            values.iter().map(|s| s.text.clone()).collect::<String>(),
            text.trim()
        );
        assert_ne!(
            values[0].id,
            chunks("pismo.txt", "v2", vec![("tekst".into(), text)])[0].id
        );
    }
}
