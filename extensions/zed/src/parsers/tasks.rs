use serde::Deserialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentTask {
    pub id: String,
    pub title: String,
    pub status: String,
    pub assigned_to: Option<String>,
    pub turn: Option<u32>,
    pub max_turns: Option<u32>,
}

pub fn parse_task_file(path: &Path) -> Result<AgentTask, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}
