import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('bridge', {
    view: 'quickstart'
})
