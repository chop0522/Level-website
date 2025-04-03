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

// ▼ ここで画像をimport (※ brickWall.png は例)
import brickWall from './src/assets/images/u7198941657_retro-style_seamless_brick_wall_texture_pixel_art_223a2fdf-34d5-4aa9-a443-1a5bf49149d2_2.png';

// ▼ 店内色合い + レトロフォントを反映したテーマ
const theme = createTheme({
  typography: {
    // ここにレトロフォントのファミリー名を指定
    // フォールバックとして sans-serif 等
    fontFamily: '"RetroFont", "Helvetica", "Arial", sans-serif'
  },
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
      // トークンが無い場合
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

  // ▼ インラインスタイルで背景画像を設定
  //    ここでimportしたbrickWallを使う
  const appStyle = {
    minHeight: '100vh',
    backgroundImage: `url(${brickWall})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  return (
    <ThemeProvider theme={theme}>
      {/* 
        以前使っていた MUIのAppBarはコメントアウトのまま 
        ヘッダーとフッターを独立したコンポーネントで表示 
      */}
      {/* ▼ 背景画像を最上位のdivに適用 */}
      <div style={appStyle}>

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

          {/* もし管理者専用ページを作る場合
              import AdminPage from './pages/AdminPage';
              <Route path="/admin" element={<AdminPage />} />
          */}
        </Routes>

        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;