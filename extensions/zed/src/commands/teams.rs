use std::fs;
use std::path::Path;
use zed_extension_api::{SlashCommandOutput, SlashCommandOutputSection};

pub fn run(root: &str) -> Result<SlashCommandOutput, String> {
    // Try AGENT_TEAMS.md first
    let md_path = Path::new(root).join("AGENT_TEAMS.md");
    let content = if md_path.exists() {
        fs::read_to_string(&md_path).unwrap_or_default()
    } else {
        String::from("No AGENT_TEAMS.md found. Run `retort sync` to generate.")
    };

    // Extract team headers (## lines)
    let teams: Vec<&str> = content
        .lines()
        .filter(|l| l.starts_with("## ") && !l.starts_with("## Overview"))
        .collect();

    let text = if teams.is_empty() {
        format!(
            "## Retort Teams\n\n{}",
            content.lines().take(20).collect::<Vec<_>>().join("\n")
        )
    } else {
        format!("## Retort Teams\n\n{}", teams.join("\n"))
    };

    Ok(SlashCommandOutput {
        sections: vec![SlashCommandOutputSection {
            range: 0..text.len(),
            label: "Retort Teams".to_string(),
        }],
        text,
    })
}
