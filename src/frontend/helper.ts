interface AudioStreamHandlerOptions {
    requestId: string
    mediaSource: MediaSource
    onFirstChunk: () => boolean
}

export function handleStreamingAudioOutput(opts: AudioStreamHandlerOptions) {
    const requestId = opts.requestId
    const mediaSource = opts.mediaSource
    const outputChunks: ArrayBuffer[] = []
    let chunkPosition = 0
    let chunkAppendingStarted = false
    let chunkStreamEnded = false
    let shouldAbort = false
    let callMeWinkWink = false

    mediaSource.addEventListener('sourceopen', () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
        sourceBuffer.mode = 'sequence'

        window.bridge.onAudioOutputChunk(requestId, (maybeChunk) => {
            if (shouldAbort) {
                // returning true is important so this
                // callback doesn't get invoked again
                return true
            }

            console.log('received chunk', maybeChunk?.byteLength)

            if (maybeChunk === null) {
                chunkStreamEnded = true

                if (chunkPosition + 1 >= outputChunks.length) {
                    console.log('ending stream instanta')
                    mediaSource.endOfStream()
                }

                return
            }

            outputChunks.push(maybeChunk)

            if (!chunkAppendingStarted) {
                chunkAppendingStarted = true
                shouldAbort = opts.onFirstChunk()

                if (!shouldAbort) {
                    sourceBuffer.appendBuffer(outputChunks[chunkPosition])
                }

                return
            }

            if (callMeWinkWink) {
                chunkPosition = chunkPosition + 1
                sourceBuffer.appendBuffer(outputChunks[chunkPosition])

                callMeWinkWink = false
            }
        })

        sourceBuffer.onupdateend = () => {
            if (chunkPosition + 1 >= outputChunks.length && chunkStreamEnded) {
                console.log('ending stream')
                mediaSource.endOfStream()

                return
            }

            if (chunkPosition + 1 >= outputChunks.length) {
                callMeWinkWink = true

                return
            }

            chunkPosition = chunkPosition + 1
            sourceBuffer.appendBuffer(outputChunks[chunkPosition])
        }
    })
}