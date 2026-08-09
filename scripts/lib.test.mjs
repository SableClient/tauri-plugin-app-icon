import { afterEach, describe, expect, it, vi } from 'vitest'

import { validateIcons } from './lib.mjs'

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
