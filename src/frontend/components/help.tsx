import { Button, Space, Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'


export function Help () {
    const helpUrl = 'https://github.com/ifedapoolarewaju/sydkick-ai/issues/new'

    return (
        <div style={{ padding: '15px' }}>
            <Button
                icon={<CloseOutlined />}
                onClick={() => window.close()}
                shape='circle'
                style={{ position: 'absolute', right: '10px', top: '10px', border: 'none' }}
            />
            <Typography.Title level={4} style={{ width: '100%', textAlign: 'center', marginTop: '5px' }}>Help</Typography.Title>
            <Space direction='vertical' style={{ width: '100%', paddingTop: '10px' }} size="middle">
                <Space direction='horizontal' style={{ width: '100%' }} size="middle">
                    <div
                        style={{
                            border: '1px solid #888',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            textAlign: 'center',
                        }}
                    >
                        <img src="img/voice.png" alt="" width="25px" style={{ marginTop: '8px' }} />
                    </div>
                    <Typography.Text style={{ fontSize: '12px' }}>
                        {/* description for what the voice only functionality does */}
                        <b style={{ textDecoration: 'underline' }}>The "Voice only"</b> button allows you to interact with the SydKick AI assistant by speaking directly into it.
                        When this button is used, a screenshot of your screen will NOT be captured nor sent to the AI model.
                    </Typography.Text>
                </Space>
                <Space direction='horizontal' style={{ width: '100%' }} size="middle">
                    <div
                        style={{
                            border: '1px solid #888',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            textAlign: 'center',
                        }}
                    >
                        <img src="img/voice-plus.png" alt="" width="25px" style={{ marginTop: '8px' }} />
                    </div>
                    <Typography.Text style={{ fontSize: '12px' }}>
                        {/* description for what the voice and screen functionality does */}
                        <b style={{ textDecoration: 'underline' }}>The "Voice and Screen"</b> button allows you to interact with SydKick AI by using both voice and giving it a screenshot image of your computer for the moment when the button is pressed.
                        Once the button is released, no futher screenshot will be visible to the AI assistant.
                    </Typography.Text>
                </Space>
                <Space direction='vertical' style={{ width: '100%' }} size="small">
                    <Typography.Title level={5} style={{ textAlign: 'center', marginTop: '10px'}}>Shortcuts</Typography.Title>
                    <Typography.Text style={{ fontSize: '12px' }}>
                        {/* description for what the context window does */}
                        You can activate or hide SydKick at any point with the Keyboard shortcut <b>CMD+SHIFT+\</b> on macOS and <b>CTRL+SHIFT+\</b> on Windows and Linux
                    </Typography.Text>
                </Space>
                <Space direction='vertical' style={{ width: '100%' }} size="small">
                    <Typography.Title level={5} style={{ textAlign: 'center', marginTop: '10px'}}>Report an Issue</Typography.Title>
                    <Typography.Text style={{ fontSize: '12px' }}>
                        {/* description for what the context window does */}
                        To report an issue or request for a feature <Typography.Link onClick={() => window.bridge.openURL(helpUrl)}>please click this link</Typography.Link> and enter a description of the issue you are facing.
                    </Typography.Text>
                </Space>
            </Space>
        </div>
    )
}