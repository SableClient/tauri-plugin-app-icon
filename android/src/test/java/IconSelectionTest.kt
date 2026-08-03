package com.plugin.appicon

import android.content.pm.PackageManager
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class IconSelectionTest {
    @Test
    fun explicitlyEnabledAliasIsSelected() {
        assertTrue(isEnabled(PackageManager.COMPONENT_ENABLED_STATE_ENABLED, false))
    }

    @Test
    fun defaultAliasUsesManifestEnabledState() {
        assertTrue(isEnabled(PackageManager.COMPONENT_ENABLED_STATE_DEFAULT, true))
        assertFalse(isEnabled(PackageManager.COMPONENT_ENABLED_STATE_DEFAULT, false))
    }

    @Test
    fun disabledAliasIsNotSelected() {
        assertFalse(isEnabled(PackageManager.COMPONENT_ENABLED_STATE_DISABLED, true))
    }
}
