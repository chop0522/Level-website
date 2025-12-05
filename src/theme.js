// src/theme.js
import { createTheme, responsiveFontSizes } from '@mui/material/styles'

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0083cc',
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#111111',
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily:
      '"Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: 'clamp(2.5rem, 1.6rem + 4vw, 4.5rem)',
      lineHeight: 1.2,
      fontFamily:
        '"RetroFont","Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    h2: {
      fontWeight: 700,
      fontSize: 'clamp(2rem, 1.2rem + 3vw, 3.5rem)',
      lineHeight: 1.25,
      fontFamily:
        '"RetroFont","Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    h3: {
      fontWeight: 700,
      fontSize: 'clamp(1.75rem, 1rem + 2.2vw, 3rem)',
      lineHeight: 1.3,
      textShadow: '2px 2px #000',
      fontFamily:
        '"RetroFont","Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    button: { textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { fontWeight: 600, textTransform: 'none' },
      },
    },
  },
})

const theme = responsiveFontSizes(baseTheme)

export default theme
