import { Button, Space, Typography } from 'antd'


export function QuickStart () {
    return (
        <div style={{ padding: '15px' }}>
            <Typography.Title level={4} style={{ width: '100%', textAlign: 'center', marginTop: '5px' }}>Quick Start</Typography.Title>
            <Space direction='vertical' style={{ width: '100%', paddingTop: '10px' }} size="middle">
                <Space direction='vertical' style={{ width: '100%' }} size="small">
                    <Typography.Text style={{ fontSize: '15px' }}>
                        Press and HOLD the mic button to speak. Release the mic button once you are done speaking.
                    </Typography.Text>
                </Space>

                <Typography.Title level={5} style={{ textAlign: 'center', marginTop: '10px', textDecoration: 'underline' }}>Mic Button Types</Typography.Title>

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
                    <Typography.Text style={{ fontSize: '15px' }}>
                        {/* description for what the voice only functionality does */}
                        <b style={{ fontSize: '15px' }}>Voice Only</b> - AI will listen to your voice input
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
                    <Typography.Text style={{ fontSize: '15px' }}>
                        {/* description for what the voice and screen functionality does */}
                        <b style={{ fontSize: '15px' }}>Voice and Screen</b> - AI will listen to your voice input and take a screenshot of your display at the point of clicking.
                    </Typography.Text>
                </Space>
                
                <Button
                    type='primary'
                    style={{ width: '100%', marginTop: '40px' }}
                    onClick={() => window.close()}
                >
                    Got it!
                </Button>
            </Space>
        </div>
    )
}