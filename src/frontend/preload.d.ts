import { Channels } from 'main/preload'
import { AppSettings } from '../electron/settings'

declare global {
    type TearDown = () => void

    interface Window {
        bridge: {
            view: 'login' | 'quickstart' | 'home' | 'answer-text' | 'settings' | 'help';
            handleAudioInput: (audioInput: ArrayBuffer, requestId: string, includeScreenShot?: boolean) => Promise<ArrayBuffer | undefined>
            onAudioOutputChunk: (requestId: string, callback: (chunk: ArrayBuffer | null) => boolean | void) => void
            openLastAnswerWindow: () => void
            openSettingsWindow: () => void
            openHelpWindow: () => void
            hideMainWindow: () => void
            getLastAnswerText: () => Promise<string | null>
            getSettings: () => Promise<AppSettings | null>
            saveSettings: (settings: AppSettings) => Promise<void>
            openURL: (url: string) => Promise<void>
        };
    }
}

export {};
