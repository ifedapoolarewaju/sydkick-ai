import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { AUDIO_DATA_CHUNK_EVENT } from './helpers/constants'

contextBridge.exposeInMainWorld('bridge', {
    view: 'home',
    handleAudioInput: (audioInput: ArrayBuffer, requestId: string, includeScreenShot?: boolean): Promise<ArrayBuffer | undefined> => {
        return ipcRenderer.invoke('handleAudioInput', audioInput, requestId, includeScreenShot)
    },
    onAudioOutputChunk: (requestId: string, callback: (chunk: ArrayBuffer | null) => boolean | void) => {
        const listener = (_: IpcRendererEvent, audioChunk: ArrayBuffer | null, reqId: string) => {
            if (requestId !== reqId) {
                console.log('chunk event request id mismatch')

                return
            }

            const shouldAbort = callback(audioChunk)

            // when null is received, there is no more data
            // todo: add mechanism to also remove listener when error is received
            if (shouldAbort || audioChunk === null) {
                console.log('null chunk received or abortion:', shouldAbort, 'closing data')
                ipcRenderer.removeListener(AUDIO_DATA_CHUNK_EVENT, listener)
            }
        }

        ipcRenderer.on(AUDIO_DATA_CHUNK_EVENT, listener)
    },
    openLastAnswerWindow: (): void => {
        ipcRenderer.invoke('openLastAnswerWindow')
    },
    openSettingsWindow: (): void => {
        ipcRenderer.invoke('openSettingsWindow')
    },
    openHelpWindow: (): void => {
        ipcRenderer.invoke('openHelpWindow')
    },
    hideMainWindow: (): void => {
        ipcRenderer.invoke('hideMainWindow')
    }
})
