package com.plugin.appicon

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin

private const val ICON_ID_METADATA = "tauri-plugin-app-icon-id"
private const val DEFAULT_ICON_METADATA = "tauri-plugin-app-icon-default"

@InvokeArg
class SetIconArgs {
    var icon: String? = null
}

private data class IconAlias(
    val id: String,
    val component: ComponentName,
    val enabledByDefault: Boolean,
    val isDefault: Boolean,
)

@TauriPlugin
class AppIconPlugin(private val activity: Activity) : Plugin(activity) {
    private fun aliases(): List<IconAlias> {
        val packageManager = activity.packageManager
        val launcherIntent = Intent(Intent.ACTION_MAIN)
            .addCategory(Intent.CATEGORY_LAUNCHER)
            .setPackage(activity.packageName)

        return packageManager.queryIntentActivities(
            launcherIntent,
            PackageManager.MATCH_DISABLED_COMPONENTS or PackageManager.GET_META_DATA,
        )
            .mapNotNull { resolveInfo ->
                val activityInfo = resolveInfo.activityInfo
                // Only activity aliases with this metadata are managed by the plugin.
                val id = activityInfo.metaData?.getString(ICON_ID_METADATA) ?: return@mapNotNull null
                if (activityInfo.targetActivity == null) return@mapNotNull null

                IconAlias(
                    id,
                    ComponentName(activity.packageName, activityInfo.name),
                    activityInfo.enabled,
                    activityInfo.metaData?.getBoolean(DEFAULT_ICON_METADATA) == true,
                )
            }
    }

    @Command
    fun getAvailableIcons(invoke: Invoke) {
        invoke.resolveObject(aliases().filterNot { it.isDefault }.map { it.id }.sorted())
    }

    @Command
    fun getCurrentIcon(invoke: Invoke) {
        val packageManager = activity.packageManager
        val icon = aliases().firstOrNull { alias ->
            isEnabled(
                packageManager.getComponentEnabledSetting(alias.component),
                alias.enabledByDefault,
            )
        }?.takeUnless { it.isDefault }?.id

        invoke.resolveObject(mapOf("icon" to icon))
    }

    @Command
    fun setIcon(invoke: Invoke) {
        val requestedIcon = invoke.parseArgs(SetIconArgs::class.java).icon
        val aliases = aliases()
        val selected = if (requestedIcon == null) {
            aliases.find { it.isDefault }
        } else {
            aliases.find { it.id == requestedIcon }
        }

        if (selected == null) {
            invoke.reject(if (requestedIcon == null) "No default app icon is configured" else "Unknown app icon: $requestedIcon")
            return
        }

        val packageManager = activity.packageManager
        aliases.forEach { alias ->
            packageManager.setComponentEnabledSetting(
                alias.component,
                if (alias == selected) {
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                } else {
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED
                },
                PackageManager.DONT_KILL_APP,
            )
        }
        invoke.resolve()
    }
}
