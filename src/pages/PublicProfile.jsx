// src/pages/PublicProfile.jsx
import React, { useEffect, useState, useContext } from 'react'
import {
  Container,
  Card,
  Typography,
  Grid,
  Button,
  Stack,
  Chip,
  Tooltip as MuiTooltip,
  Snackbar,
  Alert,
  keyframes,
} from '@mui/material'
import UserAvatar from '../components/common/UserAvatar'
import { useParams } from 'react-router-dom'
import { AuthContext } from '../contexts/TokenContext'
import { getPublicProfile, getFriendship, highfive } from '../services/api'
import XPCard from '../components/xp/XPCard'
import MyPageNav from '../components/MyPageNav'
import { Helmet } from 'react-helmet-async'
import { XP_CATEGORIES, getRankByXP, getBadgeAsset } from '../utils/rankConfig'
import { getRankFromPoint } from '../utils/mahjongRank'

/**
 * 公開プロフィールページ（閲覧専用 + ハイタッチ）
 * URL: /profile/:id
 */
// Glow & shake animation when high‑fived
const highfiveKF = keyframes`
  0%   { transform: scale(1); }
  20%  { transform: scale(1.25) rotate(-6deg); }
  40%  { transform: scale(1.25) rotate(6deg);  }
  60%  { transform: scale(1.15); }
  80%  { transform: scale(1.05); }
  100% { transform: scale(1); }
`

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
export default function PublicProfile() {
  const { id } = useParams()
  const { token, userInfo } = useContext(AuthContext)

  const [profile, setProfile] = useState(null)
  const [friendship, setFriendship] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [anim, setAnim] = useState(false)

  // fetch profile
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const res = await getPublicProfile(id, token)
      if (res.success) setProfile(res.profile)

      // friendship power (optional)
      if (token) {
        const fr = await getFriendship(id, token)
        if (fr.success) setFriendship(fr.power)
      }
      setLoading(false)
    })()
  }, [id, token])

  const handleHighfive = async () => {
    setDisabled(true)
    const res = await highfive(id, token)
    if (res.success) {
      setAnim(true)
      setTimeout(() => setAnim(false), 700)
      setToast('👏 ハイタッチ！友情パワー +1')
      setFriendship((prev) => (prev ?? 0) + 1)
    } else {
      setToast(res.error || 'ハイタッチできませんでした')
    }
  }

  const pageTitle = profile?.name ? `${profile.name}さんのプロフィール` : 'プレイヤープロフィール'
  const pageDescription = profile?.bio
    ? `${profile.name || 'プレイヤー'}の自己紹介とXP実績、カテゴリ別バッジを掲載しています。ゲームカフェ.Levelの公開プロフィール。`
    : 'ゲームカフェ.Levelの公開プロフィールページ。XP実績とバッジを確認できます。'

  if (loading || !profile) {
    return (
      <Container sx={{ mt: 4 }}>
        <Helmet>
          <title>{pageTitle}</title>
          <link rel="canonical" href={`https://gamecafe-level.com/profile/${id}`} />
          <meta name="description" content={pageDescription} />
        </Helmet>
        Loading…
      </Container>
    )
  }

  const rankInfo = getRankFromPoint(profile?.total_pt || 0)
  const hasMahjongGames = (profile?.game_count ?? 0) > 0
  const averageScoreLabel = hasMahjongGames ? formatAverageScore(profile?.average_score) : '-'
  const averageRankLabel = hasMahjongGames ? formatAverageRank(profile?.average_rank) : '-'

  return (
    <Container sx={{ mt: 4 }}>
      <Helmet>
        <title>{pageTitle}</title>
        <link rel="canonical" href={`https://gamecafe-level.com/profile/${id}`} />
        <meta name="description" content={pageDescription} />
      </Helmet>
      <MyPageNav />
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <UserAvatar
          id={profile.id}
          size={96}
          ver={Date.now()}
          sx={{
            width: 96,
            height: 96,
            mx: 'auto',
            mb: 1,
            animation: anim ? `${highfiveKF} 0.7s ease-in-out` : 'none',
          }}
        />
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          <Typography variant="h5" component="h1">
            {profile.name || `User ${id}`}
          </Typography>
          <Chip
            label={rankInfo.label}
            size="small"
            sx={{ bgcolor: rankInfo.color, color: '#fff' }}
          />
        </Stack>
        {profile.bio && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {profile.bio}
          </Typography>
        )}

        {/* ハイタッチボタン */}
        {token && userInfo?.id !== Number(id) && (
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleHighfive} disabled={disabled}>
            👏 ハイタッチ
          </Button>
        )}

        {/* 友情パワー */}
        {friendship != null && (
          <Typography sx={{ mt: 1 }} color="secondary">
            友情パワー: {friendship}
          </Typography>
        )}
      </Card>

      <Card sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          麻雀成績
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Chip label={`通算 ${profile?.total_pt ?? 0}`} size="small" color="primary" />
          <Chip label={`今月 ${profile?.monthly_pt ?? 0}`} size="small" color="success" />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
          <MuiTooltip title="これまでの最終持ち点の最高値">
            <Chip
              label={`最高得点 ${profile?.highest_score ?? 0}`}
              size="small"
              color="secondary"
            />
          </MuiTooltip>
          <MuiTooltip title="これまでの最終持ち点の平均値">
            <Chip label={`平均得点 ${averageScoreLabel}`} size="small" color="info" />
          </MuiTooltip>
          <MuiTooltip title="これまでの平均順位 (低いほど良い)">
            <Chip label={`平均順位 ${averageRankLabel}`} size="small" variant="outlined" />
          </MuiTooltip>
          <Chip label={`1位 ${profile?.rank1_count ?? 0}回`} size="small" variant="outlined" />
          <Chip label={`2位 ${profile?.rank2_count ?? 0}回`} size="small" variant="outlined" />
          <Chip label={`3位 ${profile?.rank3_count ?? 0}回`} size="small" variant="outlined" />
          <Chip label={`4位 ${profile?.rank4_count ?? 0}回`} size="small" variant="outlined" />
        </Stack>
      </Card>

      {/* XP Cards */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {XP_CATEGORIES.map((c) => {
          const xp = profile[`xp_${c.key}`] ?? 0
          const { current } = getRankByXP(xp)
          const badgeUrl = getBadgeAsset(c.key, current.key)
          return (
            <Grid item xs={6} sm={4} md={2} key={c.key}>
              <XPCard
                category={c.label}
                currentXP={xp}
                rankLabel={current.label}
                badgeUrl={badgeUrl}
                color={c.color}
                nextXP={null}
              />
            </Grid>
          )
        })}
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setToast('')}>
          {toast}
        </Alert>
      </Snackbar>
    </Container>
  )
}
