// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Header from './components/Header';  
import Footer from './components/Footer';  

import { createTheme, ThemeProvider } from '@mui/material/styles';
// import { AppBar, Toolbar, Button, Typography } from '@mui/material'; // コメントアウト

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
  const [userRole, setUserRole] = useState('user'); // デフォルト=一般ユーザー
  const navigate = useNavigate();

  // ▼ トークンを読み込み、ユーザー情報を取得してroleを判定
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
            // 無効トークン等 → ログアウト処理
            handleLogout();
          } else {
            // roleを更新
            if (data.role === 'admin') {
              setUserRole('admin');
            } else {
              setUserRole('user');
            }
          }
        })
        .catch(err => {
          console.error(err);
          // エラー時は一般ユーザー扱い
          setUserRole('user');
        });
    } else {
      // トークンが無い場合、ユーザーを「user」扱いに
      setUserRole('user');
    }
  }, []);

  const handleLogout = () => {
    // ログアウト時の処理
    localStorage.removeItem('token');
    setToken('');
    setUserRole('user');
    navigate('/');
  };

  return (
    <ThemeProvider theme={theme}>

      {/*
        以前使っていた MUIのAppBarはコメントアウトのまま
        ヘッダーとフッターを独立したコンポーネントで表示
      */}

      {/* ヘッダーを表示 (token, userRole, handleLogout を渡す) */}
      <Header 
        token={token}
        userRole={userRole}
        handleLogout={handleLogout}
      />

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
          もし管理者専用ページを作るなら:
          import AdminPage from './pages/AdminPage';
          <Route path="/admin" element={<AdminPage />} />
        */}
      </Routes>

      {/* フッターを表示 */}
      <Footer />

    </ThemeProvider>
  );
}

export default App;