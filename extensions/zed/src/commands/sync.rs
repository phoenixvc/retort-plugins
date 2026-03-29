use zed_extension_api::{SlashCommandOutput, SlashCommandOutputSection};

pub fn run(_root: &str) -> Result<SlashCommandOutput, String> {
    let text = "## Retort Sync\n\nRun the following in your terminal to sync Retort configs:\n\n```sh\nretort sync\n```\n\nThis regenerates all AI tool configs (CLAUDE.md, .cursor/rules/, .github/instructions/, etc.) from your `.agentkit/spec/` YAML files.".to_string();

    Ok(SlashCommandOutput {
        sections: vec![SlashCommandOutputSection {
            range: 0..text.len(),
            label: "Retort Sync".to_string(),
        }],
        text,
    })
}
