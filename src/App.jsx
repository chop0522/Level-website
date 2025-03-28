// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AppBar, Toolbar, Button, Typography } from '@mui/material';

// ▼ 店内色合い (茶,青,赤,白,黒) を反映したテーマ
const theme = createTheme({
  palette: {
    primary: {
      main: '#3e2723' // 茶色
    },
    secondary: {
      main: '#0d47a1' // 青
    },
    error: {
      main: '#b71c1c' // 赤
    },
    background: {
      default: '#ffffff' // 白
    },
    text: {
      primary: '#000000' // 黒
    }
  },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();

  useEffect(() => {
    // 保存されているトークンを再読み込み
    setToken(localStorage.getItem('token') || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/');
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Board Game Cafe
          </Typography>
          {token ? (
            <>
              <Button color="inherit" onClick={() => navigate('/mypage')}>
                My Page
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/register"
          element={<Register token={token} setToken={setToken} />}
        />
        <Route
          path="/login"
          element={<Login token={token} setToken={setToken} />}
        />
        <Route
          path="/mypage"
          element={<MyPage token={token} />}
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;