use super::types::{err, hash, Config, ProgramFolder};
use std::path::Path;

/// Each immediate subdirectory is a program. Its entire subtree is its library.
/// Discovery is local and does not send documents or folder paths to a model.
pub fn discover(config: &Config) -> Result<Vec<ProgramFolder>, String> {
    if config.root_folder.is_empty() {
        return Ok(config.programs.clone());
    }
    let root = std::fs::canonicalize(&config.root_folder)
        .map_err(|e| format!("Nie można odczytać wspólnego folderu materiałów: {e}"))?;
    let mut programs = vec![];
    for entry in std::fs::read_dir(&root).map_err(err)? {
        let entry = entry.map_err(err)?;
        if !entry.file_type().map_err(err)?.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        let path = entry.path();
        let previous = config
            .programs
            .iter()
            .find(|p| std::fs::canonicalize(&p.folder).ok().as_deref() == Some(path.as_path()));
        programs.push(ProgramFolder {
            id: previous
                .map(|p| p.id.clone())
                .unwrap_or_else(|| hash(path.to_string_lossy().as_bytes())),
            name,
            folder: path.to_string_lossy().into_owned(),
            edition: String::new(),
            aliases: previous.map(|p| p.aliases.clone()).unwrap_or_default(),
        });
    }
    programs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(programs)
}
pub fn normalize(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| match c {
            'ą' => 'a',
            'ć' => 'c',
            'ę' => 'e',
            'ł' => 'l',
            'ń' => 'n',
            'ó' => 'o',
            'ś' => 's',
            'ź' | 'ż' => 'z',
            c if c.is_alphanumeric() => c,
            _ => ' ',
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
pub fn matching(request: &str, programs: &[ProgramFolder]) -> Vec<String> {
    let request = format!(" {} ", normalize(request));
    programs
        .iter()
        .filter(|p| {
            let mut names = vec![normalize(&p.name)];
            names.extend(p.aliases.iter().map(|s| normalize(s)));
            let words = normalize(&p.name);
            let acronym: String = words
                .split_whitespace()
                .filter_map(|w| w.chars().next())
                .collect();
            if acronym.len() >= 3 {
                names.push(acronym.clone());
                names.push(acronym.chars().take(3).collect());
            }
            names
                .into_iter()
                .any(|name| !name.is_empty() && request.contains(&format!(" {name} ")))
        })
        .map(|p| p.id.clone())
        .collect()
}
pub fn is_inside_root(path: &Path, config: &Config) -> bool {
    !config.root_folder.is_empty()
        && std::fs::canonicalize(&config.root_folder).is_ok_and(|root| path.starts_with(root))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn one_root_discovers_programs_and_preserves_nested_materials() {
        let root = std::env::temp_dir().join(format!("ozipz-library-{}", std::process::id()));
        std::fs::create_dir_all(root.join("Higiena naszą tarczą/2026/Regulaminy")).unwrap();
        std::fs::create_dir_all(root.join("Porozmawiajmy o zdrowiu i nowych zagrożeniach"))
            .unwrap();
        std::fs::write(root.join("notatka.txt"), "Nie jest osobnym programem").unwrap();
        let config = Config {
            root_folder: root.to_string_lossy().into(),
            ..Config::default()
        };
        let programs = discover(&config).unwrap();
        assert_eq!(programs.len(), 2);
        assert!(programs.iter().all(|p| p.edition.is_empty()));
        let hnt = programs
            .iter()
            .find(|p| p.name == "Higiena naszą tarczą")
            .unwrap();
        assert_eq!(
            matching("Napisz pismo o HNT", &programs),
            vec![hnt.id.clone()]
        );
        assert_eq!(
            matching("higiena nasza tarcza", &programs),
            vec![hnt.id.clone()]
        );
        assert!(matching("HNTabc", &programs).is_empty());
        assert!(matching("Inny program", &programs).is_empty());
        std::fs::create_dir_all(root.join("Nowy program")).unwrap();
        let updated = discover(&config).unwrap();
        assert_eq!(updated.len(), 3);
        assert_eq!(
            updated.iter().find(|p| p.name == hnt.name).unwrap().id,
            hnt.id
        );
        std::fs::remove_dir_all(root.join("Nowy program")).unwrap();
        assert_eq!(discover(&config).unwrap().len(), 2);
        std::fs::remove_dir_all(root).unwrap();
        assert!(discover(&config).is_err());
    }
    #[test]
    fn old_configuration_deserializes_and_colliding_acronyms_do_not_guess() {
        let mut value = serde_json::to_value(Config::default()).unwrap();
        value.as_object_mut().unwrap().remove("rootFolder");
        let cfg: Config = serde_json::from_value(value).unwrap();
        assert!(cfg.root_folder.is_empty());
        let programs = vec![
            ProgramFolder {
                id: "a".into(),
                name: "Higiena naszą tarczą".into(),
                ..ProgramFolder::default()
            },
            ProgramFolder {
                id: "b".into(),
                name: "Higiena naszą tarczą ochronną".into(),
                ..ProgramFolder::default()
            },
        ];
        assert_eq!(matching("HNT", &programs).len(), 2);
    }
    #[cfg(unix)]
    #[test]
    fn discovery_does_not_follow_symlinks_outside_the_root() {
        let root = std::env::temp_dir().join(format!("ozipz-library-links-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        std::os::unix::fs::symlink(std::env::temp_dir(), root.join("Obce materiały")).unwrap();
        let cfg = Config {
            root_folder: root.to_string_lossy().into(),
            ..Config::default()
        };
        assert!(discover(&cfg).unwrap().is_empty());
        std::fs::remove_dir_all(root).unwrap();
    }
}
