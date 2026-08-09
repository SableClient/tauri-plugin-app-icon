import { iconName } from './lib.mjs'

const START = '    <!-- APP-ICON ALTERNATES START -->'
const END = '    <!-- APP-ICON ALTERNATES END -->'

export function applyIconAliases(infoPlist, icons) {
  const aliases = icons
    .map(
      ({ id }) => `      <key>${id}</key>
      <string>${iconName(id)}</string>`
    )
    .join('\n')
  const block = `${START}
    <key>TauriAppIconAliases</key>
    <dict>
${aliases}
    </dict>
${END}`
  const marked = new RegExp(`${START}[\\s\\S]*?${END}`)

  if (marked.test(infoPlist)) return infoPlist.replace(marked, block)
  return infoPlist.replace('\n</dict>\n</plist>', `\n${block}\n</dict>\n</plist>`)
}
