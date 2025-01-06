import axios from 'axios'
import OpenAI from 'openai'
import FormData from 'form-data'
import { dialog } from 'electron'
import { AppSettings, getSettings } from '../settings'

const CHAT_HISTORY: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

let _openai: OpenAI
let _settings: AppSettings

async function getClient (): Promise<[OpenAI, AppSettings]> {
    const maybeSettings = await getSettings()

    // we are also ensuring that the settings object hasn't been updated
    // since we last loaded it
    if (_openai && _settings && maybeSettings === _settings) {
        return [_openai, _settings]
    }

    if (!maybeSettings?.openAiKey) {
        // this should never happen since we are checking fot the key
        // on startup, but just in case
        dialog.showErrorBox('Application Error', 'OpenAI API Key not found')

        // todo: figure a better way to handle this
        throw new Error('OpenAI API Key not found')
    }

    _openai = new OpenAI({ apiKey: maybeSettings.openAiKey })
    _settings = maybeSettings

    return [_openai, _settings]
}

export async function audioToText (audioInput: ArrayBuffer): Promise<string | undefined> {
    const [client, _] = await getClient()

    const data = new FormData()
    data.append('model', 'whisper-1')
    data.append('file', Buffer.from(audioInput), { filename: 'audio.wav' })

    try {
        const resp = await axios.post<{ text: string }>('https://api.openai.com/v1/audio/transcriptions', data, {
            headers: {
                Authorization: `Bearer ${client.apiKey}`
            }
        })
    
        return resp.data.text
    } catch (error) {
        dialog.showErrorBox('Application Error', 'Unable to convert your Audio input to text')

        // todo: these logs should be handled by electron log
        console.log('audio to text failed', error)
        return
    }
}

export async function textToAudio (text: string, onDataChunk?: (dat: ArrayBuffer | null) => void): Promise<ArrayBuffer> {
    const [client, settings] = await getClient()

    try {
        // avoiding the following error 400 [{'type': 'string_too_long', 'loc': ('body', 'input'),
        // 'msg': 'String should have at most 4096 characters',
        const inputText = ensureWithinCharacterLimit(text)
        const resp = await client.audio.speech.create({
            input: inputText,
            model: 'tts-1',
            voice: settings.aiVoiceGender === 'female' ? 'nova' : 'alloy',
            response_format: 'mp3'
        })

        let allBuffer = Buffer.from([])

        const stream = resp.body as unknown as NodeJS.ReadableStream
        stream.on('data', (chunk: Buffer) => {
            allBuffer = Buffer.concat([allBuffer, chunk])

            if (onDataChunk) {
                onDataChunk(Buffer.from(chunk))
            }
        })

        await new Promise<void>((resolve, reject) => {
            stream.on('end', resolve)
            // todo: throw this error
            stream.on('error', reject)
        })

        if (onDataChunk) {
            onDataChunk(null) // Signal that the stream has ended
        }
        return allBuffer.buffer
    } catch (error) {
        dialog.showErrorBox('Application Error', 'Unable to convert AI text response to Audio')

        console.log(error)
        throw error
    }
}

export interface PromptResponse {
    text: string
    audio: ArrayBuffer
}

export async function respondToPrompt (prompt: string, base64ImageDataURL?: string): Promise<string | null> {
    const [client, settings] = await getClient()

    const imgContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []
    if (base64ImageDataURL) {
        imgContent.push({ type: 'text', text: 'The following image is a screenshot of my computer screen' })
        imgContent.push({ type: 'image_url', image_url: { url: base64ImageDataURL } })
    }

    const modelName = settings.openAiModel || 'gpt-4o-mini'
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
        role: 'user',
        content: [...imgContent, { type: 'text', text: prompt }]
    }]

    try {
        const resp = await client.chat.completions.create({
            model: modelName,
            messages: [
                ...CHAT_HISTORY,
                ...messages
            ]
        })
    
        // update chat history to keep last n messages
        CHAT_HISTORY.push(messages[0])
        CHAT_HISTORY.push(resp.choices[0].message)
        
        const contextWindow = settings.contextWindow || 10
        while (CHAT_HISTORY.length > contextWindow) {
            CHAT_HISTORY.shift()
        }
    
        return resp.choices[0].message.content
    } catch (error) {
        dialog.showErrorBox('Application Error', 'The AI Model is unable to respond to your question')
        console.log(error)

        return null
    }
}

export async function respondToAudioPrompt (audioInput: ArrayBuffer): Promise<PromptResponse | null> {
    const [client, settings] = await getClient()

    // todo: in this case, we are not able to use nova, so the voices will be inconsistent.
    // however, we are currently never using respondToAudioPrompt, so it's not an apparent problem
    const voice = settings.aiVoiceGender === 'female' ? 'shimmer' : 'alloy'

    try {
        const resp = await client.chat.completions.create({
            model: 'gpt-4o-audio-preview',
            modalities: ['text', 'audio'],
            audio: { voice: voice, format: 'mp3'},
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_audio',
                            input_audio: {
                                data: Buffer.from(audioInput).toString('base64'),
                                format: 'wav'
                            }
                        }
                    ]
                }
            ]
        })
    
        const message = resp.choices[0].message
        if (!message.audio?.data) {
            return null
        }
    
        console.log('the transcipt', message.audio.transcript)
        return {
            text: message.audio.transcript,
            audio: Buffer.from(message.audio.data, 'base64').buffer
        }
    } catch (error) {
        dialog.showErrorBox('Application Error', 'AI Model failed while processing your question')

        console.log(error)
        return null
    }
}

export async function getLastAnswerText (): Promise<string | null> {
    // reverse search last assistant message using find
    const lastAssistantMessage = CHAT_HISTORY.slice().reverse().find((msg) => msg.role === 'assistant')
    if (!lastAssistantMessage?.content) {
        return null
    }

    if (typeof lastAssistantMessage.content === 'string') {
        return lastAssistantMessage.content
    }

    // answers are always set as text content
    return null
}


function ensureWithinCharacterLimit (text: string): string {
    const maxLength = 4096
    const prependDisclaimer = "Heads-up! I'm reading you a truncated version of the response due to the length of the original response. For the more complete version, please read the text.\n"

    if (text.length <= maxLength) {
        return text
    }

    console.log('truncating text')

    const truncatedText = text.slice(0, maxLength - prependDisclaimer.length)
    const lastTerminatorIndex = Math.max(
        truncatedText.lastIndexOf('.'),
        truncatedText.lastIndexOf('!'),
        truncatedText.lastIndexOf('?'),
        truncatedText.lastIndexOf('\n')
    )

    const finalText = lastTerminatorIndex > -1 ? truncatedText.slice(0, lastTerminatorIndex + 1) : truncatedText

    return prependDisclaimer + finalText
}