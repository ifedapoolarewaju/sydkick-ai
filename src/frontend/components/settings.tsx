import { useEffect, useState } from 'react'
import { Button, Space, Input, Select, Typography, message } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { AppSettings } from '../../electron/settings'


export function Settings () {
    const [settings, setSettings] = useState<AppSettings>()
    const [modifiedSettings, setModifiedSettings] = useState<AppSettings>({})
    const [apiKeyVisible, setApiKeyVisible] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        window.bridge.getSettings().then((maybeSettings) => {
            if (maybeSettings) {
                setSettings(maybeSettings)
                setModifiedSettings(maybeSettings)
            }
        })
    }, [])

    const updateModifiedSettings = (key: keyof AppSettings, value: string) => {
        setModifiedSettings({
            ...modifiedSettings,
            [key]: value
        })
    }

    const saveSettings = async () => {
        if (!modifiedSettings.openAiKey) {
            message.error('API Key is required!')
            return
        }

        setLoading(true)
        await window.bridge.saveSettings(modifiedSettings)
        setSettings(modifiedSettings)
        message.success('Settings saved!')
        setLoading(false)
    }
    
    return (
        <div style={{ padding: '15px' }}>
            <Button
                icon={<CloseOutlined />}
                onClick={() => window.close()}
                shape='circle'
                style={{ position: 'absolute', right: '10px', top: '10px', border: 'none' }}
            />
            <Typography.Title level={4} style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}>Settings</Typography.Title>
            <Space direction='vertical' style={{ width: '100%', paddingTop: '15px' }} size="large">
                <Space direction='vertical' style={{ width: '100%' }} size="small">
                    <Typography.Text style={{ fontSize: '12px' }}>OpenAI API Key</Typography.Text>
                    <Input.Password
                        visibilityToggle={{
                            visible: apiKeyVisible,
                            onVisibleChange: (visible) => setApiKeyVisible(visible)
                        }}
                        readOnly={!apiKeyVisible}
                        placeholder='API Key'
                        size='middle'
                        style={{ width: '100%' }}
                        type='password'
                        value={modifiedSettings.openAiKey}
                        onChange={(e) => updateModifiedSettings('openAiKey', e.target.value)}
                    />
                </Space>

                <Space direction='vertical' style={{ width: '100%' }} size="small">
                    <Typography.Text style={{ fontSize: '12px' }}>OpenAI Model</Typography.Text>
                    <Select
                        style={{ minWidth: '100%' }}
                        value={modifiedSettings.openAiModel}
                        onChange={(val) => updateModifiedSettings('openAiModel', val)}
                        options={[
                            { value: 'gpt-4o', label: 'GPT-4o' },
                            { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
                            { value: 'o1', label: 'o1' },
                            { value: 'o1-mini', label: 'o1-mini' },

                        ]}
                    />
                </Space>

                <Space direction='vertical' style={{ width: '100%' }} size="small">
                    <Typography.Text style={{ fontSize: '12px' }}>AI Assistant Voice Type</Typography.Text>
                    <Select
                        style={{ minWidth: '100%' }}
                        value={modifiedSettings.aiVoiceGender}
                        onChange={(val) => updateModifiedSettings('aiVoiceGender', val)}
                        options={[
                            { value: 'male', label: 'Masculine Voice' },
                            { value: 'female', label: 'Feminine Voice' },

                        ]}
                    />
                </Space>

                <Space direction='vertical' style={{ width: '100%' }} size="small">
                    <Typography.Text style={{ fontSize: '12px' }}>Context Window</Typography.Text>
                    <Select
                        value={modifiedSettings.contextWindow?.toString()}
                        onChange={(val) => updateModifiedSettings('contextWindow', val)}
                        style={{ minWidth: '100%' }}
                        options={[
                            { value: '5', label: '5 Messages' },
                            { value: '10', label: '10 Messages' },
                            { value: '15', label: '15 Messages' },
                            { value: '20', label: '20 Messages' },

                        ]}
                    />
                </Space>
            </Space>

            <Button
                type='primary'
                style={{ width: '100%', marginTop: '35px' }}
                onClick={saveSettings}
                loading={loading}
            >
                Save
            </Button>
        </div>
    )
}