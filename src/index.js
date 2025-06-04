// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';
import './retroTheme.css'; // レトロ風CSS
import { register as registerSW } from './serviceWorkerRegistration';
import { AuthProvider } from './contexts/TokenContext';

// prefers-color-scheme に従ってダーク / ライトを切替
const prefersDark = window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

// 8‑bit 基調色パレット
const bitPalette = {
  primary:   { main: '#ff004d' }, // ビビッド赤
  secondary: { main: '#00e5ff' }, // シアン
  success:   { main: '#00c000' }, // グリーン
  warning:   { main: '#ffa300' }, // オレンジ
  error:     { main: '#ff3860' }, // ピンクレッド
  info:      { main: '#29abe2' }  // ブルー
};

const theme = createTheme({
  palette: {
    mode: prefersDark ? 'dark' : 'light',
    ...bitPalette
  },
  typography: {
    button: {
      fontFamily: '"Press Start 2P", sans-serif',
      textTransform: 'none',
      fontSize: '0.75rem'
    }
  },
  shape: { borderRadius: 2 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: 'none',
          '&:active': { transform: 'translateY(1px)' }
        },
        containedPrimary: {
          backgroundColor: bitPalette.primary.main,
          '&:hover': { backgroundColor: '#d60042' }
        },
        containedSecondary: {
          backgroundColor: bitPalette.secondary.main,
          '&:hover': { backgroundColor: '#00bcd4' }
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: bitPalette.secondary.main,
          textDecorationColor: bitPalette.secondary.main,
          '&:hover': { textDecorationColor: bitPalette.primary.main }
        }
      }
    }
  }
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

// オフラインキャッシュ用 Service Worker を有効化
registerSW();