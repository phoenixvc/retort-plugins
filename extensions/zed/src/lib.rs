use zed_extension_api::{self as zed, SlashCommand, SlashCommandOutput, SlashCommandOutputSection, Worktree};

mod commands;
mod parsers;

struct RetortExtension;

impl zed::Extension for RetortExtension {
    fn new() -> Self {
        RetortExtension
    }

    fn run_slash_command(
        &self,
        command: SlashCommand,
        _args: Vec<String>,
        worktree: Option<&Worktree>,
    ) -> Result<SlashCommandOutput, String> {
        let root = worktree
            .and_then(|wt| wt.root_path().to_str().map(|s| s.to_string()))
            .unwrap_or_default();

        match command.name.as_str() {
            "retort-status" => commands::status::run(&root),
            "retort-teams" => commands::teams::run(&root),
            "retort-backlog" => commands::backlog::run(&root),
            "retort-sync" => commands::sync::run(&root),
            _ => Err(format!("Unknown command: {}", command.name)),
        }
    }
}

zed::register_extension!(RetortExtension);
