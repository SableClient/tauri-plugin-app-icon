import { fail, iconName } from './lib.mjs';

const START = '# APP-ICON ALIASES START';
const END = '# APP-ICON ALIASES END';
const MARKED = new RegExp(`^([ \\t]*)${START}\\n[\\s\\S]*?^[ \\t]*${END}$`, 'm');

export function applySpecIconAliases(spec, icons) {
  const marked = spec.match(MARKED);
  if (!marked) fail(`the project spec needs a "${START}" ... "${END}" block under info.properties`);
  const indent = marked[1];
  const block = [
    `${indent}${START}`,
    `${indent}TauriAppIconAliases:`,
    ...icons.map(({ id }) => `${indent}  ${id}: ${iconName(id)}`),
    `${indent}${END}`,
  ].join('\n');
  return spec.replace(MARKED, () => block);
}
