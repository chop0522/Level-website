// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Header from './components/Header';  // ★ 追加
import Footer from './components/Footer';  // ★ 追加

import { createTheme, ThemeProvider } from '@mui/material/styles';
// import { AppBar, Toolbar, Button, Typography } from '@mui/material'; // ★ コメントアウト

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
  const [userRole, setUserRole] = useState('user'); // デフォルトuser
  const navigate = useNavigate();

  // ▼ トークン読み込み後、ユーザー情報を取得しroleを判定
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || '';
    setToken(storedToken);

    if (storedToken) {
      // トークンがある場合、/api/userinfo で roleを取得
      fetch('/api/userinfo', {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error(data.error);
            // トークンエラーなど → ログアウト処理
            handleLogout();
          } else {
            // roleを取得
            if (data.role === 'admin') {
              setUserRole('admin');
            } else {
              setUserRole('user');
            }
          }
        })
        .catch(err => {
          console.error(err);
          // 失敗時はroleをuserに戻す
          setUserRole('user');
        });
    } else {
      // トークンが無い場合
      setUserRole('user');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUserRole('user');
    navigate('/');
  };

  return (
    <ThemeProvider theme={theme}>

      {/* 
        ★ コメントアウト: MUIのAppBar/Toolbar部分
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Board Game Cafe
            </Typography>

            {token ? (
              <>
                {userRole === 'admin' && (
                  <Button color="inherit" onClick={() => navigate('/admin')}>
                    Admin
                  </Button>
                )}
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
      */}

      {/* ★ 代わりに「Header」コンポーネントを表示 */}
      <Header userRole={userRole} />

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

        {/*
          任意: Admin専用ページ(まだ作ってないならコメントアウト)
          import AdminPage from './pages/AdminPage';
          <Route path="/admin" element={<AdminPage />} />
        */}
      </Routes>

      {/* ★ 新たに「Footer」コンポーネントを表示 */}
      <Footer />

    </ThemeProvider>
  );
}

export default App;