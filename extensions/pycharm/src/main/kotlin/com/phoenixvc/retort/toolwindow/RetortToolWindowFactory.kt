package com.phoenixvc.retort.toolwindow

import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import com.phoenixvc.retort.services.RetortStateWatcher
import com.phoenixvc.retort.util.AgentKitBin

/**
 * Creates the "Retort" tool window panel shown in the IDE side bar.
 *
 * The window is only made available when the project contains a .agentkit
 * directory — checked in [isApplicable].
 */
class RetortToolWindowFactory : ToolWindowFactory, DumbAware {

    override fun isApplicable(project: Project): Boolean {
        val root = project.basePath ?: return false
        return AgentKitBin.isRetortProject(root)
    }

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val panel = RetortToolWindowPanel(project)
        val content = ContentFactory.getInstance()
            .createContent(panel, /* displayName = */ null, /* isLockable = */ false)
        toolWindow.contentManager.addContent(content)
    }
}
