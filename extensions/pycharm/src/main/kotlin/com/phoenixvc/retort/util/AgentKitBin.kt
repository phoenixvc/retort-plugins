package com.phoenixvc.retort.util

import java.io.File

/**
 * Resolves the agentkit binary to use for a given project root.
 *
 * Mirrors the logic in the VS Code TerminalService: prefer a local
 * node_modules install over the globally-available binary so that
 * projects pinned to a specific version always run the right one.
 */
object AgentKitBin {

    /**
     * Returns the shell command string used to invoke agentkit.
     * e.g. "npx agentkit" when a local install is found, "agentkit" otherwise.
     */
    fun resolve(projectRoot: String): String {
        val local = File(projectRoot, "node_modules/.bin/agentkit")
        val localCmd = File(projectRoot, "node_modules/.bin/agentkit.cmd")
        return if (local.exists() || localCmd.exists()) "npx agentkit" else "agentkit"
    }

    /**
     * Returns true when a .agentkit directory exists in the project root,
     * which is used to decide whether to activate the plugin UI.
     */
    fun isRetortProject(projectRoot: String): Boolean =
        File(projectRoot, ".agentkit").isDirectory
}
