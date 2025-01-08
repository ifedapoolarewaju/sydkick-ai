import { MouseEventHandler, useRef, useState } from 'react'
import { CloseOutlined, LoadingOutlined, PauseOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Space, Spin, Tooltip } from 'antd'
import { MediaRecorder as WavMediaRecorder, IMediaRecorder, register as registerCustomEncoder } from 'extendable-media-recorder'
import { connect as connectWavEncoder } from 'extendable-media-recorder-wav-encoder'
import { handleStreamingAudioOutput } from '../helper'

let audioInputMediaRecorder: MediaRecorder
let customEncoderRegistered = false

const CANCELLED_REQUESTS = new Set<string>()
const VOICE_ONLY_ID = 'voice'
const VOICE_AND_SCREEN_ID = 'voice-plus'
type RecordingType = typeof VOICE_ONLY_ID | typeof VOICE_AND_SCREEN_ID

function Home() {
    const [audioResp, setAudioResp] = useState<string>()
    const [loading, setLoading] = useState(false)
    const [recording, setRecording] = useState(false)
    const [recordingType, setRecordingType] = useState<RecordingType>()
    const [soundPlaying, setSoundPlaying] = useState(false)
    const [navPosition, setNavPosition] = useState(1)
    const [requestId, setRequestId] = useState<string>()
    // ref for audio element
    const audioRef = useRef<HTMLAudioElement>(null)

    const beginOrEndRecording: MouseEventHandler<HTMLButtonElement> = async (e) => {
        recording ? endRecording(e) : beginRecording(e)
    }

    const beginRecording: MouseEventHandler<HTMLButtonElement> = async (e) => {
        const el = (e.target as HTMLElement).closest('button')
        setRecording(true)
        setRecordingType(el!.id as RecordingType)

        // todo: this block is not actually needed unless we are using WavMediaRecorder
        if (!customEncoderRegistered) {
            await registerCustomEncoder(await connectWavEncoder())
            customEncoderRegistered = true
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // uncomment next line if you require wav audio. E.g if you are sending
        // the audio to open AI's audio generator endpoint
        // audioInputMediaRecorder = new WavMediaRecorder(stream, { mimeType: 'audio/wav' })
        audioInputMediaRecorder = new MediaRecorder(stream)
        let audioInputChunks: Blob[] = []

        // Handle audio data as it becomes available
        audioInputMediaRecorder.ondataavailable = (event) => {
            console.log('pushing audio chunk')
            audioInputChunks.push(event.data)
        }

        // Handle when recording stops
        audioInputMediaRecorder.onstop = async () => {
            console.log('stopping audio recording')
            setLoading(true)
            setRecording(false)

            const newRequestId = Date.now().toString()
            setRequestId(newRequestId)

            const audioBlob = new Blob(audioInputChunks, { type: 'audio/webm' })
            const arrayBuffer = await audioBlob.arrayBuffer()
            if (isCancelled(newRequestId)) {
                return
            }

            const audioOutputMediaSource = new MediaSource()
            setAudioResp(URL.createObjectURL(audioOutputMediaSource))

            handleStreamingAudioOutput({
                requestId: newRequestId,
                mediaSource: audioOutputMediaSource,
                onFirstChunk: () => {
                    const shouldAbort = isCancelled(newRequestId)
                    if (shouldAbort) {
                        audioOutputMediaSource.endOfStream()
                    } else {
                        setNavPosition(2)
                        setLoading(false)
                    }

                    return shouldAbort
                }
            })

            console.log('sending audio')

            const includeScreenshot = el?.id === VOICE_AND_SCREEN_ID
            // Send audio input to the main process for a response
            const maybeResp = await window.bridge.handleAudioInput(arrayBuffer, newRequestId, includeScreenshot).catch((err) => {
                console.log(err)

                return undefined
            })

            // if no response was returned, it means the llm request failed
            // and audio output streamer hasn't done any cleaning up for us.
            if (!maybeResp && !isCancelled(newRequestId)) {
                setLoading(false)
            }
        }
    
        audioInputMediaRecorder.start()
    }

    const endRecording: MouseEventHandler<HTMLButtonElement> = async (e) => {
        const el = (e.target as HTMLElement).closest('button')
        el?.classList.remove('pulsating-button')

        if (audioInputMediaRecorder && audioInputMediaRecorder.state === 'recording') {
            audioInputMediaRecorder.stop()
            console.log('stopped recording')
        }
    }

    const navigateMenus = () => {
        setNavPosition((prev) => {
            const newVal = prev < 3 ? prev + 1 : 1
            if (!audioResp && newVal == 2) {
                // skip to 3 if no audio response
                return newVal + 1
            }

            return newVal
        })
    }

    const pauseOrPlayAudio = () => {
        if (!audioRef.current) return

        if (audioRef.current.paused) {
            audioRef.current.play()
        } else {
            audioRef.current.pause()
        }

        setSoundPlaying(!audioRef.current.paused)
    }

    const restartAudio = () => {
        if (!audioRef.current) return

        audioRef.current.currentTime = 0
        audioRef.current.play()
    }

    const cancelRequest = () => {
        if (requestId) {
            CANCELLED_REQUESTS.add(requestId)
            // if the cancel button was accessible, it means the app is currently in
            // loading state
            setLoading(false)
        }
    }

    const isCancelled = (targetRequestId: string) => {
        const cancalled = CANCELLED_REQUESTS.has(targetRequestId)
        if (cancalled) {
            // remove the id once it has been checked as cancelled.
            // the idea here is that the request will be aborted once it is detected as cancelled
            // so there won't be further checks for the same request id, and we can remove it to preserve memory
            CANCELLED_REQUESTS.delete(targetRequestId)
        }

        return cancalled
    }

    const onPlayerEnded = () => {
        setSoundPlaying(false)
        setNavPosition(1)
    }

    const loadingIcon = (<LoadingOutlined style={{ fontSize: 24 }} spin />)

    const menu1 = [
        <Tooltip
            title='Voice only'
            placement='right'
            arrow={false}
            {...(recording ? { open: false } : {})}
        >
            <Button
                id={VOICE_ONLY_ID}
                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                className={`no-dd-able ${recording && recordingType === VOICE_ONLY_ID ? 'pulsating-button' : ''}`}
                onClick={beginOrEndRecording}
                disabled={recording && recordingType !== VOICE_ONLY_ID}
            >
                <img
                    src={recording && recordingType === VOICE_ONLY_ID ? 'img/stop.png' : 'img/voice.png'}
                    alt=""
                    width={recording && recordingType === VOICE_ONLY_ID ? '15px' : '25px'}
                />
            </Button>
        </Tooltip>,
        <Tooltip title='Hide' placement='left' arrow={false}>
            <Button
                style={{ width: "40px", height: "40px", borderRadius: "50%", color: '#999' }}
                className='no-dd-able'
                onClick={() => window.bridge.hideMainWindow()}
                disabled={recording}
            >
                —
            </Button>
        </Tooltip>,
        <Tooltip
            title='Voice and Screen'
            placement='left'
            arrow={false}
            mouseEnterDelay={1}
            {...(recording ? { open: false } : {})}
        >
            <Button
                id={VOICE_AND_SCREEN_ID}
                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                className={`no-dd-able ${recording && recordingType === VOICE_AND_SCREEN_ID ? 'pulsating-button' : ''}`}
                onClick={beginOrEndRecording}
                disabled={recording && recordingType !== VOICE_AND_SCREEN_ID}
            >
                <img
                    src={recording && recordingType === VOICE_AND_SCREEN_ID ? 'img/stop.png' : 'img/voice-plus.png'}
                    alt=""
                    width={recording && recordingType === VOICE_AND_SCREEN_ID ? '15px' : '25px'}
                />
            </Button>
        </Tooltip>,
    ]

    const menu2 = [
        <Tooltip title='Replay last answer' placement='right' arrow={false}>
            <Button
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: 'white' }}
                className='no-dd-able'
                disabled={soundPlaying}
                onClick={restartAudio}
            >
                <img src={soundPlaying ? "img/sound.gif" : "img/restart.png"} alt="" width="20px" />
            </Button>
        </Tooltip>,
        <Tooltip title='Pause answer' placement='right' arrow={false} mouseEnterDelay={2}>
            <Button
                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                className='no-dd-able'
                icon={soundPlaying ? <PauseOutlined /> : <img src="img/play.png" width="15px"/>}
                onClick={pauseOrPlayAudio}
            />
        </Tooltip>,
        <Tooltip title='Read answer' placement='left' arrow={false}>
            <Button
                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                className='no-dd-able'
                onClick={() => window.bridge.openLastAnswerWindow()}
            >
                <img src="img/message-bubble-3.png" alt="" width="20px" />
            </Button>
        </Tooltip>,
    ]

    const menu3 = [
        <Tooltip title='Settings' placement='right' arrow={false}>
            <Button
                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                className='no-dd-able'
                onClick={() => window.bridge.openSettingsWindow()}
            >
                <img src="img/settings.png" alt="" width="18px" />
            </Button>
        </Tooltip>,
        // blank gap for spacing between buttons
        <div style={{width: '40px'}}></div>,
        <Tooltip title='Help' placement='right' arrow={false}>
            <Button
                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                className='no-dd-able'
                onClick={() => window.bridge.openHelpWindow()}
            >
                <img src="img/help.png" alt="" width="15px" />
            </Button>
        </Tooltip>,
    ]

    return (
        <div className='dd-able' style={{ height: '75vh'}}>
            {!loading && <Space style={{ marginTop: '7px'}}>
                {navPosition == 1 && <Space className='slide-in-from-left'>{menu1}</Space>}
                {navPosition == 2 && <Space className='slide-in-from-left'>{menu2}</Space>}
                {navPosition == 3 && <Space className='slide-in-from-left'>{menu3}</Space>}

                <div style={{ width: '2px', height: '40px', background: '#ddd', borderRadius: '15%' }} ></div>
                <Button
                    style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                    className='no-dd-able' icon={<RightOutlined style={{ color: '#aaa'}} />}
                    onClick={navigateMenus}
                    disabled={recording}
                />
            </Space>}

            {loading && <Space style={{ margin: '7px', width: '100%'}} size={105}>
                <Spin indicator={loadingIcon} />
                <Tooltip title='Cancel' placement='left' arrow={false}>
                    <Button
                        style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: 'red' }}
                        className='no-dd-able'
                        icon={<CloseOutlined style={{ color: 'white' }} />}
                        onClick={cancelRequest}
                    />
                </Tooltip>
            </Space>}

            {audioResp && <audio
                key="audio-player"
                src={audioResp}
                ref={audioRef}
                autoPlay={true}
                onEnded={onPlayerEnded}
                onPlay={() => {setSoundPlaying(true)}}
                className='no-dd-able'
            />}
        </div>
    )
}

export default Home
