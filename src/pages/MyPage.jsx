// src/pages/MyPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react'
import { Container, Typography, Button } from '@mui/material'
import { Avatar, Stack, Box, Card, Snackbar, Alert } from '@mui/material'
import { Grid } from '@mui/material'
import { Tooltip as MuiTooltip } from '@mui/material'
import Chip from '@mui/material/Chip'
import { getRankFromPoint } from '../utils/mahjongRank'
import XPCard from '../components/xp/XPCard'
import ProfileEditDialog from '../components/profile/ProfileEditDialog'
import AccountSettingsDialog from '../components/account/AccountSettingsDialog'
import {
  getProfile,
  getUserInfo,
  gainXP,
  getRecentHighfives,
  getPublicProfile,
  getUnreadHighfives,
} from '../services/api'
import { useNavigate } from 'react-router-dom'
import { Link as RouterLink } from 'react-router-dom'

import { AuthContext } from '../contexts/TokenContext'
import MyPageNav from '../components/MyPageNav'
import { Helmet } from 'react-helmet-async'
import { XP_CATEGORIES, getRankByXP, getBadgeAsset } from '../utils/rankConfig'
import { getBreakoutStatus } from '../services/api'

// 開発判定（Vite でも Node でも安全に動く）
const isDev =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
  process.env.NODE_ENV === 'development'

// Radar chart related imports
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

// Register radar components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// yyyy-mm-dd → 'M/D' 形式へ変換
function formatDate(isoStr) {
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const formatAverageScore = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  return Math.round(num).toLocaleString('ja-JP')
}

const formatAverageRank = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0.00'
  return num.toFixed(2)
}

