import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './frontend/App'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
    <ConfigProvider theme={{token: { colorPrimary: 'rgb(138, 43, 226)' }}}>
        <App />
    </ConfigProvider>
)
