use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ProgramFolder {
    pub id: String,
    pub name: String,
    pub aliases: Vec<String>,
    pub folder: String,
    pub edition: String,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub model: String,
    pub monthly_limit_usd: f64,
    #[serde(default)]
    pub root_folder: String,
    pub programs: Vec<ProgramFolder>,
    pub style_files: Vec<String>,
    pub template_path: String,
    pub domains: Vec<String>,
    pub style: String,
    pub style_approved: bool,
}
impl Default for Config {
    fn default() -> Self {
        Self {
            model: "google/gemini-3.1-flash-lite".into(),
            monthly_limit_usd: 5.0,
            root_folder: String::new(),
            programs: vec![],
            style_files: vec![],
            template_path: String::new(),
            domains: vec![],
            style: String::new(),
            style_approved: false,
        }
    }
}
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Source {
    pub id: String,
    pub path: String,
    pub location: String,
    pub version: String,
    pub text: String,
    pub fetched_at: Option<String>,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentStatus {
    pub path: String,
    pub status: String,
}
pub fn hash(text: impl AsRef<[u8]>) -> String {
    use sha2::{Digest, Sha256};
    format!("{:x}", Sha256::digest(text.as_ref()))
}
pub fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}
