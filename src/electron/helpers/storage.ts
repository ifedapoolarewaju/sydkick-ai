import electron from 'electron'
import fs, { promises as fsP } from 'fs'
import path from 'path'

export async function canUseFileStorage (): Promise<boolean> {
    try {
        await fsP.access(`${electron.app.getPath('userData')}/`, fs.constants.W_OK)
        return true
    } catch (error) {
        console.log('reason', error)
        return false
    }
}

export async function ensureFolder (folderName: string): Promise<boolean> {
    const fullPath = path.join(electron.app.getPath('userData'), folderName)

    if (!fs.existsSync(fullPath)) {
        // make directory if it doesn't exist
        await fsP.mkdir(fullPath)
    }

    return true
}

export async function saveToFile (data: Record<string, any>, fileName: string, folderName?: string) {
    const steps = folderName ? [folderName, fileName] : [fileName]
    const fullPath = path.join(electron.app.getPath('userData'), ...steps)

    if (folderName) {
        await ensureFolder(folderName)
    }

    try {
        fs.writeFileSync(fullPath, JSON.stringify(data))
    } catch (err) {
        console.log(err)
        return
    }    
}

export async function readFromFile<T> (fileName: string, folderName?: string): Promise<T | void> {
    const steps = folderName ? [folderName, fileName] : [fileName]
    const fullPath = path.join(electron.app.getPath('userData'), ...steps)

    try {
        return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    } catch (err) {
        console.log(err)
        return
    }
}

export async function deleteFile (fileName: string, folderName?: string): Promise<boolean> {
    const steps = folderName ? [folderName, fileName] : [fileName]
    const fullPath = path.join(electron.app.getPath('userData'), ...steps)

    try {
        fs.unlinkSync(fullPath)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

export async function deleteFullPath (fullPath: string): Promise<boolean> {
    try {
        fs.unlinkSync(fullPath)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

export async function loadResourceFile<T> (fileName: string): Promise<T | void> {
    const steps = [fileName]
    const fullPath = path.join(`${__dirname}/../../../resources`, ...steps)

    try {
        return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    } catch (err) {
        console.log(err)
        return
    }
}
