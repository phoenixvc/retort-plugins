package com.phoenixvc.retort.junie

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import java.io.File

/**
 * Reads Retort workspace state and formats it as a Junie context block.
 *
 * This service is registered in junie.xml (loaded only when Junie is installed).
 *
 * TODO: Once JetBrains publishes a stable `com.intellij.junie.ext.JunieContextProvider`
 *       extension point, implement that interface here so Retort context is automatically
 *       injected into every Junie AI session.
 *
 * Usage (when Junie API is available):
 *   val service = project.getService(RetortWorkspaceContextService::class.java)
 *   val context = service.buildContext()  // inject into Junie session
 */
@Service(Service.Level.PROJECT)
class RetortWorkspaceContextService(private val project: Project) {

    /**
     * Returns a markdown-formatted context block describing the active Retort workspace:
     * - Active orchestration phase
     * - In-progress tasks
     * - Team roster (from .agentkit/spec/teams.yaml or AGENT_TEAMS.md)
     */
    fun buildContext(): String {
        val root = project.basePath ?: return ""
        val sections = mutableListOf<String>()

        // Orchestration phase
        val sessionFile = File(root, ".claude/state/orchestrator.json")
        if (sessionFile.exists()) {
            try {
                val text = sessionFile.readText()
                val phaseMatch = Regex(""""phase"\s*:\s*(\d+)""").find(text)
                val phase = phaseMatch?.groupValues?.get(1)?.toIntOrNull()
                if (phase != null) {
                    val phaseName = PHASE_NAMES[phase] ?: "Phase $phase"
                    sections += "**Active phase:** $phaseName"
                }
            } catch (_: Exception) { /* ignore */ }
        }

        // In-progress tasks
        val tasksDir = File(root, ".claude/state/tasks")
        if (tasksDir.isDirectory) {
            val inProgress = tasksDir.listFiles { f -> f.extension == "json" }
                ?.mapNotNull { f ->
                    try {
                        val text = f.readText()
                        if (text.contains(""""status":"working"""") || text.contains(""""status":"accepted"""")) {
                            Regex(""""title"\s*:\s*"([^"]+)"""").find(text)?.groupValues?.get(1)
                        } else null
                    } catch (_: Exception) { null }
                }
                ?: emptyList()

            if (inProgress.isNotEmpty()) {
                sections += "**In-progress tasks:**\n" + inProgress.joinToString("\n") { "- $it" }
            }
        }

        // Teams
        val teamsYaml = sequenceOf(
            ".agentkit/spec/teams.yaml",
            ".agentkit/spec/AGENT_TEAMS.yaml",
            "AGENT_TEAMS.md",
        ).map { File(root, it) }.firstOrNull { it.exists() }

        if (teamsYaml != null) {
            sections += "**Retort teams file:** `${teamsYaml.name}` (use `/team-<id>` commands to delegate work)"
        }

        if (sections.isEmpty()) return ""

        return buildString {
            appendLine("<!-- Retort Workspace Context -->")
            sections.forEach { appendLine(it).appendLine() }
        }.trim()
    }

    companion object {
        private val PHASE_NAMES = mapOf(
            1 to "Discovery",
            2 to "Planning",
            3 to "Implementation",
            4 to "Validation",
            5 to "Ship",
        )
    }
}
