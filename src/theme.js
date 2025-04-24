// src/theme.js
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let baseTheme = createTheme({
  typography: {
    fontFamily: '"RetroFont", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      // 2.5rem on very小 screens → 最大 4.5rem on 超ワイド
      fontSize: 'clamp(2.5rem, 1.6rem + 4vw, 4.5rem)',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: 'clamp(2rem, 1.2rem + 3vw, 3.5rem)',
      lineHeight: 1.25,
    },
    h3: {
      fontWeight: 700,
      fontSize: 'clamp(1.75rem, 1rem + 2.2vw, 3rem)',
      lineHeight: 1.3,
      textShadow: '2px 2px #000',
    },
  },
  palette: {
    mode: 'light',
    primary:   { main: '#00b7ff' },   // ---- ロゴ水色
    secondary: { main: '#004c7f' },   // ---- ロゴの濃い部分
    error:     { main: '#d32f2f' },
    background:{ default: '#f5f7fa', paper: '#ffffff' },
    text:      { primary: '#212121' },
  },
  components:{
    MuiButton:{
      styleOverrides:{
        root:{ fontWeight:600, textTransform:'none' }
      }
    }
  }
});
export const theme = responsiveFontSizes(baseTheme);