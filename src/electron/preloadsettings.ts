import { contextBridge, ipcRenderer } from 'electron'
import { AppSettings } from './settings'

contextBridge.exposeInMainWorld('bridge', {
    view: 'settings',
    getSettings: (): Promise<AppSettings | null> => {
        return ipcRenderer.invoke('getSettings')
    },
    saveSettings: (settings: AppSettings): void => {
        ipcRenderer.invoke('saveSettings', settings)
    }
})
