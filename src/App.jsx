// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Header from './components/Header';
import Footer from './components/Footer';

import { createTheme, ThemeProvider } from '@mui/material/styles';

// ★ Menuページをimport
import Menu from './pages/Menu';
// FAQページ
import FAQ from './pages/FAQ';
// Calendarページ(設備紹介に変更)
import Calendar from './pages/Calendar';
// ★ Reservationページをimport
import Reservation from './pages/Reservation';
// ★ AdminDashboard (管理用)
import AdminDashboard from './pages/AdminDashboard';

// import brickWall from '';

const theme = createTheme({
  typography: { fontFamily: '"RetroFont", "Helvetica", "Arial", sans-serif' },
  palette: {
    primary: { main: '#3e2723' },
    secondary: { main: '#0d47a1' },
    error: { main: '#b71c1c' },
    background: { default: '#ffffff' },
    text: { primary: '#000000' }
  }
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState('user');
  const navigate = useNavigate();

  useEffect(() => {
    // アプリ起動時 or token変化時にユーザー情報を取得
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
            // 管理者なら role='admin'
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

  // 背景スタイル
  const appStyle = {
    minHeight: '100vh',
    backgroundImage: `url(${brickWall})`,
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
          {/* --- メインページ --- */}
          <Route path="/" element={<Home />} />

          {/* --- Register & Login --- */}
          <Route
            path="/register"
            element={<Register token={token} setToken={setToken} />}
          />
          <Route
            path="/login"
            element={<Login token={token} setToken={setToken} />}
          />

          {/* --- マイページ --- */}
          <Route
            path="/mypage"
            element={<MyPage token={token} />}
          />

          {/* --- メニュー --- */}
          <Route path="/menu" element={<Menu />} />

          {/* --- FAQ --- */}
          <Route path="/faq" element={<FAQ />} />

          {/* --- 設備紹介 --- */}
          <Route path="/calendar" element={<Calendar />} />

          {/* --- 予約フォーム --- */}
          <Route
            path="/reservation"
            element={<Reservation />}
          />

          {/* --- 管理者ダッシュボード --- */}
          <Route
            path="/admin"
            element={
              // ユーザーがadminなら表示、それ以外ならリダイレクト
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