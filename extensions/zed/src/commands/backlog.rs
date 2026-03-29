use std::fs;
use std::path::Path;
use zed_extension_api::{SlashCommandOutput, SlashCommandOutputSection};

pub fn run(root: &str) -> Result<SlashCommandOutput, String> {
    let path = Path::new(root).join("AGENT_BACKLOG.md");
    let content = fs::read_to_string(&path)
        .unwrap_or_else(|_| String::from("No AGENT_BACKLOG.md found."));

    let open: Vec<&str> = content
        .lines()
        .filter(|l| l.contains("- [ ]"))
        .take(20)
        .collect();

    let text = if open.is_empty() {
        "## Retort Backlog\n\nNo open items.".to_string()
    } else {
        format!("## Retort Backlog\n\n{}", open.join("\n"))
    };

    Ok(SlashCommandOutput {
        sections: vec![SlashCommandOutputSection {
            range: 0..text.len(),
            label: "Retort Backlog".to_string(),
        }],
        text,
    })
}
