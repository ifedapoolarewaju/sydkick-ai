import { app, dialog, Menu, nativeImage, Tray, globalShortcut } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import path from 'path'
import MenuBuilder from './menu'
import * as appMetrics from './metric'
import { sleep } from './helpers'
import { addIpcHandlers } from './handlers'
import { deleteSettings } from './settings'
import { allWindows, createQuickStartWindow, hideAllWindows, showAllWindows } from './windows'
import { createMainWindow } from './windows'
import { ensureLogin, ensureMicPermission } from './prerequisite'

function initAutoUpdater() {
    log.transports.file.level = 'info'
    autoUpdater.logger = log

    autoUpdater.on('update-downloaded', (e) => {
        const dialogOpts = {
            buttons: ['Install Update', 'Dismiss'],
            title: 'Application Update',
            message: `Install the new SydKick version ${e.version}`,
            detail:
              'A new version has been downloaded. Would you like to install this new version (App will be restarted)?'
        }

        dialog.showMessageBox({...dialogOpts, type: 'info' }).then(async (returnValue) => {
            if (returnValue.response !== 0) {
                appMetrics.logEvent({ event: 'dismissed-app-update' })

                return
            }

            appMetrics.logEvent({ event: 'installing-app-update' })

            // wait for log event to be sent
            await sleep(2000)

            autoUpdater.quitAndInstall()
        })
    })

    autoUpdater.checkForUpdatesAndNotify().then((result) => {
        if (!result || result?.updateInfo.version === app.getVersion()) {
            return
        }

        appMetrics.logEvent({ event: 'app-update-found' })
    })
}

const creatTray = (): Tray => {
    const icon = path.join(`${__dirname}/../../img/icon.png`) // required.
    const trayicon = nativeImage.createFromPath(icon)
    const tray = new Tray(trayicon.resize({ width: 16 }))
    const trayMenu = Menu.buildFromTemplate([
        {
            label: 'Show SydKick',
            accelerator: 'CommandOrControl+Shift+\\',
            registerAccelerator: true,
            click () {
                showAllWindows()
            }
        },
        {
            label: 'Hide SydKick',
            click () {
                hideAllWindows()
            }
        },
        { type: 'separator' },
        {
            label: 'Sign Out',
            async click () {
                await deleteSettings()
                app.relaunch()
                app.exit()
            }
        },
        {
            label: 'Quit SydKick',
            click () {
                app.quit()
            }
        }
    ])

    tray.setContextMenu(trayMenu)
    return tray
}

let appTray: Tray

app.whenReady().then(async () => {
    try {
        addIpcHandlers()
        await appMetrics.initialise()

        const { success, hadToLogin } = await ensureLogin()
        if (!success) {
            appMetrics.logEvent({ event: 'login-cancelled' })
            // give the event a chance to go through
            await sleep(1000)

            // if no api key was saved, close the app
            app.quit()
            return
        }

        appMetrics.updateSessionConfig({ isReturningUser: !hadToLogin })

        const granted = await ensureMicPermission()
        if (!granted) {
            appMetrics.logEvent({ event: 'mic-permission-prevented' })

            dialog.showErrorBox('Microphone Permission Missing', 'Please navigate to your system prefrences to grant SydKick with access to your Microphone.')

            app.quit()
            return
        }

        if (hadToLogin) {
            await createQuickStartWindow()
        }

        const menuBuilder = new MenuBuilder()
        await menuBuilder.buildMenu()

        initAutoUpdater()
        createMainWindow()
        appTray = creatTray()

        globalShortcut.register('CommandOrControl+Shift+\\', () => {
            if (allWindows.main?.isVisible()) {
                hideAllWindows()
            } else {
                showAllWindows()
            }
        })

        app.on('activate', () => showAllWindows())
    } catch (error) {
        console.log(error)
        const errMsg = `${error}`
        const errLine = errMsg.split('\n')[0].slice(0, 300)
        appMetrics.logEvent({ event: 'app-launch-failed', value: errLine })

        dialog.showErrorBox('Application Error', errMsg)
    }
})

app.on('window-all-closed', () => {
    // not quitting app here cos this isn't how or where we fall.
    appMetrics.logEvent({ event: 'all-windows-closed' })
})

app.on('before-quit', () => {
    appMetrics.logEvent({ event: 'app-closed' })
})

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})
