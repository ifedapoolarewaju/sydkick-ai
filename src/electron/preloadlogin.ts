import { contextBridge, ipcRenderer } from 'electron'
import { AppSettings } from './settings'

contextBridge.exposeInMainWorld('bridge', {
    view: 'login',
    getSettings: (): Promise<AppSettings | null> => {
        return ipcRenderer.invoke('getSettings')
    },
    saveSettings: (settings: AppSettings) => {
        return ipcRenderer.invoke('saveSettings', settings)
    },
    openURL: (url: string) => {
        return ipcRenderer.invoke('openURL', url)
    }
})
