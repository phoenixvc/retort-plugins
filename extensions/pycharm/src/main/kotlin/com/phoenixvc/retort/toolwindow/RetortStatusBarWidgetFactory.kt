package com.phoenixvc.retort.toolwindow

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.wm.StatusBarWidgetFactory
import com.phoenixvc.retort.util.AgentKitBin

/**
 * Registers the Retort status bar widget with the IDE.
 *
 * The widget is only shown for projects that contain a .agentkit directory.
 */
class RetortStatusBarWidgetFactory : StatusBarWidgetFactory {

    override fun getId(): String = RetortStatusBarWidget.ID

    override fun getDisplayName(): String = "Retort"

    override fun isAvailable(project: Project): Boolean {
        val root = project.basePath ?: return false
        return AgentKitBin.isRetortProject(root)
    }

    override fun createWidget(project: Project): StatusBarWidget =
        RetortStatusBarWidget(project)

    override fun disposeWidget(widget: StatusBarWidget) {
        widget.dispose()
    }

    override fun canBeEnabledOn(statusBar: StatusBar): Boolean = true
}
