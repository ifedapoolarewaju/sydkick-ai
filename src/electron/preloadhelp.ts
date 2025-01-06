import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('bridge', {
    view: 'help',
    openURL: (url: string): void => {
        ipcRenderer.invoke('openURL', url)
    }
})
