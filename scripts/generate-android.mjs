#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { applyAliases } from './android-manifest.mjs';
import { fail, generateIcon, loadConfig, validateIcons } from './lib.mjs';

const ANDROID_DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

/**
 * The colour `tauri icon` generated for this icon, inlined into the adaptive icon rather than
 * referenced as `@color/ic_launcher_background`: that resource only exists when the host app's own
 * primary icon was generated without a background image.
 */
function backgroundColor(icon, generated) {
  if (icon.backgroundColor) return icon.backgroundColor;

  const colorPath = join(generated, 'values', 'ic_launcher_background.xml');
  if (!existsSync(colorPath))
    fail(`Tauri icon did not generate a background colour for ${icon.id}`);
  const color = readFileSync(colorPath, 'utf8').match(
    /<color name="ic_launcher_background">([^<]+)<\/color>/
  );
  if (!color) fail(`could not read the generated background colour for ${icon.id}`);
  return color[1];
}

function generateResources(icon, config, configDir, temporaryDirectory) {
  const output = join(temporaryDirectory, icon.id);
  generateIcon(icon, configDir, output);

  const generated = join(output, 'android');
  const resources = resolve(configDir, config.android.resourcesDirectory);
  for (const density of ANDROID_DENSITIES) {
    for (const suffix of ['', '_round', '_foreground']) {
      cpSync(
        join(generated, `mipmap-${density}`, `ic_launcher${suffix}.png`),
        join(resources, `mipmap-${density}`, `ic_launcher_${icon.id}${suffix}.png`)
      );
    }
  }
  const anyDpi = join(resources, 'mipmap-anydpi-v26');
  mkdirSync(anyDpi, { recursive: true });
  writeFileSync(
    join(anyDpi, `ic_launcher_${icon.id}.xml`),
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <foreground>
    <inset android:drawable="@mipmap/ic_launcher_${icon.id}_foreground" android:inset="16.5%" />
  </foreground>
  <background>
    <color android:color="${backgroundColor(icon, generated)}"/>
  </background>
</adaptive-icon>
`
  );
}

const { config, configDir } = loadConfig(process.argv.slice(2), 'generate-android.mjs');

if (
  !config.android?.mainActivity ||
  !config.android?.resourcesDirectory ||
  !config.android?.manifest
) {
  fail('android.mainActivity, android.resourcesDirectory, and android.manifest are required');
}
validateIcons(config.icons);

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'tauri-app-icon-'));
try {
  config.icons.forEach((icon) => generateResources(icon, config, configDir, temporaryDirectory));

  const manifestPath = resolve(configDir, config.android.manifest);
  writeFileSync(manifestPath, applyAliases(readFileSync(manifestPath, 'utf8'), config));
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
