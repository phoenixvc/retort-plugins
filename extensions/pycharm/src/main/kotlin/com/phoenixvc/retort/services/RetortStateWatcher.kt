package com.phoenixvc.retort.services

import com.intellij.openapi.Disposable
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.vfs.VirtualFileManager
import com.intellij.openapi.vfs.newvfs.BulkFileListener
import com.intellij.openapi.vfs.newvfs.events.VFileEvent
import com.intellij.util.messages.MessageBusConnection
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Project-level service that watches the Retort state files produced by
 * the orchestrator and notifies registered listeners when they change.
 *
 * Watched paths (relative to project root):
 *   .claude/state/orchestrator.json  — current phase / session state
 *   .agentkit/backlog.md             — backlog changes (modification time only)
 */
@Service(Service.Level.PROJECT)
class RetortStateWatcher(private val project: Project) : Disposable {

    /** Snapshot of the orchestrator state file. */
    @Serializable
    data class OrchestratorState(
        val phase: Int? = null,
        val orchestratorId: String? = null,
        val activeTaskCount: Int = 0,
        val lastUpdated: String = "",
    )

    interface StateListener {
        fun onOrchestratorStateChanged(state: OrchestratorState?)
        fun onBacklogChanged()
    }

    private val listeners = CopyOnWriteArrayList<StateListener>()
    private var connection: MessageBusConnection? = null

    private val json = Json { ignoreUnknownKeys = true }

    /** Current cached state; null when the state file is absent or unreadable. */
    @Volatile
    var currentState: OrchestratorState? = null
        private set

    init {
        startWatching()
    }

    fun addListener(listener: StateListener) {
        listeners.add(listener)
    }

    fun removeListener(listener: StateListener) {
        listeners.remove(listener)
    }

    /** Read the orchestrator state file and return the parsed result. */
    fun readOrchestratorState(): OrchestratorState? {
        val root = project.basePath ?: return null
        val file = File(root, ".claude/state/orchestrator.json")
        if (!file.exists()) return null
        return try {
            json.decodeFromString(OrchestratorState.serializer(), file.readText())
        } catch (_: Exception) {
            null
        }
    }

    private fun startWatching() {
        val conn = project.messageBus.connect()
        connection = conn

        conn.subscribe(VirtualFileManager.VFS_CHANGES, object : BulkFileListener {
            override fun after(events: List<VFileEvent>) {
                val root = project.basePath ?: return
                val orchestratorPath = File(root, ".claude/state/orchestrator.json").canonicalPath
                val backlogPath = File(root, ".agentkit/backlog.md").canonicalPath

                var stateChanged = false
                var backlogChanged = false

                for (event in events) {
                    val path = event.path
                    when {
                        path == orchestratorPath -> stateChanged = true
                        path == backlogPath -> backlogChanged = true
                    }
                }

                if (stateChanged) {
                    currentState = readOrchestratorState()
                    listeners.forEach { it.onOrchestratorStateChanged(currentState) }
                }
                if (backlogChanged) {
                    listeners.forEach { it.onBacklogChanged() }
                }
            }
        })

        // Seed initial state
        currentState = readOrchestratorState()
    }

    override fun dispose() {
        connection?.disconnect()
        connection = null
        listeners.clear()
    }
}
