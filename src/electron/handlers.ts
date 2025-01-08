import { ipcMain, shell } from 'electron'
import * as llm from './llm'
import { getCurrentDisplay, getScreenshot } from './helpers'
import { AUDIO_DATA_CHUNK_EVENT } from './helpers/constants'
import { allWindows, createPopUpWindow, hideAllWindows } from './windows'
import { getSettings, saveSettings, AppSettings } from './settings'
import * as appMetrics from './metric'

export function addIpcHandlers () {
    ipcMain.handle('handleAudioInput', async (event, audioInput: ArrayBuffer, requestId: string, includeScreenShot?: boolean) => {
        const promises = [llm.audioToText(audioInput)]
        if (includeScreenShot) {
            console.log('getting screenshot and audio', Date.now())
            const forDisplay = allWindows.main ? getCurrentDisplay(allWindows.main) : undefined
            promises.push(getScreenshot(forDisplay))
        }

        const evtVal = includeScreenShot ? 'with-screenshot' : 'no-screenshot'
        appMetrics.logEvent({ event: 'question-asked', value: evtVal })

        const [prompt, screenshot] = await Promise.all(promises)
        if (!prompt) {
            console.log('prompt is empty')
            return
        }

        console.log('sending prompt', Date.now())

        const llmResponse = await llm.respondToPrompt(prompt, screenshot)
        if (!llmResponse) {
            console.log('no response from llm')
            return
        }

        console.log('received prompt response', Date.now())

        const audio = await llm.textToAudio(llmResponse, (chunk) => {
            allWindows.main?.webContents.send(AUDIO_DATA_CHUNK_EVENT, chunk, requestId)
        })

        console.log('audio response converted', Date.now())
        return audio
    })

    ipcMain.handle('openLastAnswerWindow', async (event) => {
        appMetrics.logEvent({ event: 'last-answer-window-opened' })

        createPopUpWindow('answerText')
    })

    ipcMain.handle('openSettingsWindow', async (event) => {
        appMetrics.logEvent({ event: 'settings-window-opened' })

        createPopUpWindow('settings')
    })

    ipcMain.handle('openHelpWindow', async (event) => {
        appMetrics.logEvent({ event: 'help-window-loaded' })

        createPopUpWindow('help')
    })

    ipcMain.handle('hideMainWindow', async (event) => {
        appMetrics.logEvent({ event: 'app-hidden' })

        hideAllWindows()
    })

    ipcMain.handle('getLastAnswerText', async (event) => {
        return llm.getLastAnswerText()
    })

    ipcMain.handle('getSettings', async (event) => {
        return await getSettings()
    })

    ipcMain.handle('saveSettings', async (event, settings: AppSettings) => {
        appMetrics.logEvent({ event: 'settings-updated' })

        return await saveSettings(settings)
    })

    ipcMain.handle('openURL', async (event, url: string) => {
        await shell.openExternal(url)
    })
}