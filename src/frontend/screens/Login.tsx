import { useState } from 'react'
import { Button, Space, Input, Typography, message } from 'antd'

const OPEN_AI_URL = 'https://platform.openai.com/api-keys'

export function Login () {
    const [apiKey, setApiKey] = useState<string>()
    const [loading, setLoading] = useState<boolean>(false)

    const submit = async () => {
        const stripped = apiKey?.trim()
        if (!stripped) {
            // todo: show error message
            return
        }

        setLoading(true)
        await window.bridge.saveSettings({
            openAiKey: stripped,
            openAiModel: 'gpt-4o-mini',
            aiVoiceGender: 'male',
            contextWindow: 10
        })

        setLoading(false)
        message.success('API Key saved successfully')

        setTimeout(() => {
            // close the window after saving the settings
            // for on-close event to be triggered and continue the flow
            window.close()
        }, 1000)
    }

    return (
        <div style={{ padding: '15px' }} className="dd-able">
            <Space direction='vertical' style={{ width: '100%', paddingTop: '20px' }} size="large" className='no-dd-able'>
                <div style={{ width: '100%', textAlign: 'center' }}>
                    <img src="img/logo-alpha.png" width="50px" alt="" />
                </div>
                <Space direction='vertical' style={{ width: '100%' }} size="small">
                    <Typography.Title level={5} style={{ textAlign: 'center' }}>Enter your OpenAI API Key</Typography.Title>
                    <Input
                        placeholder='sk-gibberinshy-gibberish-gibberish'
                        size='large'
                        style={{ width: '100%' }}
                        type='password'
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </Space>
        
                <Button
                    type='primary'
                    style={{ width: '100%' }}
                    onClick={submit}
                    loading={loading}
                >
                    Save
                </Button>

                <Typography.Text style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
                    You can <a onClick={() => window.bridge.openURL(OPEN_AI_URL)}>click this link</a> to find or generate your OpenAI API Key. You may need to create an OpenAI account first.
                </Typography.Text>
            </Space>

        </div>
    )
}