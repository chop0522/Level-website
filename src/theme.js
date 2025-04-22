// src/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  typography: {
    fontFamily: '"RetroFont", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700, textShadow: '2px 2px #000' },
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