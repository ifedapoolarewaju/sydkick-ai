import { desktopCapturer } from 'electron'
import * as appMetrics from '../metric'

/**
 * Returns screenshot as base64 data url
 * @returns {string}
 */
export async function getScreenshot (): Promise<string | undefined> {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 720, height: 720 } })
    if (!sources.length) {
        appMetrics.logEvent({ event: 'failed-screenshot-attempt' })

        console.log('screenshot abort, no sources found')
        return
    }

    console.log('screenshot available')
    return sources[0].thumbnail.toDataURL()
}

export async function sleep (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function errorFirstLine (error: unknown): string {
    return `${error}`.split('\n')[0].slice(0, 300)
}
