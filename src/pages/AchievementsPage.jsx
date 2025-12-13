// src/pages/AchievementsPage.jsx
import React, { useEffect, useState, useContext } from 'react'
import { Container, Typography, Grid, Card, Avatar } from '@mui/material'
import { AuthContext } from '../contexts/TokenContext'
import { getAchievements } from '../services/api'
import MyPageNav from '../components/MyPageNav'
import { Helmet } from 'react-helmet-async'
import { XP_CATEGORIES, getRankByXP, getBadgeAsset } from '../utils/rankConfig'

export default function AchievementsPage() {
  const { token } = useContext(AuthContext)
  const [data, setData] = useState(null)

  useEffect(() => {
    ;(async () => {
      const res = await getAchievements(token)
      if (res.success) setData(res)
    })()
  }, [token])

  if (!data) return <Container sx={{ mt: 4 }}>Loading…</Container>

  const { user, totalRank } = data

  return (
    <>
      <Helmet>
        <title>実績バッジ</title>
        <link rel="canonical" href="https://gamecafe-level.com/achievements" />
        <meta
          name="description"
          content="カテゴリ別のXP実績バッジと総合ランクを確認できます。ボードゲームや麻雀のプレイ状況を振り返るマイページ機能です。"
        />
      </Helmet>
      <Container sx={{ mt: 4 }}>
        <MyPageNav />
        <Typography variant="h4" component="h1" gutterBottom>
          Achievements
        </Typography>

        {/* 総合ランクカード */}
        <Card sx={{ p: 3, my: 3, textAlign: 'center' }}>
          <Avatar src={totalRank.badge_url} sx={{ width: 96, height: 96, mx: 'auto', mb: 1 }} />
          <Typography variant="h6">{totalRank.label}</Typography>
          <Typography color="text.secondary">{data.xp_total} XP</Typography>
        </Card>

        {/* カテゴリ別バッジ */}
        <Grid container spacing={2}>
          {XP_CATEGORIES.map(({ key, label }) => {
            const xp = user[`xp_${key}`] ?? 0
            const { current } = getRankByXP(xp)
            const url = getBadgeAsset(key, current.key)

            return (
              <Grid item xs={6} sm={4} md={2} key={key}>
                <Card sx={{ p: 2, textAlign: 'center' }}>
                  <Avatar src={url} sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }} />
                  <Typography variant="body2">{label}</Typography>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </>
  )
}
