package com.plugin.appicon

import android.app.Activity
import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Bundle
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSArray
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

private const val ICON_ID_METADATA = "tauri-plugin-app-icon-id"

@InvokeArg
class SetIconArgs {
    var icon: String? = null
}

private data class IconAlias(
    val id: String,
    val component: ComponentName,
    val enabledByDefault: Boolean,
)

@TauriPlugin
class AppIconPlugin(private val activity: Activity) : Plugin(activity) {
    private fun aliases(): List<IconAlias> {
        val packageManager = activity.packageManager
        val packageInfo = packageManager.getPackageInfo(
            activity.packageName,
            PackageManager.GET_ACTIVITIES,
        )

        return packageInfo.activities.orEmpty().mapNotNull { activityInfo ->
            // Only activity aliases with this metadata are managed by the plugin.
            val id = activityInfo.metaData?.getString(ICON_ID_METADATA) ?: return@mapNotNull null
            if (activityInfo.targetActivity == null) return@mapNotNull null

            IconAlias(
                id,
                ComponentName(activity.packageName, activityInfo.name),
                activityInfo.enabled,
            )
        }
    }

    @Command
    fun getAvailableIcons(invoke: Invoke) {
        val result = JSArray()
        aliases().map { it.id }.sorted().forEach(result::put)
        invoke.resolve(result)
    }

    @Command
    fun getCurrentIcon(invoke: Invoke) {
        val packageManager = activity.packageManager
        val icon = aliases().firstOrNull { alias ->
            isEnabled(
                packageManager.getComponentEnabledSetting(alias.component),
                alias.enabledByDefault,
            )
        }?.id

        val result = JSObject()
        result.put("icon", icon)
        invoke.resolve(result)
    }

    @Command
    fun setIcon(invoke: Invoke) {
        val requestedIcon = invoke.parseArgs(SetIconArgs::class.java).icon
        val aliases = aliases()
        val selected = if (requestedIcon == null) null else aliases.find { it.id == requestedIcon }

        if (requestedIcon != null && selected == null) {
            invoke.reject("Unknown app icon: $requestedIcon")
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
