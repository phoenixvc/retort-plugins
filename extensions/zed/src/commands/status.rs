use std::fs;
use std::path::Path;
use zed_extension_api::{SlashCommandOutput, SlashCommandOutputSection};
use crate::parsers::tasks::{parse_task_file, AgentTask};

pub fn run(root: &str) -> Result<SlashCommandOutput, String> {
    let tasks_dir = Path::new(root).join(".claude").join("state").join("tasks");

    let mut active: Vec<AgentTask> = Vec::new();
    let mut recent: Vec<AgentTask> = Vec::new();

    if tasks_dir.exists() {
        for entry in fs::read_dir(&tasks_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            if entry.path().extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(task) = parse_task_file(&entry.path()) {
                    match task.status.as_str() {
                        "submitted" | "accepted" | "working" => active.push(task),
                        "completed" | "failed" => recent.push(task),
                        _ => {}
                    }
                }
            }
        }
    }

    let mut text = String::from("## Retort Agent Status\n\n");

    if active.is_empty() {
        text.push_str("No active agents.\n");
    } else {
        text.push_str("### Active\n\n");
        for task in &active {
            let progress = match (task.turn, task.max_turns) {
                (Some(t), Some(m)) => format!(" (turn {t}/{m})"),
                _ => String::new(),
            };
            let assigned = task.assigned_to.as_deref().unwrap_or("unassigned");
            text.push_str(&format!(
                "- **[{}]** {} — `{}`{}\n",
                task.status.to_uppercase(),
                task.title,
                assigned,
                progress
            ));
        }
    }

    if !recent.is_empty() {
        text.push_str("\n### Recently Completed\n\n");
        for task in recent.iter().take(5) {
            text.push_str(&format!(
                "- {} {}\n",
                if task.status == "completed" { "✓" } else { "✗" },
                task.title
            ));
        }
    }

    Ok(SlashCommandOutput {
        sections: vec![SlashCommandOutputSection {
            range: 0..text.len(),
            label: "Retort Status".to_string(),
        }],
        text,
    })
}
