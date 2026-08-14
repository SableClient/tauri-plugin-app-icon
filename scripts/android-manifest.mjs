import { fail, iconName } from './lib.mjs';

const START = '<!-- APP-ICON ALIASES START -->';
const END = '<!-- APP-ICON ALIASES END -->';

function aliasXml({ id, mainActivity, isDefault = false }) {
  const suffix = isDefault ? '' : `_${id}`;
  const roundIcon = isDefault ? `@mipmap/ic_launcher_round` : `@mipmap/ic_launcher${suffix}`;
  const name = isDefault ? 'AppIconDefault' : iconName(id);
  const metadata = isDefault
    ? `\n            <meta-data\n                android:name="tauri-plugin-app-icon-default"\n                android:value="true" />`
    : '';

  return `        <activity-alias
            android:name=".${name}"
            android:targetActivity="${mainActivity}"
            android:icon="@mipmap/ic_launcher${suffix}"
            android:roundIcon="${roundIcon}"
            android:enabled="${isDefault}"
            android:exported="true">
            <meta-data
                android:name="tauri-plugin-app-icon-id"
                android:value="${isDefault ? 'default' : id}" />${metadata}
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity-alias>`;
}

/**
 * The aliases own the launcher entries, so the target activity must not declare one itself:
 * Android would otherwise show both the activity and the enabled alias in the launcher.
 */
function removeActivityLauncherEntry(manifest, mainActivity) {
  const shortName = mainActivity.slice(mainActivity.lastIndexOf('.') + 1);
  const activityPattern = new RegExp(
    `<activity\\s[^>]*android:name="(?:[\\w.]*\\.)?${shortName}"[\\s\\S]*?</activity>`
  );
  const activity = manifest.match(activityPattern);
  if (!activity) fail(`could not find the <activity> element for ${mainActivity}`);

  const stripped = activity[0].replace(
    /[ \t]*<intent-filter>[\s\S]*?<\/intent-filter>\n?/g,
    (intentFilter) => (intentFilter.includes('category.LAUNCHER') ? '' : intentFilter)
  );
  return manifest.replace(activityPattern, () => stripped);
}

/** Adds or refreshes the marked alias block in an Android manifest. Idempotent. */
export function applyAliases(manifest, config) {
  const aliases = [
    aliasXml({ mainActivity: config.android.mainActivity, isDefault: true }),
    ...config.icons.map((icon) =>
      aliasXml({ id: icon.id, mainActivity: config.android.mainActivity })
    ),
  ].join('\n\n');
  const block = `${START}\n${aliases}\n        ${END}`;
  const marked = new RegExp(`${START}[\\s\\S]*?${END}`);

  const stripped = removeActivityLauncherEntry(manifest, config.android.mainActivity);
  if (marked.test(stripped)) return stripped.replace(marked, () => block);

  if (!stripped.includes('</application>')) fail('could not find <application> in the manifest');
  return stripped.replace(/[ \t]*<\/application>/, (closing) => `        ${block}\n\n${closing}`);
}
