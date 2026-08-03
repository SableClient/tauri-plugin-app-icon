import { invoke } from '@tauri-apps/api/core'

/** Returns IDs of all alternate icons bundled in the app. */
export async function availableIcons(): Promise<string[]> {
  return invoke<string[]>('plugin:app-icon|get_available_icons')
}

/** Returns the selected alternate icon ID, or `null` for the primary icon. */
export async function currentIcon(): Promise<string | null> {
  return invoke<{ icon: string | null }>('plugin:app-icon|get_current_icon')
    .then((result) => result.icon)
}

/** Selects a bundled alternate icon. Pass `null` to restore the primary icon. */
export async function setIcon(icon: string | null): Promise<void> {
  return invoke('plugin:app-icon|set_icon', { request: { icon } })
}
