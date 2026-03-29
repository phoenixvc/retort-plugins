package com.phoenixvc.retort.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindowManager
import com.phoenixvc.retort.util.AgentKitBin
import com.intellij.terminal.JBTerminalWidget
import com.intellij.openapi.application.ApplicationManager
import org.jetbrains.plugins.terminal.ShellTerminalWidget
import org.jetbrains.plugins.terminal.TerminalView

/**
 * Project-level service responsible for running Retort / agentkit commands
 * inside the IDE's integrated terminal.
 *
 * Each command is sent to a dedicated "Retort" terminal tab; if the tab
 * already exists it is reused rather than spawning a new one.
 */
@Service(Service.Level.PROJECT)
class RetortTerminalService(private val project: Project) {

    private val tabName = "Retort"

    /**
     * Run an agentkit command with optional arguments.
     * e.g. run("sync") → `agentkit sync` (or `npx agentkit sync`)
     */
    fun run(command: String, vararg args: String) {
        val root = project.basePath ?: return
        val bin = AgentKitBin.resolve(root)
        val argStr = if (args.isNotEmpty()) " ${args.joinToString(" ")}" else ""
        val fullCmd = "$bin $command$argStr"

        ApplicationManager.getApplication().invokeLater {
            val terminalView = TerminalView.getInstance(project)
            val existing = findRetortTab(terminalView)
            if (existing != null) {
                existing.executeCommand(fullCmd)
            } else {
                terminalView.createLocalShellWidget(root, tabName).also { widget ->
                    widget.executeCommand(fullCmd)
                }
            }
        }
    }

    // TerminalView doesn't expose a typed tab list via a stable API, so we
    // rely on the widget title. If this becomes fragile, consider tracking
    // the widget instance in a field instead.
    private fun findRetortTab(view: TerminalView): ShellTerminalWidget? =
        view.getWidgets().filterIsInstance<ShellTerminalWidget>()
            .firstOrNull { it.terminalTitle.buildTitle() == tabName }
}
