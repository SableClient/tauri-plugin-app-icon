# Tauri Plugin App Icon

Runtime selection of bundled alternate launcher icons for Tauri 2 iOS and Android apps.

```toml
[dependencies]
tauri-plugin-app-icon = "0.1"
```

```rust
tauri::Builder::default()
  .plugin(tauri_plugin_app_icon::init())
```

```ts
import { availableIcons, currentIcon, setIcon } from 'tauri-plugin-app-icon-api'

const icons = await availableIcons()
await setIcon(icons[0])
await setIcon(null) // Restore the primary icon.
console.log(await currentIcon())
```

The plugin switches only icons already compiled into the application. It does not accept image files or remote URLs. iOS does not permit changing to an arbitrary runtime image.

## iOS setup

Create an asset catalog icon set for every alternative and register each set under `CFBundleIcons > CFBundleAlternateIcons` in the app's `Info.plist`. The dictionary key is the ID exposed by `availableIcons` and accepted by `setIcon`.

```xml
<key>CFBundleIcons</key>
<dict>
  <key>CFBundleAlternateIcons</key>
  <dict>
    <key>midnight</key>
    <dict>
      <key>CFBundleIconFiles</key>
      <array>
        <string>AppIconMidnight</string>
      </array>
    </dict>
  </dict>
</dict>
```

Use Xcode's Alternate App Icon Sets build setting when possible so it generates this entry. iOS icon files must be opaque and include all required device sizes.

## Android setup

### Generation

The included generator turns source PNGs into Android density resources and maintains a marked alias block in the generated manifest. The host app owns the configuration because it owns its Android activity and native project:

```json
{
  "android": {
    "mainActivity": ".MainActivity",
    "resourcesDirectory": "icons/android",
    "manifest": "gen/android/app/src/main/AndroidManifest.xml"
  },
  "ios": {
    "assetsDirectory": "icons/ios/AppIcons.xcassets",
    "infoPlist": "Info.plist"
  },
  "icons": [{ "id": "midnight", "source": "icons/app-icons/midnight.png" }]
}
```

Run it from the host application so `pnpm tauri icon` resolves from that app:

```sh
node node_modules/tauri-plugin-app-icon/scripts/generate-android.mjs --config src-tauri/app-icons.json
```

The source images must be square PNGs. Run generation before an Android build whenever the configuration or source image changes.

For iOS, run `generate-ios.mjs` with the same configuration. It creates alternate app-icon sets in the configured asset catalog and maintains `CFBundleAlternateIcons` in the configured Info.plist.

Declare one disabled `activity-alias` per icon in the host app's `AndroidManifest.xml`. Every alias must have a unique `tauri-plugin-app-icon-id` metadata value and reference an adaptive icon resource. The activity itself must not have a launcher intent filter; otherwise Android can display both the primary launcher entry and an alias.

```xml
<activity
    android:name="com.example.app.MainActivity"
    android:exported="true" />

<activity-alias
    android:name=".AppIconMidnight"
    android:targetActivity=".MainActivity"
    android:icon="@mipmap/ic_launcher_midnight"
    android:enabled="false"
    android:exported="true">
    <meta-data
        android:name="tauri-plugin-app-icon-id"
        android:value="midnight" />
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity-alias>
```

Configure one alias as `android:enabled="true"` for the default launcher icon. The plugin enables the selected alias and disables every other declared icon alias. Provide a complete Android adaptive icon resource set for each ID, including foreground, background, and monochrome resources where applicable.

## Platform support

The API is supported on iOS and Android. Calls on desktop return an unsupported-platform error.

## Validation

Run the cross-platform checks from the plugin root:

```sh
pnpm test
pnpm build
cargo test
cargo check
```

Native launcher changes require platform validation before release:

```sh
# Android, from the host Tauri app's generated project.
./gradlew :app:testDebugUnitTest

# iOS, on macOS after Tauri has generated the iOS project.
pnpm tauri ios dev
```

On each platform, install the app, select every alternate icon, restore the primary icon, restart the launcher, and confirm exactly one launcher entry remains. Android builds also require the NDK version configured by the host app.
