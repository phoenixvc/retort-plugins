package com.phoenixvc.retort.toolwindow

import com.intellij.openapi.project.Project
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import com.intellij.util.ui.JBUI
import com.phoenixvc.retort.services.RetortStateWatcher
import com.phoenixvc.retort.services.RetortTerminalService
import java.awt.BorderLayout
import java.awt.FlowLayout
import java.awt.GridLayout
import javax.swing.*

/**
 * Main UI panel for the Retort tool window.
 *
 * Displays:
 *   - Current orchestrator phase (if a state file exists)
 *   - Quick-action buttons for the most-used Retort commands
 *   - A live backlog-changed notice when .agentkit/backlog.md is updated
 */
class RetortToolWindowPanel(private val project: Project) : JBPanel<RetortToolWindowPanel>(BorderLayout()) {

    private val terminal = project.getService(RetortTerminalService::class.java)
    private val watcher = project.getService(RetortStateWatcher::class.java)

    private val phaseLabel = JBLabel("Phase: —").apply {
        border = JBUI.Borders.emptyLeft(4)
    }
    private val backlogNotice = JBLabel("").apply {
        isVisible = false
        border = JBUI.Borders.emptyLeft(4)
    }

    init {
        border = JBUI.Borders.empty(8)
        buildUi()
        refreshPhase(watcher.currentState)
        registerWatcher()
    }

    // -------------------------------------------------------------------------
    // UI construction
    // -------------------------------------------------------------------------

    private fun buildUi() {
        // Header: phase + backlog notice
        val header = JBPanel<JBPanel<*>>(BorderLayout()).apply {
            add(phaseLabel, BorderLayout.NORTH)
            add(backlogNotice, BorderLayout.CENTER)
        }
        add(header, BorderLayout.NORTH)

        // Command buttons grid
        val buttonPanel = JBPanel<JBPanel<*>>(GridLayout(0, 2, 6, 6)).apply {
            border = JBUI.Borders.emptyTop(8)
            COMMANDS.forEach { (label, cmd) ->
                add(commandButton(label, cmd))
            }
        }
        add(JBScrollPane(buttonPanel), BorderLayout.CENTER)
    }

    private fun commandButton(label: String, command: String): JButton =
        JButton(label).apply {
            addActionListener { terminal.run(command) }
            toolTipText = "Run: agentkit $command"
        }

    // -------------------------------------------------------------------------
    // State watcher
    // -------------------------------------------------------------------------

    private fun registerWatcher() {
        watcher.addListener(object : RetortStateWatcher.StateListener {
            override fun onOrchestratorStateChanged(state: RetortStateWatcher.OrchestratorState?) {
                SwingUtilities.invokeLater { refreshPhase(state) }
            }

            override fun onBacklogChanged() {
                SwingUtilities.invokeLater {
                    backlogNotice.text = "Backlog updated"
                    backlogNotice.isVisible = true
                }
            }
        })
    }

    private fun refreshPhase(state: RetortStateWatcher.OrchestratorState?) {
        phaseLabel.text = if (state?.phase != null) "Phase: ${state.phase}" else "Phase: —"
    }

    // -------------------------------------------------------------------------
    // Command definitions (mirrors the VS Code command registry)
    // -------------------------------------------------------------------------

    companion object {
        private val COMMANDS = listOf(
            "Sync" to "sync",
            "Check" to "check",
            "Health Check" to "healthcheck",
            "Orchestrate" to "orchestrate",
            "Plan" to "plan",
            "Discover" to "discover",
            "Validate" to "validate",
            "Backlog" to "backlog",
            "Handoff" to "handoff",
            "Preflight" to "preflight",
            "Security" to "security",
            "Project Status" to "project-status",
        )
    }
}
