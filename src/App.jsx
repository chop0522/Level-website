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

// ★ Menuページをimport
import Menu from './pages/Menu';
// FAQページ
import FAQ from './pages/FAQ';
// Calendarページ(設備紹介に変更した内容)
import Calendar from './pages/Calendar';
// ★ Reservationページをimport
import Reservation from './pages/Reservation';

import brickWall from './assets/images/u7198941657_retro-style_seamless_brick_wall_texture_pixel_art_223a2fdf-34d5-4aa9-a443-1a5bf49149d2_2.png';

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

          {/* ★ 新設ルート => Menuページ */}
          <Route path="/menu" element={<Menu />} />

          {/* FAQページ */}
          <Route path="/faq" element={<FAQ />} />

          {/* Calendarページ (設備紹介に変更済み) */}
          <Route path="/calendar" element={<Calendar />} />

          {/* ★ Reservationページを追加 */}
          <Route
            path="/reservation"
            element={<Reservation />}
          />
        </Routes>

        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;