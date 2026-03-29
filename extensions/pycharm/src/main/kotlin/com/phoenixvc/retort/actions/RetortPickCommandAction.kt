package com.phoenixvc.retort.actions

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.popup.JBPopupFactory
import com.intellij.ui.SimpleListCellRenderer
import com.phoenixvc.retort.services.RetortTerminalService
import com.phoenixvc.retort.util.AgentKitBin

/**
 * "Run Command..." action — shows a searchable popup with all available
 * Retort commands, then runs the selected one.
 *
 * Mirrors the VS Code `retort.runCommand` quick-pick.
 */
class RetortPickCommandAction : AnAction() {

    private data class CommandEntry(val label: String, val command: String, val description: String)

    private val commands = listOf(
        CommandEntry("sync", "sync", "Regenerate all AI tool configs from spec"),
        CommandEntry("check", "check", "Run lint + typecheck + tests"),
        CommandEntry("healthcheck", "healthcheck", "Full repo health check"),
        CommandEntry("orchestrate", "orchestrate", "Master coordinator — assess, plan, delegate"),
        CommandEntry("plan", "plan", "Structured implementation planning"),
        CommandEntry("discover", "discover", "Scan repo structure and tech stacks"),
        CommandEntry("validate", "validate", "Validate spec against schema"),
        CommandEntry("backlog", "backlog", "Show consolidated backlog"),
        CommandEntry("handoff", "handoff", "Generate session handoff document"),
        CommandEntry("preflight", "preflight", "Pre-ship delivery checks"),
        CommandEntry("security", "security", "Security audit"),
        CommandEntry("project-status", "project-status", "Unified PM dashboard"),
    )

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT

    override fun update(e: AnActionEvent) {
        val project = e.project
        e.presentation.isEnabled = project != null &&
            AgentKitBin.isRetortProject(project.basePath ?: "")
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val terminal = project.getService(RetortTerminalService::class.java)

        JBPopupFactory.getInstance()
            .createPopupChooserBuilder(commands)
            .setTitle("Retort: Run Command")
            .setRenderer(SimpleListCellRenderer.create("") { entry ->
                "${entry.label}  —  ${entry.description}"
            })
            .setItemChosenCallback { entry -> terminal.run(entry.command) }
            .setFilteringEnabled { entry -> "${entry.label} ${entry.description}" }
            .setNamerForFiltering { entry -> "${entry.label} ${entry.description}" }
            .createPopup()
            .showInFocusCenter()
    }
}
