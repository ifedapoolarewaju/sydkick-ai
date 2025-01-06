import { systemPreferences } from 'electron'
import { getSettings } from './settings'
import { createLoginWindow } from './windows'

export async function ensureLogin(): Promise<{success: boolean; hadToLogin: boolean}> {
    const settings = await getSettings()
    if (!settings?.openAiKey) {
        const success = await createLoginWindow()
        return { success, hadToLogin: true }
    }

    return { success: true, hadToLogin: false }
}

export async function ensureMicPermission(): Promise<boolean> {
    const status = await systemPreferences.getMediaAccessStatus('microphone')
    if (status === 'granted') {
        return true
    }

    return await systemPreferences.askForMediaAccess('microphone')
}