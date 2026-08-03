import { beforeEach, describe, expect, it, vi } from 'vitest'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('@tauri-apps/api/core', () => ({ invoke }))

const { availableIcons, currentIcon, setIcon } = await import('./index')

describe('app icon API', () => {
  beforeEach(() => {
    invoke.mockReset()
  })

  it('lists bundled icon IDs', async () => {
    invoke.mockResolvedValue(['midnight', 'sunrise'])

    await expect(availableIcons()).resolves.toEqual(['midnight', 'sunrise'])
    expect(invoke).toHaveBeenCalledWith('plugin:app-icon|get_available_icons')
  })

  it('returns null for the primary icon', async () => {
    invoke.mockResolvedValue(null)

    await expect(currentIcon()).resolves.toBeNull()
    expect(invoke).toHaveBeenCalledWith('plugin:app-icon|get_current_icon')
  })

  it('returns the selected alternate icon ID', async () => {
    invoke.mockResolvedValue('midnight')

    await expect(currentIcon()).resolves.toBe('midnight')
  })

  it('passes the selected icon ID to the plugin', async () => {
    invoke.mockResolvedValue(undefined)

    await setIcon('midnight')
    expect(invoke).toHaveBeenCalledWith('plugin:app-icon|set_icon', {
      request: { icon: 'midnight' }
    })
  })

  it('restores the primary icon', async () => {
    invoke.mockResolvedValue(undefined)

    await setIcon(null)
    expect(invoke).toHaveBeenCalledWith('plugin:app-icon|set_icon', {
      request: { icon: null }
    })
  })
})
