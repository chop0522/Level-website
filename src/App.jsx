// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthContext } from './contexts/TokenContext';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Loader from './components/Loader';
import Footer from './components/Footer';

import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes
} from '@mui/material/styles';

import { Helmet, HelmetProvider } from 'react-helmet-async';

/* =========================================
   1) lazy‑import するページ群
   ========================================= */
const Home            = lazy(() => import('./pages/Home'));
const Signup          = lazy(() => import('./pages/Signup'));
const Login           = lazy(() => import('./pages/Login'));
const MyPage          = lazy(() => import('./pages/MyPage'));
const Menu            = lazy(() => import('./pages/Menu'));
const FAQ             = lazy(() => import('./pages/FAQ'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const PublicProfile   = lazy(() => import('./pages/PublicProfile'));
const Equipment       = lazy(() => import('./pages/Equipment'));
const Reservation     = lazy(() => import('./pages/Reservation'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const AdminXP         = lazy(() => import('./pages/AdminXP'));
const QRPage          = lazy(() => import('./pages/QRPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const NotFound        = lazy(() => import('./pages/NotFound'));    // “最後の砦”

const MahjongPage     = lazy(() => import('./pages/MahjongPage'));
const LifetimeRankingPage = lazy(() => import('./pages/LifetimeRankingPage'));

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


/* =========================================
   3) App コンポーネント
   ========================================= */
function App() {
  const [token,    setToken]    = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(null);   // null = 取得前
  const [userInfo, setUserInfo] = useState(null);
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
        else {
          // フラット形式 {role:'admin'} でも ネスト形式 {user:{role:'admin'}} でも拾う
          const role = d.role || d.user?.role || 'user';
          setUserRole(role === 'admin' ? 'admin' : 'user');
          setUserInfo(d.user || d);            // ← 追加
        }
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

  // Loader for pending auth
  const Pending = () => <div style={{textAlign:'center',marginTop:'2rem'}}>Loading...</div>;

  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={{ token, setToken, userRole, userInfo, setUserInfo, handleLogout }}>
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
            <Header />

            {/* ---------- ルーティング ---------- */}
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* Public */}
                <Route path="/"           element={<Home />} />
                <Route path="/menu"       element={<Menu />} />
                <Route path="/faq"        element={<FAQ />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/equipment"  element={<Equipment />} />
                <Route path="/reservation"element={<Reservation />} />
                <Route path="/qr"         element={<QRPage />} />

                {/* Auth */}
                <Route path="/signup"  element={<Signup setToken={setToken} />} />
                <Route path="/login"    element={<Login    setToken={setToken} />} />
                <Route path="/mypage"   element={<MyPage />} />
                <Route
                  path="/achievements"
                  element={ token
                    ? <AchievementsPage />
                    : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/mahjong"
                  element={
                    token
                      ? <MahjongPage />
                      : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/mahjong/lifetime"
                  element={
                    token
                      ? <LifetimeRankingPage />
                      : <Navigate to="/login" replace />
                  }
                />

                {/* Admin */}
                <Route path="/admin"
                  element={
                    userRole === null
                      ? <Pending />
                      : userRole === 'admin'
                          ? <AdminDashboard />
                          : <Navigate to="/" replace />
                  }
                />
                <Route path="/admin/xp"
                  element={
                    userRole === null
                      ? <Pending />
                      : userRole === 'admin'
                          ? <AdminXP />
                          : <Navigate to="/" replace />
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>

            <Footer />
          </div>
        </AuthContext.Provider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;