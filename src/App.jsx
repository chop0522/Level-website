// src/App.jsx
import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { AuthContext } from './contexts/TokenContext'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Loader from './components/Loader'
import Footer from './components/Footer'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import './styles/skipLink.css'
import theme from './theme'

/* =========================================
   1) lazy‑import するページ群
   ========================================= */
const Home = lazy(() => import('./pages/Home'))
const Signup = lazy(() => import('./pages/Signup'))
const Login = lazy(() => import('./pages/Login'))
const MyPage = lazy(() => import('./pages/MyPage'))
const Menu = lazy(() => import('./pages/Menu'))
const FAQ = lazy(() => import('./pages/FAQ'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const Equipment = lazy(() => import('./pages/Equipment'))
const Reservation = lazy(() => import('./pages/Reservation'))
const QRPage = lazy(() => import('./pages/QRPage'))
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'))
const NotFound = lazy(() => import('./pages/NotFound')) // “最後の砦”

const MahjongPage = lazy(() => import('./pages/MahjongPage'))
const LifetimeRankingPage = lazy(() => import('./pages/LifetimeRankingPage'))

/* =========================================
   3) App コンポーネント
   ========================================= */
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [userRole, setUserRole] = useState(null) // null = 取得前
  const [userInfo, setUserInfo] = useState(null)
  const navigate = useNavigate()

  /* ---- ログアウト ---- */
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    setToken('')
    setUserRole('user')
    navigate('/')
  }, [navigate])

  /* ---- ユーザー情報取得 ---- */
  useEffect(() => {
    const stored = localStorage.getItem('token') || ''
    setToken(stored)

    if (!stored) {
      setUserRole('user')
      return
    }

    fetch('/api/userinfo', { headers: { Authorization: `Bearer ${stored}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          handleLogout()
        } else {
          // フラット形式 {role:'admin'} でも ネスト形式 {user:{role:'admin'}} でも拾う
          const role = d.role || d.user?.role || 'user'
          setUserRole(role === 'admin' ? 'admin' : 'user')
          setUserInfo(d.user || d) // ← 追加
        }
      })
      .catch(() => setUserRole('user'))
  }, [handleLogout])

  /* ---- 背景スタイル ---- */
  const appStyle = { minHeight: '100vh', backgroundColor: theme.palette.background.default }

  return (
    <HelmetProvider>
      <AuthContext.Provider
        value={{ token, setToken, userRole, userInfo, setUserInfo, handleLogout }}
      >
        {/* ---------- 共通メタ ---------- */}
        <Helmet
          defaultTitle="ゲームカフェ.Level｜行徳のボードゲーム＆麻雀カフェ"
          titleTemplate="%s｜ゲームカフェ.Level"
        >
          <html lang="ja" />
          <meta
            name="description"
            content="千葉県市川市・行徳駅徒歩5分、ボードゲーム＆麻雀カフェ『ゲームカフェ.Level』公式サイト。営業時間・料金・設備、月間麻雀ランキングを掲載。公式LINEで予約受付中。"
          />
          <meta name="format-detection" content="telephone=no" />

          {/* OGP / Twitter Card (site-wide defaults) */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="ゲームカフェ.Level" />
          <meta property="og:title" content="ゲームカフェ.Level" />
          <meta
            property="og:description"
            content="行徳駅徒歩5分、1000種類以上のボードゲーム＆麻雀。料金・設備・アクセス、最新の麻雀ランキングを掲載。"
          />
          <meta property="og:url" content="https://gamecafe-level.com/" />
          <meta property="og:image" content="https://gamecafe-level.com/ogp/home.jpg" />
          <meta property="og:locale" content="ja_JP" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="ゲームカフェ.Level" />
          <meta
            name="twitter:description"
            content="行徳駅徒歩5分、1000種類以上のボードゲーム＆麻雀カフェ。最新情報とランキングはこちら。"
          />
          <meta name="twitter:image" content="https://gamecafe-level.com/ogp/home.jpg" />

          {/* hreflang（日本語のみ） */}
          <link rel="alternate" hrefLang="ja" href="https://gamecafe-level.com/" />
          <link rel="alternate" hrefLang="x-default" href="https://gamecafe-level.com/" />

          {/* WebSite 構造化データ（サイト全体） */}
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'ゲームカフェ.Level',
              url: 'https://gamecafe-level.com/',
              inLanguage: 'ja',
              sameAs: ['https://lin.ee/CWJf4Ui'],
            })}
          </script>
        </Helmet>

        <div style={appStyle}>
          <a href="#main-content" className="skip-link">
            メインコンテンツへスキップ
          </a>
          <Header />

          <main id="main-content">
            {/* ---------- ルーティング ---------- */}
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/reservation" element={<Reservation />} />
                <Route path="/qr" element={<QRPage />} />

                {/* Auth */}
                <Route path="/signup" element={<Signup setToken={setToken} />} />
                <Route path="/login" element={<Login setToken={setToken} />} />
                <Route
                  path="/mypage"
                  element={token ? <MyPage /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/achievements"
                  element={token ? <AchievementsPage /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/mahjong"
                  element={token ? <MahjongPage /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/mahjong/lifetime"
                  element={token ? <LifetimeRankingPage /> : <Navigate to="/login" replace />}
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </AuthContext.Provider>
    </HelmetProvider>
  )
}

export default App
