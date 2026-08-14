import { describe, expect, it } from 'vitest';

import { applyAliases } from './android-manifest.mjs';

// Abridged from the manifest `tauri android init` generates.
const MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name">
        <activity
            android:launchMode="singleTask"
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
          android:name="androidx.core.content.FileProvider"
          android:authorities="\${applicationId}.fileprovider"
          android:exported="false" />
    </application>
</manifest>
`;

const CONFIG = {
  android: { mainActivity: '.MainActivity' },
  icons: [{ id: 'midnight' }, { id: 'sunrise' }],
};

describe('applyAliases', () => {
  it('adds the alias block to a freshly generated manifest', () => {
    const updated = applyAliases(MANIFEST, CONFIG);

    expect(updated).toContain('<!-- APP-ICON ALIASES START -->');
    expect(updated).toContain('android:name=".AppIconMidnight"');
    expect(updated).toContain('android:name=".AppIconSunrise"');
    expect(updated.indexOf('APP-ICON ALIASES END')).toBeLessThan(updated.indexOf('</application>'));
  });

  it('marks exactly one alias as the enabled default', () => {
    const updated = applyAliases(MANIFEST, CONFIG);

    expect(updated.match(/android:enabled="true"/g)).toHaveLength(1);
    expect(updated).toContain('android:name="tauri-plugin-app-icon-default"');
    expect(updated).toContain('android:name=".AppIconDefault"');
  });

  it('uses adaptive resources for alternate round icons', () => {
    const updated = applyAliases(MANIFEST, CONFIG);

    expect(updated).toContain('android:roundIcon="@mipmap/ic_launcher_midnight"');
    expect(updated).toContain('android:roundIcon="@mipmap/ic_launcher_sunrise"');
  });

  it('removes the launcher entry from the target activity', () => {
    const updated = applyAliases(MANIFEST, CONFIG);
    const activity = updated.match(/<activity\s[\s\S]*?<\/activity>/)[0];

    expect(activity).not.toContain('intent-filter');
    expect(updated).toContain('android:name=".MainActivity"');
  });

  it('refreshes the block instead of duplicating it on re-runs', () => {
    const once = applyAliases(MANIFEST, CONFIG);

    expect(applyAliases(once, CONFIG)).toBe(once);
    expect(applyAliases(once, { ...CONFIG, icons: [{ id: 'midnight' }] })).not.toContain(
      'AppIconSunrise'
    );
  });
});
