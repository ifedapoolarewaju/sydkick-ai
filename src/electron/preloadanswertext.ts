import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('bridge', {
    view: 'answer-text',
    getLastAnswerText: (): Promise<string | null> => {
        return ipcRenderer.invoke('getLastAnswerText')
    }
})
