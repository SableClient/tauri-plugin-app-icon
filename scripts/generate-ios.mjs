#!/usr/bin/env node

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { fail, generateIcon, iconName, loadConfig, validateIcons } from './lib.mjs';
import { applyIconAliases } from './ios-plist.mjs';
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

const { config, configDir } = loadConfig(process.argv.slice(2), 'generate-ios.mjs');
if (!config.ios?.assetsDirectory || !config.ios?.infoPlist) {
  fail('ios.assetsDirectory and ios.infoPlist are required');
}
validateIcons(config.icons);

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'tauri-app-icon-'));
try {
  const assetsDirectory = resolve(configDir, config.ios.assetsDirectory);
  mkdirSync(assetsDirectory, { recursive: true });
  writeFileSync(
    join(assetsDirectory, 'Contents.json'),
    '{ "info": { "author": "xcode", "version": 1 } }\n'
  );

  for (const icon of config.icons) {
    const output = join(temporaryDirectory, icon.id);
    generateIcon(icon, configDir, output);

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

  const infoPlistPath = resolve(configDir, config.ios.infoPlist);
  const infoPlist = readFileSync(infoPlistPath, 'utf8');
  const updated = applyIconAliases(infoPlist, config.icons);
  if (updated === infoPlist && !infoPlist.includes('<!-- APP-ICON ALTERNATES START -->')) {
    fail(`could not update ${infoPlistPath}`);
  }
  writeFileSync(infoPlistPath, updated);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
