#!/usr/bin/env node

import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ANDROID_DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const START = '<!-- APP-ICON ALIASES START -->';
const END = '<!-- APP-ICON ALIASES END -->';

function fail(message) {
  console.error(`app-icon: ${message}`);
  process.exit(1);
}

function parseConfigPath(args) {
  if (args.length !== 2 || args[0] !== '--config') {
    fail('usage: generate-android.mjs --config <path>');
  }
  return resolve(args[1]);
}

function aliasName(id) {
  return `AppIcon${id.replace(/(^|_)([a-z0-9])/g, (_, _separator, character) => character.toUpperCase())}`;
}

function aliasXml({ id, mainActivity, isDefault = false }) {
  const suffix = isDefault ? '' : `_${id}`;
  const name = isDefault ? 'AppIconDefault' : aliasName(id);
  const metadata = isDefault
    ? `\n            <meta-data\n                android:name="tauri-plugin-app-icon-default"\n                android:value="true" />`
    : '';

  return `        <activity-alias
            android:name=".${name}"
            android:targetActivity="${mainActivity}"
            android:icon="@mipmap/ic_launcher${suffix}"
            android:roundIcon="@mipmap/ic_launcher${suffix}_round"
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

function replaceAliases(manifestPath, config) {
  const manifest = readFileSync(manifestPath, 'utf8');
  const aliases = [
    aliasXml({ mainActivity: config.android.mainActivity, isDefault: true }),
    ...config.icons.map((icon) =>
      aliasXml({ id: icon.id, mainActivity: config.android.mainActivity })
    ),
  ].join('\n\n');
  const block = `${START}\n${aliases}\n        ${END}`;
  const marked = new RegExp(`${START}[\\s\\S]*?${END}`);
  const hasMarkedBlock = marked.test(manifest);
  const updated = hasMarkedBlock
    ? manifest.replace(marked, block)
    : manifest.replace(/(\s*<service\b)/, `\n\n${block}\n$1`);

  if (!hasMarkedBlock && updated === manifest) fail(`could not add aliases to ${manifestPath}`);
  writeFileSync(manifestPath, updated);
}

function generateIcon(icon, config, configDir, temporaryDirectory) {
  const source = resolve(configDir, icon.source);
  if (!existsSync(source)) fail(`source image not found: ${relative(process.cwd(), source)}`);

  const output = join(temporaryDirectory, icon.id);
  const result = spawnSync('pnpm', ['tauri', 'icon', source, '--output', output], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  if (result.status !== 0) fail(`Tauri icon generation failed for ${icon.id}`);

  const resources = resolve(configDir, config.android.resourcesDirectory);
  for (const density of ANDROID_DENSITIES) {
    for (const suffix of ['', '_round', '_foreground']) {
      cpSync(
        join(output, 'android', `mipmap-${density}`, `ic_launcher${suffix}.png`),
        join(resources, `mipmap-${density}`, `ic_launcher_${icon.id}${suffix}.png`)
      );
    }
  }

  const adaptiveIcon = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <foreground>
    <inset android:drawable="@mipmap/ic_launcher_${icon.id}_foreground" android:inset="16.5%" />
  </foreground>
  <background android:drawable="@color/ic_launcher_background"/>
  <monochrome android:drawable="@mipmap/ic_launcher_${icon.id}_foreground"/>
</adaptive-icon>
`;
  writeFileSync(join(resources, 'mipmap-anydpi-v26', `ic_launcher_${icon.id}.xml`), adaptiveIcon);
}

const configPath = parseConfigPath(process.argv.slice(2));
const configDir = dirname(configPath);
const config = JSON.parse(readFileSync(configPath, 'utf8'));

if (
  !config.android?.mainActivity ||
  !config.android?.resourcesDirectory ||
  !config.android?.manifest
) {
  fail('android.mainActivity, android.resourcesDirectory, and android.manifest are required');
}
if (!Array.isArray(config.icons) || config.icons.length === 0)
  fail('at least one icon is required');
const iconIds = new Set();
for (const icon of config.icons) {
  if (!/^[a-z][a-z0-9_]*$/.test(icon.id) || !icon.source) {
    fail('each icon requires a lowercase ID and source image');
  }
  if (iconIds.has(icon.id)) fail(`duplicate icon ID: ${icon.id}`);
  iconIds.add(icon.id);
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'tauri-app-icon-'));
try {
  config.icons.forEach((icon) => generateIcon(icon, config, configDir, temporaryDirectory));
  replaceAliases(resolve(configDir, config.android.manifest), config);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
