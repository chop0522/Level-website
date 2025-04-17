// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Header from './components/Header';
import Footer from './components/Footer';

import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes
} from '@mui/material/styles';

// ▼ Helmet
import { Helmet, HelmetProvider } from 'react-helmet-async';

/* ---------- ルーティング用ページ ---------- */
import Menu           from './pages/Menu';
import FAQ            from './pages/FAQ';
import Calendar       from './pages/Calendar';      /* 設備紹介ページ */
import Reservation    from './pages/Reservation';
import AdminDashboard from './pages/AdminDashboard';

/* =================================================
   1) 高度なテーマ拡張
   ================================================= */
let theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }
  },
  typography: {
    fontFamily: '"RetroFont", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      '@media (max-width:600px)': { fontSize: '2.2rem' }
    },
    h2: {
      fontSize: '2.4rem',
      fontWeight: 600,
      '@media (max-width:600px)': { fontSize: '2rem' }
    },
    h3: {
      fontSize: '2rem',
      '@media (max-width:600px)': { fontSize: '1.6rem' }
    },
    h6: {
      fontSize: '1rem',
      '@media (max-width:600px)': { fontSize: '0.9rem' }
    }
  },
  palette: {
    primary:   { main: '#3e2723', light: '#6a4f4b', dark: '#1b0000' },
    secondary: { main: '#0d47a1', light: '#5472d3', dark: '#002171' },
    error:     { main: '#b71c1c' },
    background:{ default: '#ececec' },
    text:      { primary: '#000000' }
  },
  shape:   { borderRadius: 6 },
  spacing: 8,
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.2)',
    '0px 1px 5px rgba(0,0,0,0.2)',
    // 必要に応じて以降を追加
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: { color: '#fff' }
      }
    }
  }
});

// フォントサイズの自動レスポンシブ調整
theme = responsiveFontSizes(theme);

/* =================================================
   2) App コンポーネント
   ================================================= */
function App() {
  const [token,    setToken]    = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState('user');
  const navigate = useNavigate();

  /* -------- ユーザー情報取得 -------- */
  useEffect(() => {
    const stored = localStorage.getItem('token') || '';
    setToken(stored);

    if (!stored) { setUserRole('user'); return; }

    fetch('/api/userinfo', { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          console.error(data.error);
          handleLogout();
        } else {
          setUserRole(data.role === 'admin' ? 'admin' : 'user');
        }
      })
      .catch(err => {
        console.error(err);
        setUserRole('user');
      });
  }, []);

  /* -------- ログアウト -------- */
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUserRole('user');
    navigate('/');
  };

  /* -------- 背景スタイル -------- */
  const appStyle = {
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default
  };

  /* =================================================
       Render
  ================================================= */
  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        {/* --- グローバル meta (各ページで Helmet 上書き可) --- */}
        <Helmet>
          <title>ゲームカフェ.Level | 行徳のボードゲームカフェ</title>
          <meta
            name="description"
            content="千葉県行徳駅徒歩5分、1000種類以上のボードゲームが遊べる『ゲームカフェ.Level』公式サイト。営業時間・設備・料金はこちら。"
          />
          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="ゲームカフェ.Level" />
          <meta
            property="og:description"
            content="行徳駅徒歩5分、1000種類以上のボードゲーム！ ボドゲ・麻雀・ポーカーまで遊べるカフェ"
          />
          {/* og:image や twitter:card を追加してもOK */}
        </Helmet>

        <div style={appStyle}>
          {/* ヘッダー */}
          <Header token={token} userRole={userRole} handleLogout={handleLogout} />

          {/* ルーティング */}
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/register"   element={<Register token={token} setToken={setToken} />} />
            <Route path="/login"      element={<Login    token={token} setToken={setToken} />} />
            <Route path="/mypage"     element={<MyPage   token={token} />} />

            <Route path="/menu"       element={<Menu />} />
            <Route path="/faq"        element={<FAQ />} />
            <Route path="/calendar"   element={<Calendar />} />
            <Route path="/reservation"element={<Reservation />} />

            {/* 管理者専用 */}
            <Route
              path="/admin"
              element={
                userRole === 'admin'
                  ? <AdminDashboard />
                  : <Navigate to="/" replace />
              }
            />
          </Routes>

          {/* フッター */}
          <Footer />
        </div>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;