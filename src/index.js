// src/index.js
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App'
import './retroTheme.css' // レトロ風CSS
import { register as registerSW } from './serviceWorkerRegistration'
import { AuthProvider } from './contexts/TokenContext'
import theme from './theme'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)

// オフラインキャッシュ用 Service Worker を有効化
registerSW()