function MyPage() {
  // コンテキストからダイレクトに取得（名前変更後に即再レンダ）
  const { token, userInfo, setUserInfo } = useContext(AuthContext)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [rankUpAnim, setRankUpAnim] = useState({})
  const [recentHF, setRecentHF] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [breakout, setBreakout] = useState(null)

  // アバターのキャッシュバスター
  const [avatarVer, setAvatarVer] = useState(Date.now())
  // 累積ポイントで段位を計算
  const rankInfo = getRankFromPoint(userInfo?.total_pt || 0)
  const hasMahjongGames = (userInfo?.game_count ?? 0) > 0
  const averageScoreLabel = hasMahjongGames ? formatAverageScore(userInfo?.average_score) : '-'
  const averageRankLabel = hasMahjongGames ? formatAverageRank(userInfo?.average_rank) : '-'

  const fetchUserInfo = useCallback(async () => {
    try {
      const data = await getUserInfo(token)
      if (data.error || !data.id) {
        // トークン失効 → ログイン画面へリダイレクト
        localStorage.removeItem('token')
        navigate('/login', { replace: true })
      } else {
        setUserInfo(data)

        // fetch recent highfives (limited to 10)
        const hf = await getRecentHighfives(token, 10)
        if (hf.success) {
          // fetch partner profiles to get name & avatar (Promise.all)
          const enriched = await Promise.all(
            hf.recent.map(async (r) => {
              const p = await getPublicProfile(r.partner_id, token)
              return {
                id: r.partner_id,
                name: (p.profile && p.profile.name) || `User${r.partner_id}`,
                avatar: p.profile?.avatar_url || '',
                last: r.last_date,
              }
            })
          )
          setRecentHF(enriched)
        }

        // 未読ハイタッチ通知
        const unread = await getUnreadHighfives(token, 5)
        if (unread.success && unread.unread.length > 0) {
          const senderId = unread.unread[0].from_id
          const senderProf = await getPublicProfile(senderId, token)
          const senderName = (senderProf.profile && senderProf.profile.name) || `User${senderId}`
          setToast(`👏 ${senderName} さんからハイタッチ！`)
        }
      }
    } catch (err) {
      console.error(err)
      setError('ユーザー情報の取得に失敗しました')
    }
  }, [navigate, setUserInfo, token])

  const fetchProfile = useCallback(async () => {
    try {
      const p = await getProfile(token)
      if (!p.error) {
        setProfile(p)
        // 画像を最新にするためキャッシュバスターを更新
        setAvatarVer(Date.now())
      }
    } catch (err) {
      console.error(err)
    }
  }, [token])

  const fetchBreakoutStatus = useCallback(async () => {
    const s = await getBreakoutStatus()
    setBreakout(s)
  }, [])

  useEffect(() => {
    // 未ログインならログインページへ
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    // ログイン済みならユーザー情報を取得
    fetchUserInfo()
    fetchProfile()
    fetchBreakoutStatus()
  }, [fetchBreakoutStatus, fetchProfile, fetchUserInfo, navigate, token])

  // XP加算 & ランクアップ処理
  const handleGainXP = async (catKey) => {
    const res = await gainXP(token, catKey)
    if (!res.success) {
      console.error(res.error)
      setToast('XP加算に失敗しました')
      return
    }

    // 更新 XP
    setUserInfo((prev) => ({
      ...prev,
      [`xp_${catKey}`]: res.currentXP,
    }))

    // ランクアップ演出
    if (res.rankUp) {
      setRankUpAnim((prev) => ({ ...prev, [catKey]: true }))
      setTimeout(() => {
        setRankUpAnim((prev) => ({ ...prev, [catKey]: false }))
      }, 1200)
      const ja = XP_CATEGORIES.find((c) => c.key === catKey)?.label || catKey
      setToast(`${ja} が ${res.label} にランクアップ！`)
    } else {
      setToast(`+${res.xpGain} XP`)
    }
  }

  // レーダーチャート用データ生成
  const createRadarData = () => {
    if (!userInfo) return null

    // userInfo内のxp_heavy等を展開
    const {
      xp_heavy = 0,
      xp_light = 0,
      xp_quiz = 0,
      xp_party = 0,
      xp_stealth = 0,
      xp_gamble = 0,
    } = userInfo

    return {
      labels: [
        '重量級', // xp_heavy
        '軽量級', // xp_light
        'クイズ', // xp_quiz
        'パーティ', // xp_party
        '正体隠匿', // xp_stealth
        'ギャンブル', // xp_gamble
      ],
      datasets: [
        {
          label: 'カテゴリ別XP',
          data: [xp_heavy, xp_light, xp_quiz, xp_party, xp_stealth, xp_gamble],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
      ],
    }
  }

  // レーダーチャートオプション
  const radarOptions = {
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Helmet>
        <title>マイページ</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="プロフィール編集やアバター変更、カテゴリ別XPと麻雀の成績を確認できる会員向けマイページです。"
        />
      </Helmet>
      <Typography variant="h5" component="h1" gutterBottom>
        My Page
      </Typography>
      <MyPageNav />

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* ユーザー情報がまだ取得できていない場合 */}
      {!userInfo && <Typography>Loading...</Typography>}

      {/* ユーザー情報が取得済みの場合 */}
      {userInfo && (
        <>
          <Typography>ようこそ, {userInfo.name}さん</Typography>
          <Typography>登録メール: {userInfo.email}</Typography>

          {/* 管理者の場合のみメッセージ等を表示 (role==='admin') */}
          {userInfo.role === 'admin' && (
            <Typography sx={{ mt: 2, color: 'red' }}>※管理者モードで閲覧中</Typography>
          )}

          {/* ブロック崩し ミニゲームカード */}
          <Card sx={{ p: 2, mt: 3, maxWidth: 520 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              ブロック崩し（ベータ）
            </Typography>
            {breakout ? (
              <>
                <Stack direction="row" spacing={2}>
                  <Chip label={`残り ${breakout.playsRemaining ?? 0} 回`} color="primary" />
                  <Chip label={`1日上限 ${breakout.playsPerDay ?? 1}`} />
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  リセット: {breakout.resetAt || '-'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  ベスト: スコア {breakout.best?.bestScore ?? 0} / 到達{' '}
                  {breakout.best?.bestStageReached ?? 1} / クリア{' '}
                  {breakout.best?.bestStageCleared ?? 0}
                </Typography>
              </>
            ) : (
              <Typography variant="body2">ステータス取得中…</Typography>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" component={RouterLink} to="/mypage/breakout">
                プレイ
              </Button>
              <Button variant="outlined" component={RouterLink} to="/mypage/breakout/leaderboard">
                ランキング
              </Button>
              <Button variant="outlined" component={RouterLink} to="/mypage/breakout/history">
                戦績
              </Button>
            </Stack>
          </Card>

          {/* プロフィールカード */}
          {profile && (
            <Card sx={{ p: 2, mt: 3, maxWidth: 480 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    boxShadow: '0 0 0 3px',
                    borderColor: rankInfo.color,
                    p: 0.5,
                  }}
                >
                  <Avatar
                    src={`/api/users/${userInfo.id}/avatar?${avatarVer}`}
                    sx={{ width: 80, height: 80 }}
                  />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    {userInfo.name}
                    <Chip
                      label={rankInfo.label}
                      size="small"
                      sx={{ bgcolor: rankInfo.color, color: '#fff', ml: 1 }}
                    />
                  </Typography>

                  {/* ポイント表示: Chip を2つ並べて目立たせる */}
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={`通算 ${userInfo.total_pt}`} size="small" color="primary" />
                    <Chip label={`今月 ${userInfo.monthly_pt}`} size="small" color="success" />
                  </Stack>

                  {/* 追加: 麻雀 最高得点 & 順位回数（レスポンシブ表示） */}
                  {/* sm以上（従来の横並び） */}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1, flexWrap: 'wrap', display: { xs: 'none', sm: 'flex' } }}
                    data-testid="mahjong-stats-desktop"
                  >
                    <MuiTooltip title="これまでの最終持ち点の最高値">
                      <Chip
                        label={`最高得点 ${userInfo?.highest_score ?? 0}`}
                        size="small"
                        color="secondary"
                      />
                    </MuiTooltip>
                    <MuiTooltip title="これまでの最終持ち点の平均値">
                      <Chip label={`平均得点 ${averageScoreLabel}`} size="small" color="info" />
                    </MuiTooltip>
                    <MuiTooltip title="これまでの平均順位 (低いほど良い)">
                      <Chip
                        label={`平均順位 ${averageRankLabel}`}
                        size="small"
                        variant="outlined"
                      />
                    </MuiTooltip>
                    <Chip
                      label={`1位 ${userInfo?.rank1_count ?? 0}回`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`2位 ${userInfo?.rank2_count ?? 0}回`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`3位 ${userInfo?.rank3_count ?? 0}回`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`4位 ${userInfo?.rank4_count ?? 0}回`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  {/* xs（スマホ）：左に最高得点、右の余白に順位を縦並びで配置 */}
                  <Box
                    sx={{
                      mt: 1,
                      display: { xs: 'grid', sm: 'none' },
                      gridTemplateColumns: '1fr auto',
                      columnGap: 1,
                      alignItems: 'start',
                    }}
                    data-testid="mahjong-stats-mobile"
                  >
                    <Box>
                      <Stack spacing={0.5}>
                        <MuiTooltip title="これまでの最終持ち点の最高値">
                          <Chip
                            label={`最高得点 ${userInfo?.highest_score ?? 0}`}
                            size="small"
                            color="secondary"
                          />
                        </MuiTooltip>
                        <MuiTooltip title="これまでの最終持ち点の平均値">
                          <Chip label={`平均得点 ${averageScoreLabel}`} size="small" color="info" />
                        </MuiTooltip>
                        <MuiTooltip title="これまでの平均順位 (低いほど良い)">
                          <Chip
                            label={`平均順位 ${averageRankLabel}`}
                            size="small"
                            variant="outlined"
                          />
                        </MuiTooltip>
                      </Stack>
                    </Box>
                    <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                      <Chip
                        label={`1位 ${userInfo?.rank1_count ?? 0}回`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`2位 ${userInfo?.rank2_count ?? 0}回`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`3位 ${userInfo?.rank3_count ?? 0}回`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`4位 ${userInfo?.rank4_count ?? 0}回`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>

                  {profile.bio && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {profile.bio}
                    </Typography>
                  )}
                </Box>
                <Button size="small" onClick={() => setEditOpen(true)}>
                  編集
                </Button>
              </Stack>
            </Card>
          )}

          <Button variant="contained" sx={{ mt: 2 }} onClick={() => setSettingsOpen(true)}>
            アカウント設定
          </Button>

          {/* 麻雀ランキングを見るボタン */}
          <Button variant="outlined" component={RouterLink} to="/mahjong" sx={{ mt: 2, ml: 2 }}>
            麻雀ランキングを見る
          </Button>

          {/* 通算ランキングを見るボタン */}
          <Button
            variant="outlined"
            component={RouterLink}
            to="/mahjong/lifetime"
            sx={{ mt: 2, ml: 1 }}
          >
            通算ランキングを見る
          </Button>

          {/* 最近ハイタッチした人 */}
          {recentHF.length > 0 && (
            <Card sx={{ p: 2, mt: 4, maxWidth: 480 }}>
              <Typography variant="h6" gutterBottom>
                最近ハイタッチした人
              </Typography>
              <Stack spacing={1}>
                {recentHF.map((p) => (
                  <Stack
                    key={p.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    component={RouterLink}
                    to={`/profile/${p.id}`}
                    sx={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={p.avatar} sx={{ width: 32, height: 32 }} />
                      <Typography variant="body2">{p.name}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(p.last)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          )}

          {/* カテゴリ別 XP カード */}
          <Grid container spacing={2} sx={{ mt: 4 }}>
            {XP_CATEGORIES.map((cat) => {
              const xp = userInfo[`xp_${cat.key}`] ?? 0
              const { current, next } = getRankByXP(xp)
              const badgeUrl = getBadgeAsset(cat.key, current.key)

              return (
                <Grid item xs={12} sm={6} key={cat.key}>
                  <XPCard
                    category={cat.label}
                    currentXP={xp}
                    rankLabel={current.label}
                    badgeUrl={badgeUrl}
                    nextXP={next ? next.minXp : null}
                    color={cat.color}
                    animate={rankUpAnim[cat.key]}
                  />
                  {/* 開発用: XP 加算ボタン (admin かつ開発モードのみ表示) */}
                  {isDev && userInfo.role === 'admin' && (
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                      onClick={() => handleGainXP(cat.key)}
                    >
                      +10 XP
                    </Button>
                  )}
                </Grid>
              )
            })}
          </Grid>

          {/* レーダーチャート: カテゴリ別XP */}
          <div style={{ marginTop: '30px', maxWidth: '600px' }}>
            <Typography variant="h6" gutterBottom>
              カテゴリ別XPレーダーチャート
            </Typography>
            {/* レーダーデータ生成後に存在するかチェック */}
            {createRadarData() && <Radar data={createRadarData()} options={radarOptions} />}
          </div>
        </>
      )}

      {/* プロフィール編集ダイアログ */}
      {profile && (
        <ProfileEditDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSaved={(p) => {
            setProfile((prev) => ({ ...prev, ...p }))
            // アップロード成功後にキャッシュバスターを更新
            setAvatarVer(Date.now())
            setToast('プロフィールを更新しました')
          }}
        />
      )}

      {/* アカウント設定ダイアログ */}
      <AccountSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={() => {
          localStorage.removeItem('token')
          navigate('/login', { replace: true })
        }}
        onProfileUpdated={fetchUserInfo}
      />

      {/* 更新トースト */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast('')}>
          {toast}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default MyPage
