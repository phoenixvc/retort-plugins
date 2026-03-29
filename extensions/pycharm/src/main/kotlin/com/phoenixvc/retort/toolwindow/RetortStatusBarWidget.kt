package com.phoenixvc.retort.toolwindow

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.wm.impl.status.EditorBasedWidget
import com.intellij.util.Consumer
import com.phoenixvc.retort.services.RetortStateWatcher
import com.phoenixvc.retort.services.RetortTerminalService
import java.awt.event.MouseEvent

/**
 * Status bar widget that shows the current Retort orchestrator phase.
 *
 * - Displays "Retort" when no state file is present (.agentkit exists but
 *   the orchestrator hasn't written state yet).
 * - Displays "Retort · Phase N" when the orchestrator state file is found.
 * - Clicking the widget runs `agentkit project-status`.
 */
class RetortStatusBarWidget(project: Project) :
    EditorBasedWidget(project),
    StatusBarWidget.TextPresentation {

    companion object {
        const val ID = "RetortStatusWidget"
    }

    private val watcher: RetortStateWatcher = project.getService(RetortStateWatcher::class.java)
    private val terminal: RetortTerminalService = project.getService(RetortTerminalService::class.java)

    private val stateListener = object : RetortStateWatcher.StateListener {
        override fun onOrchestratorStateChanged(state: RetortStateWatcher.OrchestratorState?) {
            myStatusBar?.updateWidget(ID)
        }

        override fun onBacklogChanged() {
            // Not reflected in the status bar — no-op
        }
    }

    override fun ID(): String = ID

    override fun getPresentation(): StatusBarWidget.WidgetPresentation = this

    override fun install(statusBar: StatusBar) {
        super.install(statusBar)
        watcher.addListener(stateListener)
    }

    override fun dispose() {
        watcher.removeListener(stateListener)
        super.dispose()
    }

    // -------------------------------------------------------------------------
    // TextPresentation
    // -------------------------------------------------------------------------

    override fun getText(): String {
        val state = watcher.currentState
        return if (state?.phase != null) "Retort · Phase ${state.phase}" else "Retort"
    }

    override fun getTooltipText(): String = "Click to run Retort project-status"

    override fun getClickConsumer(): Consumer<MouseEvent> = Consumer {
        terminal.run("project-status")
    }
}
