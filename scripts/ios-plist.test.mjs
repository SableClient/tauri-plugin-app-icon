import { describe, expect, it } from 'vitest'

import { applyIconAliases } from './ios-plist.mjs'

const PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>Example</string>
</dict>
</plist>
`

describe('applyIconAliases', () => {
  it('maps public IDs to generated Xcode asset names', () => {
    const updated = applyIconAliases(PLIST, [{ id: 'midnight' }, { id: 'sun_rise' }])

    expect(updated).toContain('<key>TauriAppIconAliases</key>')
    expect(updated).toContain('<key>midnight</key>\n      <string>AppIconMidnight</string>')
    expect(updated).toContain('<key>sun_rise</key>\n      <string>AppIconSunRise</string>')
    expect(updated).not.toContain('<key>CFBundleIcons</key>')
  })

  it('refreshes the marked block without duplicating it', () => {
    const once = applyIconAliases(PLIST, [{ id: 'midnight' }])

    expect(applyIconAliases(once, [{ id: 'midnight' }])).toBe(once)
    expect(applyIconAliases(once, [{ id: 'sunrise' }])).not.toContain('<key>midnight</key>')
  })
})
