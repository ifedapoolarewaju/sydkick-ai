import * as storageUtils from './helpers/storage'

const SETTINGS_FILE = 'syd-settings'

export interface AppSettings {
    openAiKey?: string
    openAiModel?: 'gpt-4o' | 'gpt-4o-mini' | 'o1' | 'o1-mini'
    aiVoiceGender?: 'male' | 'female'
    contextWindow?: number
}

let settings: AppSettings

export const getSettings = async () => {
    if (settings) {
        return settings
    }

    const maybeSettings = await storageUtils.readFromFile<AppSettings>(SETTINGS_FILE)
    if (!maybeSettings) {
        return
    }

    settings = pruneSettings(maybeSettings)

    return settings
}

export const saveSettings = async (newSettings: AppSettings) => {
    if (!storageUtils.canUseFileStorage()) {
        return
    }

    const oldSettings = await storageUtils.readFromFile<AppSettings>(SETTINGS_FILE)
    const mergedSettings = { ...oldSettings, ...newSettings }

    settings = pruneSettings(mergedSettings)

    await storageUtils.saveToFile(settings, SETTINGS_FILE)
}

export const deleteSettings = async () => {
    if (!storageUtils.canUseFileStorage()) {
        return
    }

    await storageUtils.deleteFile(SETTINGS_FILE)
}

const pruneSettings = (unpruned: AppSettings): AppSettings => {
    // prune by picking out only recognized fields
    return {
        openAiKey: unpruned.openAiKey,
        openAiModel: unpruned.openAiModel,
        aiVoiceGender: unpruned.aiVoiceGender,
        contextWindow: unpruned.contextWindow
    }
}
