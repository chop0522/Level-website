// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Header from './components/Header';
import Footer from './components/Footer';

import { createTheme, ThemeProvider, responsiveFontSizes } from '@mui/material/styles';

// ★ Menuページをimport
import Menu from './pages/Menu';
// FAQページ
import FAQ from './pages/FAQ';
// Calendarページ(設備紹介)
import Calendar from './pages/Calendar';
// ★ Reservationページをimport
import Reservation from './pages/Reservation';
// ★ AdminDashboard (管理用)
import AdminDashboard from './pages/AdminDashboard';

// ▼ 背景画像をimport (パスは例です。実際のファイル構成に合わせてください)
// import brickWall from './assets/images/brick_wall.jpg';

// ▼ 高度なテーマ拡張例
//  - カスタムbreakpoints
//  - 画面幅ごとのTypography
//  - shape, spacing, shadows なども調整可
let theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536
    }
  },
  typography: {
    fontFamily: '"RetroFont", "Helvetica", "Arial", sans-serif',
    // h1, h2, h3...を詳細に設定
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      // スマホ向けにさらに小さくする例
      '@media (max-width:600px)': {
        fontSize: '2.2rem'
      }
    },
    h2: {
      fontSize: '2.4rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '2rem'
      }
    },
    h3: {
      fontSize: '2rem',
      '@media (max-width:600px)': {
        fontSize: '1.6rem'
      }
    },
    h6: {
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.9rem'
      }
    }
    // ほかにもbody1, body2など設定可能
  },
  palette: {
    primary: {
      main: '#3e2723',   // 茶色っぽい
      light: '#6a4f4b',  // 参考: 調整用
      dark: '#1b0000'
    },
    secondary: {
      main: '#0d47a1',
      light: '#5472d3',
      dark: '#002171'
    },
    error: { main: '#b71c1c' },
    background: { default: '#ececec' }, // ←グレー系に変更
    text: { primary: '#000000' }
  },
  shape: {
    // 角丸などを一括で調整
    borderRadius: 6
  },
  spacing: 8, // spacing(1)=8px, spacing(2)=16pxなど
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.2)', // 例: Elevation 1
    '0px 1px 5px rgba(0,0,0,0.2)', // 例: Elevation 2
    // 省略: 必要に応じて
  ],
  components: {
    // MUIコンポーネントのstyle override例
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: '#fff',
          // 背景色はpalette.primary.mainが優先される
          // 必要に応じて上書き可能
        }
      }
    }
  }
});

// ▼ フォントサイズをbreakpointsに合わせて自動調整する (可選)
theme = responsiveFontSizes(theme);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState('user');
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || '';
    setToken(storedToken);

    if (storedToken) {
      fetch('/api/userinfo', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error(data.error);
            handleLogout();
          } else {
            // ユーザーroleが 'admin' なら管理者扱い
            setUserRole(data.role === 'admin' ? 'admin' : 'user');
          }
        })
        .catch(err => {
          console.error(err);
          setUserRole('user');
        });
    } else {
      setUserRole('user');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUserRole('user');
    navigate('/');
  };

  // 背景スタイル: 画像をurl()で参照
  const appStyle = {
    minHeight: '100vh',
    backgroundColor: '#ececec', // ←グレー系に変更
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={appStyle}>
        <Header
          token={token}
          userRole={userRole}
          handleLogout={handleLogout}
        />

        <Routes>
          {/* メインページ */}
          <Route path="/" element={<Home />} />

          {/* 登録 & ログイン */}
          <Route
            path="/register"
            element={<Register token={token} setToken={setToken} />}
          />
          <Route
            path="/login"
            element={<Login token={token} setToken={setToken} />}
          />

          {/* マイページ */}
          <Route
            path="/mypage"
            element={<MyPage token={token} />}
          />

          {/* メニュー */}
          <Route path="/menu" element={<Menu />} />

          {/* FAQ */}
          <Route path="/faq" element={<FAQ />} />

          {/* 設備紹介 */}
          <Route path="/calendar" element={<Calendar />} />

          {/* 予約フォーム */}
          <Route
            path="/reservation"
            element={<Reservation />}
          />

          {/* 管理者ダッシュボード */}
          <Route
            path="/admin"
            element={
              userRole === 'admin'
                ? <AdminDashboard />
                : <Navigate to="/" replace />
            }
          />
        </Routes>

        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;