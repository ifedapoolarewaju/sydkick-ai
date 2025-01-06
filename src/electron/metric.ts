import axios from 'axios'
import { app } from 'electron'
import isDev from 'electron-is-dev'
import { loadResourceFile } from './helpers/storage'

const DEFAULT_ENGAGEMENT_TIME_MSEC = 100
const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect'

const eventStorage: Record<string, number> = {}

interface GA4Credentials {
    measurementId: string
    apiSecret: string
}

interface Session {
    ga4Id: string
    ga4Secret: string
    id: string
    appVersion: string
    platform: string
    isReturningUser?: boolean
}

interface EventRequest {
    event: string
    value?: string
}

interface InitConfig {
    isReturningUser: boolean
}

let session: Session | null = null
let eventCount = 0

export async function initialise(config?: InitConfig) {
    if (isDev) {
        return
    }

    if (session) {
        return
    }

    const ga4Creds = await loadResourceFile<GA4Credentials>('ga4')
    if (!ga4Creds) {
        return
    }

    const appVersion = app.getVersion()

    session = {
        ga4Id: ga4Creds.measurementId,
        ga4Secret: ga4Creds.apiSecret,
        id: createSessionID(),
        appVersion: appVersion,
        platform: process.platform,
        isReturningUser: config?.isReturningUser
    }

    eventCount = 0
}

export function updateSessionConfig(conf: InitConfig) {
    if (!session) {
        return
    }

    session = { ...session, ...conf }
}

export async function logEvent(evt: EventRequest) {
    if (!session) {
        console.log('skipping event log - Session not initialised', evt)
        return
    }

    try {
        const name = evt.event.replace(/[\s-]/g, '_')
        const clientId = session.id
        const sessionId = session.id
        const evtParams = {
            // Configure session id and engagement time if not present, for more details see:
            // https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
            session_id: sessionId,
            engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_MSEC,
            action: evt.value,
            event_label: evt.value,
        }

        const url = `${GA_ENDPOINT}?measurement_id=${session.ga4Id}&api_secret=${session.ga4Secret}`
        const body = {
            client_id: clientId,
            events: [{ name, params: evtParams }],
            user_properties: {
                os_platform: {
                    value: session.platform
                },
                app_version: {
                    value: session.appVersion
                },
                user_stage: {
                    value: session.isReturningUser ? 'returning' : 'fresh'
                }
            }
        }

        await axios.post(url, body)

        eventCount += 1
    } catch (e) {
        console.error('Failed to send event', e)
    }
}

export async function logEventOnce(evt: EventRequest) {
    if (eventStorage[evt.event]) {
        return
    }

    eventStorage[evt.event] = 1
    await logEvent(evt)
}

export async function logEventSparingly(evt: EventRequest) {
    const count = eventStorage[evt.event] || 0
    eventStorage[evt.event] = count + 1

    if (count % 5 !== 0) {
        return
    }

    await logEvent(evt)
}

function createSessionID () {
    const epochInSeconds = Math.floor(Date.now() / 1000).toString()
    const random = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0')

    return `${random}-${epochInSeconds}`
}
