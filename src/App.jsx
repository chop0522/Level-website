// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes
} from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';

import { Helmet, HelmetProvider } from 'react-helmet-async';

/* =========================================
   1) lazy‑import するページ群
   ========================================= */
const Home            = lazy(() => import('./pages/Home'));
const Register        = lazy(() => import('./pages/Register'));
const Login           = lazy(() => import('./pages/Login'));
const MyPage          = lazy(() => import('./pages/MyPage'));
const Menu            = lazy(() => import('./pages/Menu'));
const FAQ             = lazy(() => import('./pages/FAQ'));
const Calendar        = lazy(() => import('./pages/Calendar'));
const Reservation     = lazy(() => import('./pages/Reservation'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const NotFound        = lazy(() => import('./pages/NotFound'));    // “最後の砦”

/* =========================================
   2) 高度な MUI テーマ
   ========================================= */
let theme = createTheme({
  breakpoints: { values: { xs:0, sm:600, md:900, lg:1200, xl:1536 } },
  typography: {
    fontFamily: '"RetroFont","Helvetica","Arial",sans-serif',
    h1:{ fontSize:'3rem', fontWeight:700, '@media (max-width:600px)':{ fontSize:'2.2rem' }},
    h2:{ fontSize:'2.4rem', fontWeight:600, '@media (max-width:600px)':{ fontSize:'2rem' }},
    h3:{ fontSize:'2rem', '@media (max-width:600px)':{ fontSize:'1.6rem' }},
    h6:{ fontSize:'1rem', '@media (max-width:600px)':{ fontSize:'0.9rem' }}
  },
  palette:{
    primary:   { main:'#00b7ff', light:'#40c7ff', dark:'#0081b2' },
    secondary: { main:'#3e2723', light:'#6a4f4b', dark:'#1b0000' },
    error:     { main:'#b71c1c' },
    background:{ default:'#ececec' },
    text:      { primary:'#000' }
  },
  shape:{ borderRadius:6 },
  spacing:8,
  components:{
    MuiButton:{ styleOverrides:{ containedPrimary:{ color:'#fff' } } }
  }
});
theme = responsiveFontSizes(theme);

/* --- Suspense フォールバック用ローダー --- */
const CenterLoader = () => (
  <Box sx={{display:'flex',justifyContent:'center',alignItems:'center',py:10}}>
    <CircularProgress />
  </Box>
);

/* =========================================
   3) App コンポーネント
   ========================================= */
function App() {
  const [token,    setToken]    = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState('user');
  const navigate = useNavigate();

  /* ---- ユーザー情報取得 ---- */
  useEffect(() => {
    const stored = localStorage.getItem('token') || '';
    setToken(stored);

    if (!stored) { setUserRole('user'); return; }

    fetch('/api/userinfo', { headers:{ Authorization:`Bearer ${stored}` } })
      .then(r => r.json())
      .then(d => {
        if (d.error) { handleLogout(); }
        else { setUserRole(d.role === 'admin' ? 'admin' : 'user'); }
      })
      .catch(() => setUserRole('user'));
  }, []);

  /* ---- ログアウト ---- */
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUserRole('user');
    navigate('/');
  };

  /* ---- 背景スタイル ---- */
  const appStyle = { minHeight:'100vh', backgroundColor:theme.palette.background.default };

  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        {/* ---------- 共通メタ ---------- */}
        <Helmet>
          <title>ゲームカフェ.Level | 行徳のボードゲームカフェ</title>
          <meta name="description"
                content="千葉県行徳駅徒歩5分、1000種類以上のボードゲームが遊べる『ゲームカフェ.Level』公式サイト。営業時間・設備・料金はこちら。" />
          <meta property="og:type"        content="website" />
          <meta property="og:title"       content="ゲームカフェ.Level" />
          <meta property="og:description" content="行徳駅徒歩5分、1000種類以上のボードゲーム！ ボドゲ・麻雀・ポーカーまで遊べるカフェ" />
        </Helmet>

        <div style={appStyle}>
          <Header token={token} userRole={userRole} handleLogout={handleLogout} />

          {/* ---------- ルーティング ---------- */}
          <Suspense fallback={<CenterLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/"           element={<Home />} />
              <Route path="/menu"       element={<Menu />} />
              <Route path="/faq"        element={<FAQ />} />
              <Route path="/calendar"   element={<Calendar />} />
              <Route path="/reservation"element={<Reservation />} />

              {/* Auth */}
              <Route path="/register" element={<Register token={token} setToken={setToken} />} />
              <Route path="/login"    element={<Login    token={token} setToken={setToken} />} />
              <Route path="/mypage"   element={<MyPage   token={token} />} />

              {/* Admin */}
              <Route path="/admin"
                element={ userRole === 'admin'
                  ? <AdminDashboard />
                  : <Navigate to="/" replace />
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          <Footer />
        </div>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;