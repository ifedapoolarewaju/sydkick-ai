import { BrowserWindow, desktopCapturer, Display, screen } from 'electron'
import * as appMetrics from '../metric'

/**
 * Returns screenshot as base64 data url
 * @returns {string}
 */
export async function getScreenshot (forDisplay?: Display): Promise<string | undefined> {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 720, height: 720 } })
    if (!sources.length) {
        appMetrics.logEvent({ event: 'failed-screenshot-attempt' })

        console.log('screenshot abort, no sources found')
        return
    }

    console.log('screenshot available', sources[0].display_id, forDisplay?.id)
    const targetSource = sources.find((i) => i.display_id === forDisplay?.id?.toString()) || sources[0]
    return targetSource.thumbnail.toDataURL()
}

export function getCurrentDisplay(window: BrowserWindow): Display {
    const windowBounds = window.getBounds();
    // Calculate the center point of the window
    const windowPoint = {
        x: windowBounds.x + windowBounds.width / 2,
        y: windowBounds.y + windowBounds.height / 2,
    };

    // Get the display nearest to the center point of the window
    const currentDisplay = screen.getDisplayNearestPoint(windowPoint);

    return currentDisplay
}

export async function sleep (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function errorFirstLine (error: unknown): string {
    return `${error}`.split('\n')[0].slice(0, 300)
}
