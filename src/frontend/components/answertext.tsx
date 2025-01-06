import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'


export function AnswerText () {
    const [lastAnswerText, setLastAnswerText] = useState<string | null>(null)

    useEffect(() => {
        window.bridge.getLastAnswerText().then((text) => {
            setLastAnswerText(text)
        })
    }, [])
    
    return (
        <div style={{ padding: '15px', fontFamily: 'sans-serif', fontSize: '13px', letterSpacing: '1px', lineHeight: '20px' }} className='slide-in-from-left-calm'>
            <Button
                icon={<CloseOutlined />}
                onClick={() => window.close()}
                shape='circle'
                style={{ position: 'absolute', right: '10px', top: '10px', border: 'none' }}
            />
            <Markdown
                components={{
                    code(props) {
                        const {children, className, node, ...rest} = props
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                            // @ts-ignore
                            <SyntaxHighlighter
                                {...rest}
                                PreTag="div"
                                children={String(children).replace(/\n$/, '')}
                                language={match[1]}
                                style={atomDark}
                            />
                        ) : (
                            <code {...rest} className={className}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {lastAnswerText}
            </Markdown>
        </div>
    )
}