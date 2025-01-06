import {
    app,
    Menu,
    shell,
    MenuItemConstructorOptions,
} from 'electron'
import { allWindows } from './windows'

export default class MenuBuilder {
    async buildMenu(): Promise<Menu> {
        const template = menuTemplate()

        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
        return menu
    }
}


const menuTemplate = (): MenuItemConstructorOptions[] => {
    const template: MenuItemConstructorOptions[] = [
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
            ],
        },
        {
            label: 'View',
            submenu: [
                // TODO: remove this before deploying
                {
                    label: 'Reload',
                    accelerator: 'Command+R',
                    click: () => {
                        allWindows.main?.webContents.reload()
                    },
                },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            role: 'window',
            submenu: [{ role: 'close' }, { role: 'minimize' }],
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click() {
                        shell.openExternal('https://sydkick.ai')
                    },
                },
                {
                    label: 'Report an issue',
                    click() {
                        shell.openExternal(
                            'https://github.com/ifedapoolarewaju/sydkick-ai/issues/new'
                        )
                    },
                },
                {
                    label: 'Tweet about SydKick',
                    click() {
                        shell.openExternal(
                            'https://twitter.com/intent/tweet?original_referer=https%3A%2F%2Fsydkick.ai%2F&ref_src=twsrc%5Etfw&text=AI%20Assistant%20that%20is%20there%20when%20you%20need%20it&tw_p=tweetbutton&url=https%3A%2F%2Fsydkick.ai%2F'
                        )
                    },
                },
            ],
        },
    ]

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        })

        // Edit menu
        const editMenu = template.find(i => i.label === 'Edit')!.submenu as MenuItemConstructorOptions[]
        editMenu?.push(
            { type: 'separator' },
            {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
            }
        )

        // Window menu
        const windoMenu = template.find(i => i.role === 'window')!.submenu as MenuItemConstructorOptions[]
        windoMenu?.push(
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        )
    }

    return template
}
