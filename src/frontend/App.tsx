import Home from './screens/Home'
import { Login } from './screens/Login'
import { QuickStart } from './screens/QuickStart'
import { AnswerText } from './components/answertext'
import { Settings } from './components/settings'
import { Help } from './components/help'
import './css/app.css'

function App() {
    if (window.bridge.view === 'answer-text') {
        return <AnswerText />
    }

    if (window.bridge.view === 'settings') {
        return <Settings />
    }

    if (window.bridge.view === 'home') {
        return <Home />
    }

    if (window.bridge.view === 'help') {
        return <Help />
    }

    if (window.bridge.view === 'quickstart') {
        return <QuickStart />
    }

    return <Login />
}

export default App
