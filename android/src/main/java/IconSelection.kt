package com.plugin.appicon

import android.content.pm.PackageManager

internal fun isEnabled(state: Int, enabledByDefault: Boolean): Boolean = when (state) {
    PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
    PackageManager.COMPONENT_ENABLED_STATE_DEFAULT -> enabledByDefault
    else -> false
}
