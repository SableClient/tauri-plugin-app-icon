import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// `default` names the primary icon in the generated Android manifest metadata.
const RESERVED_ICON_IDS = new Set(['default']);

export function fail(message) {
  console.error(`app-icon: ${message}`);
  process.exit(1);
}

export function loadConfig(argv, script) {
  if (argv.length !== 2 || argv[0] !== '--config') fail(`usage: ${script} --config <path>`);
  const configPath = resolve(argv[1]);
  return { config: JSON.parse(readFileSync(configPath, 'utf8')), configDir: dirname(configPath) };
}

export function validateIcons(icons) {
  if (!Array.isArray(icons) || icons.length === 0) fail('at least one icon is required');

  const ids = new Set();
  const nativeNames = new Set();
  for (const icon of icons) {
    if (!/^[a-z][a-z0-9_]*$/.test(icon.id) || !icon.source) {
      fail('each icon requires a lowercase ID and source image');
    }
    if (icon.backgroundColor && !/^#[\dA-Fa-f]{3,8}$/.test(icon.backgroundColor)) {
      fail('icon backgroundColor must be a hexadecimal color');
    }
    if (RESERVED_ICON_IDS.has(icon.id)) fail(`reserved icon ID: ${icon.id}`);
    if (ids.has(icon.id)) fail(`duplicate icon ID: ${icon.id}`);
    ids.add(icon.id);

    const nativeName = iconName(icon.id);
    if (nativeNames.has(nativeName)) fail(`icon IDs must map to unique native names: ${nativeName}`);
    nativeNames.add(nativeName);
  }
}

export function iconName(id) {
  return `AppIcon${id.replace(/(^|_)([a-z0-9])/g, (_, _separator, character) => character.toUpperCase())}`;
}

function tauriRunner() {
  const agent = process.env.npm_config_user_agent ?? '';
  if (agent.startsWith('yarn')) return 'yarn';
  if (agent.startsWith('bun')) return 'bunx';
  if (agent.startsWith('npm')) return 'npx';
  return 'pnpm';
}

/** Runs `tauri icon` for one source image, writing per-platform icons into `outputDirectory`. */
export function generateIcon(icon, configDir, outputDirectory) {
  const source = resolve(configDir, icon.source);
  if (!existsSync(source)) fail(`source image not found: ${relative(process.cwd(), source)}`);

  const result = spawnSync(tauriRunner(), ['tauri', 'icon', source, '--output', outputDirectory], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  if (result.status !== 0) fail(`Tauri icon generation failed for ${icon.id}`);
}
