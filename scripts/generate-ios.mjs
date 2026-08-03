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
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const START = '    <!-- APP-ICON ALTERNATES START -->';
const END = '    <!-- APP-ICON ALTERNATES END -->';
const IMAGES = [
  ['20x20', 'iphone', 'AppIcon-20x20@2x.png', '2x'],
  ['20x20', 'iphone', 'AppIcon-20x20@3x.png', '3x'],
  ['29x29', 'iphone', 'AppIcon-29x29@2x-1.png', '2x'],
  ['29x29', 'iphone', 'AppIcon-29x29@3x.png', '3x'],
  ['40x40', 'iphone', 'AppIcon-40x40@2x.png', '2x'],
  ['40x40', 'iphone', 'AppIcon-40x40@3x.png', '3x'],
  ['60x60', 'iphone', 'AppIcon-60x60@2x.png', '2x'],
  ['60x60', 'iphone', 'AppIcon-60x60@3x.png', '3x'],
  ['20x20', 'ipad', 'AppIcon-20x20@1x.png', '1x'],
  ['20x20', 'ipad', 'AppIcon-20x20@2x-1.png', '2x'],
  ['29x29', 'ipad', 'AppIcon-29x29@1x.png', '1x'],
  ['29x29', 'ipad', 'AppIcon-29x29@2x.png', '2x'],
  ['40x40', 'ipad', 'AppIcon-40x40@1x.png', '1x'],
  ['40x40', 'ipad', 'AppIcon-40x40@2x-1.png', '2x'],
  ['76x76', 'ipad', 'AppIcon-76x76@1x.png', '1x'],
  ['76x76', 'ipad', 'AppIcon-76x76@2x.png', '2x'],
  ['83.5x83.5', 'ipad', 'AppIcon-83.5x83.5@2x.png', '2x'],
  ['1024x1024', 'ios-marketing', 'AppIcon-512@2x.png', '1x'],
];

function fail(message) {
  console.error(`app-icon: ${message}`);
  process.exit(1);
}

function iconName(id) {
  return `AppIcon${id.replace(/(^|_)([a-z0-9])/g, (_, _separator, character) => character.toUpperCase())}`;
}

if (process.argv.length !== 4 || process.argv[2] !== '--config') {
  fail('usage: generate-ios.mjs --config <path>');
}

const configPath = resolve(process.argv[3]);
const configDirectory = dirname(configPath);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
if (
  !config.ios?.assetsDirectory ||
  !config.ios?.infoPlist ||
  !Array.isArray(config.icons) ||
  config.icons.length === 0
) {
  fail('ios.assetsDirectory, ios.infoPlist, and icons are required');
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'tauri-app-icon-'));
try {
  const assetsDirectory = resolve(configDirectory, config.ios.assetsDirectory);
  mkdirSync(assetsDirectory, { recursive: true });
  writeFileSync(
    join(assetsDirectory, 'Contents.json'),
    '{"info":{"author":"xcode","version":1}}\n'
  );

  const iconIds = new Set();
  for (const icon of config.icons) {
    if (!/^[a-z][a-z0-9_]*$/.test(icon.id) || !icon.source) {
      fail('each icon requires a lowercase ID and source image');
    }
    if (iconIds.has(icon.id)) fail(`duplicate icon ID: ${icon.id}`);
    iconIds.add(icon.id);
    const source = resolve(configDirectory, icon.source);
    if (!existsSync(source)) fail(`source image not found: ${relative(process.cwd(), source)}`);

    const output = join(temporaryDirectory, icon.id);
    const result = spawnSync('pnpm', ['tauri', 'icon', source, '--output', output], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    if (result.status !== 0) fail(`Tauri icon generation failed for ${icon.id}`);

    const iconSet = join(assetsDirectory, `${iconName(icon.id)}.appiconset`);
    mkdirSync(iconSet, { recursive: true });
    for (const [, , filename] of IMAGES) {
      cpSync(join(output, 'ios', filename), join(iconSet, filename));
    }
    writeFileSync(
      join(iconSet, 'Contents.json'),
      `${JSON.stringify(
        {
          images: IMAGES.map(([size, idiom, filename, scale]) => ({
            size,
            idiom,
            filename,
            scale,
          })),
          info: { version: 1, author: 'xcode' },
        },
        null,
        2
      )}\n`
    );
  }

  const infoPlistPath = resolve(configDirectory, config.ios.infoPlist);
  const infoPlist = readFileSync(infoPlistPath, 'utf8');
  const alternates = config.icons
    .map(
      ({ id }) => `      <key>${id}</key>
      <dict>
        <key>CFBundleIconFiles</key>
        <array>
          <string>${iconName(id)}</string>
        </array>
      </dict>`
    )
    .join('\n');
  const block = `${START}
    <key>CFBundleIcons</key>
    <dict>
      <key>CFBundleAlternateIcons</key>
      <dict>
${alternates}
      </dict>
    </dict>
${END}`;
  const marked = new RegExp(`${START}[\\s\\S]*?${END}`);
  const updated = marked.test(infoPlist)
    ? infoPlist.replace(marked, block)
    : infoPlist.replace('\n</dict>\n</plist>', `\n${block}\n</dict>\n</plist>`);
  if (updated === infoPlist && !marked.test(infoPlist)) fail(`could not update ${infoPlistPath}`);
  writeFileSync(infoPlistPath, updated);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
