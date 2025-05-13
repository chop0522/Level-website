// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';
import './retroTheme.css'; // レトロ風CSS
import { register as registerSW } from './serviceWorkerRegistration';

// prefers-color-scheme に従ってダーク / ライトを切替
const prefersDark = window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const theme = createTheme({
  palette: {
    mode: prefersDark ? 'dark' : 'light'
  }
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);

// オフラインキャッシュ用 Service Worker を有効化
registerSW();