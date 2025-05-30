

// src/pages/AchievementsPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Container, Typography, Grid, Card, Avatar } from '@mui/material';
import { AuthContext } from '../contexts/TokenContext';
import { getAchievements } from '../services/api';
import MyPageNav from '../components/MyPageNav';

const CAT_KEYS = [
  { key: 'stealth', label: '正体隠匿' },
  { key: 'heavy', label: '重量級' },
  { key: 'light', label: '軽量級' },
  { key: 'party', label: 'パーティ' },
  { key: 'gamble', label: 'ギャンブル' },
  { key: 'quiz', label: 'クイズ' }
];
const RANK_LABELS = ['rookie', 'bronze', 'silver', 'gold', 'diamond'];

export default function AchievementsPage() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await getAchievements(token);
      if (res.success) setData(res);
    })();
  }, [token]);

  if (!data) return <Container sx={{ mt: 4 }}>Loading…</Container>;

  const { user, totalRank } = data;

  return (
    <Container sx={{ mt: 4 }}>
      <MyPageNav />
      <Typography variant="h4" gutterBottom>
        Achievements
      </Typography>

      {/* 総合ランクカード */}
      <Card sx={{ p: 3, my: 3, textAlign: 'center' }}>
        <Avatar
          src={totalRank.badge_url}
          sx={{ width: 96, height: 96, mx: 'auto', mb: 1 }}
        />
        <Typography variant="h6">{totalRank.label}</Typography>
        <Typography color="text.secondary">{data.xp_total} XP</Typography>
      </Card>

      {/* カテゴリ別バッジ */}
      <Grid container spacing={2}>
        {CAT_KEYS.map(({ key, label }) => {
          const xp = user[`xp_${key}`] ?? 0;
          const rank =
            xp >= 800 ? 4 : xp >= 400 ? 3 : xp >= 150 ? 2 : xp >= 50 ? 1 : 0;
          const url = `/badges/${key}_${RANK_LABELS[rank]}.png`;

          return (
            <Grid item xs={6} sm={4} md={2} key={key}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Avatar
                  src={url}
                  sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}
                />
                <Typography variant="body2">{label}</Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}