import org.jetbrains.intellij.platform.gradle.IntelliJPlatformType

plugins {
    id("org.jetbrains.intellij.platform") version "2.2.1"
    id("org.jetbrains.kotlin.jvm") version "2.0.21"
}

group = "com.phoenixvc"
version = "0.1.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        // Targets PyCharm Community for development; plugin.xml declares platform-level
        // compatibility so it also runs on Rider, IntelliJ IDEA, and other JetBrains IDEs.
        pycharmCommunity("2024.3")
        bundledPlugins("com.intellij.modules.python")
        pluginVerifier()
        zipSigner()
        instrumentationTools()
    }
}

intellijPlatform {
    pluginConfiguration {
        name = "Retort"
        ideaVersion {
            sinceBuild = "233"
        }
    }

    pluginVerification {
        ides {
            // Verify against both PyCharm Community and Rider to ensure cross-IDE compatibility
            ide(IntelliJPlatformType.PyCharmCommunity, "2024.3")
            ide(IntelliJPlatformType.Rider, "2024.3")
        }
    }

    signing {
        // Set via env vars RETORT_CHAIN_CRT / RETORT_PRIVATE_KEY in CI
        certificateChainFile = providers.environmentVariable("RETORT_CHAIN_CRT")
            .map { file(it) }.orElse(provider { file("chain.crt") })
        privateKeyFile = providers.environmentVariable("RETORT_PRIVATE_KEY")
            .map { file(it) }.orElse(provider { file("private.pem") })
    }

    publishing {
        token = providers.environmentVariable("JETBRAINS_MARKETPLACE_TOKEN")
    }
}

kotlin {
    jvmToolchain(17)
}
