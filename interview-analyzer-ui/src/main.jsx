import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import useThemeStore from './store/themeStore.js'

function ThemeProvider({ children }) {
    const theme = useThemeStore((s) => s.theme)

    useEffect(() => {
        // Apply data-theme attribute to <html> so CSS vars cascade everywhere
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
