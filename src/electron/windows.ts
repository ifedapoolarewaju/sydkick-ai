import { BrowserWindow, screen } from 'electron'
import isDev from 'electron-is-dev'
import path from 'path'
import { getSettings } from './settings'

export const allWindows: SupportedWindows = {}

export interface SupportedWindows {
    main?: BrowserWindow
    answerText?: BrowserWindow
    settings?: BrowserWindow
    help?: BrowserWindow
}

const PRELOAD_MAP: Record<keyof SupportedWindows, string> = {
    main: './preload.js',
    answerText: './preloadanswertext.js',
    settings: './preloadsettings.js',
    help: './preloadhelp.js',
}

export function createMainWindow (): BrowserWindow {
    const xPosition = screen.getPrimaryDisplay().bounds.width - 230
    const yPosition = screen.getPrimaryDisplay().bounds.height - 200
    const window = new BrowserWindow({
        width: 210, 
        height: 70,
        frame: false,
        alwaysOnTop: true,
        hasShadow: true,
        movable: true,
        resizable: false,
        x: xPosition,
        y: yPosition,
        icon: `${__dirname}/../../img/icon.png`,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, './preload.js'),
            webSecurity: false,
        },
    })

    window.setVisibleOnAllWorkspaces(true)
    window.setTitle('SydKick - Floating Asisstant')
    window.loadURL(
        isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../../index.html')}`
    )
    
    if (isDev) {
        window.webContents.openDevTools({ mode: 'undocked' })
    }

    allWindows.main = window
    // when the window is closed, remove the reference
    window.on('close', () => allWindows.main = undefined)

    return window
}

export function createPopUpWindow(windowType: keyof SupportedWindows) {
    if (windowType === 'main') {
        console.error('Cannot create a popup window for main window')
        return
    }

    if (allWindows[windowType]) {
        console.log('Window already exists, focusing')
        allWindows[windowType].focus()

        if (windowType === 'answerText') {
            // reload answer text in case there's a new answer
            allWindows[windowType].webContents.reload()
        }
        return
    }

    const width = 600
    const height = 500

    const mainWindow = allWindows.main
    if (!mainWindow) {
        console.error('Main window is not defined')
        return
    }

    const { x, y, height: mainWindowHeight } = mainWindow.getBounds()

    const screenWidth = screen.getPrimaryDisplay().bounds.width

    const yAboveMain = y - (height + 10)
    const yBelowMain = y + mainWindowHeight + 10

    // todo: when main window is halfway from top, popup may currently end up covering the main window
    // we should check if popup will cover main window and adjust accordingly
    const yPosition = yAboveMain > 0 ? yAboveMain : yBelowMain
    const xPosition = x + width > screenWidth ? screenWidth - (width + 10) : x

    const preloadFile = PRELOAD_MAP[windowType]
    const window = new BrowserWindow({
        width: width, 
        height: height,
        frame: false,
        alwaysOnTop: false,
        hasShadow: true,
        movable: true,
        resizable: false,
        x: xPosition,
        y: yPosition,

        icon: `${__dirname}/../../img/icon.png`,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, `./${preloadFile}`),
            webSecurity: false,
        },
    })

    window.setVisibleOnAllWorkspaces(true)
    window.setTitle(`SydKick - ${windowType[0].toUpperCase() + windowType.slice(1)}`)
    window.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../../index.html')}`
    )

    // when the window is closed, remove the reference
    window.on('close', () => allWindows[windowType] = undefined)
    window.focus()

    allWindows[windowType] = window

    if (isDev) {
        window.webContents.openDevTools({ mode: 'undocked' })
    }

    return window
}

export async function createLoginWindow(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const window = new BrowserWindow({
            width: 400,
            height: 500,
            titleBarStyle: 'hiddenInset',
            center: true,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, './preloadlogin.js'),
                webSecurity: false,
            },
        })

        window.loadURL(
            isDev
                ? 'http://localhost:3000'
                : `file://${path.join(__dirname, '../../index.html')}`
        )
        
        window.on('close', async () => {
            // confirm that an apiKey is now available
            const settings = await getSettings()
            resolve(Boolean(settings?.openAiKey))
        })

        window.setTitle('SydKick - Login')

        if (isDev) {
            window.webContents.openDevTools({ mode: 'undocked' })
        }
    })
}

export async function createQuickStartWindow(): Promise<void> {
    return new Promise((resolve, reject) => {
        const window = new BrowserWindow({
            width: 400,
            height: 500,
            titleBarStyle: 'hiddenInset',
            center: true,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, './preloadquickstarts.js'),
                webSecurity: false,
            },
        })

        window.loadURL(
            isDev
                ? 'http://localhost:3000'
                : `file://${path.join(__dirname, '../../index.html')}`
        )
        
        window.on('close', () => resolve())

        window.setTitle('SydKick - Quick Start Guide')

        if (isDev) {
            window.webContents.openDevTools({ mode: 'undocked' })
        }
    })
}

export function hideAllWindows () {
    allWindows.main?.hide()
    allWindows.answerText?.hide()
    allWindows.help?.hide()
    allWindows.settings?.hide()
}

export function showAllWindows () {
    if (!allWindows.main) {
        createMainWindow()
        return
    }

    allWindows.main?.show()
    allWindows.answerText?.show()
    allWindows.help?.show()
    allWindows.settings?.show()
}
