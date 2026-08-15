import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { generateIcon, validateIcons } from './lib.mjs'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn(() => ({ status: 0 })) }))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('validateIcons', () => {
  it('rejects IDs that collapse to the same native asset name', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process exited')
    })

    expect(() =>
      validateIcons([
        { id: 'foo_2', source: 'first.png' },
        { id: 'foo2', source: 'second.png' },
      ])
    ).toThrow('process exited')
    expect(console.error).toHaveBeenCalledWith(
      'app-icon: icon IDs must map to unique native names: AppIconFoo2'
    )
  })
})

describe('generateIcon', () => {
  // resvg canonicalises the SVG path before resolving `href`, so a relative href
  // breaks when the output directory is reached through a symlink, as it is on
  // macOS (/var -> /private/var).
  it('references the source by absolute path', () => {
    const root = mkdtempSync(join(tmpdir(), 'app-icon-test-'))
    const source = join(root, 'app.png')
    writeFileSync(source, '')
    mkdirSync(join(root, 'private', 'output'), { recursive: true })
    symlinkSync(join(root, 'private'), join(root, 'link'))
    const output = join(root, 'link', 'output')

    generateIcon({ id: 'alt', source }, root, output, { iosOpaqueBackground: true })

    const svg = readFileSync(join(output, 'ios-icon.svg'), 'utf8')
    expect(svg).toContain(`href="${source}"`)
  })
})
