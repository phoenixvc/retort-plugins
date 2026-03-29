package com.phoenixvc.retort.actions

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.phoenixvc.retort.services.RetortTerminalService
import com.phoenixvc.retort.util.AgentKitBin

/**
 * A generic action that maps a menu item to a single agentkit subcommand.
 *
 * The subcommand is derived from the action ID registered in plugin.xml:
 * the part after the last dot is used as the command name, with any
 * camelCase suffix converted to kebab-case.
 * e.g. "retort.projectStatus" → "project-status"
 *
 * This means every command in the menu group shares one action class and
 * the mapping is driven entirely by the action ID in plugin.xml.
 */
class RetortRunAction : AnAction() {

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT

    override fun update(e: AnActionEvent) {
        val project = e.project
        e.presentation.isEnabled = project != null &&
            AgentKitBin.isRetortProject(project.basePath ?: "")
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val terminal = project.getService(RetortTerminalService::class.java)
        val command = resolveCommand(e) ?: return
        terminal.run(command)
    }

    private fun resolveCommand(e: AnActionEvent): String? {
        // e.g. "retort.projectStatus" → "project-status"
        val id = e.actionManager.getId(this) ?: return null
        val suffix = id.substringAfterLast('.', id)
        return suffix.replace(Regex("([A-Z])")) { "-${it.value.lowercase()}" }
    }
}
