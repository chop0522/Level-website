

// src/pages/PublicProfile.jsx
import React, { useEffect, useState, useContext } from 'react';
import {
  Container,
  Card,
  Avatar,
  Typography,
  Grid,
  Button,
  Snackbar,
  Alert,
  keyframes
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/TokenContext';
import {
  getPublicProfile,
  getFriendship,
  highfive
} from '../services/api';
import XPCard from '../components/xp/XPCard';

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
`;
export default function PublicProfile() {
  const { id } = useParams();
  const { token, userInfo } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [friendship, setFriendship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [anim, setAnim] = useState(false);

  // fetch profile
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getPublicProfile(id, token);
      if (res.success) setProfile(res.profile);

      // friendship power (optional)
      if (token) {
        const fr = await getFriendship(id, token);
        if (fr.success) setFriendship(fr.power);
      }
      setLoading(false);
    })();
  }, [id, token]);

  const handleHighfive = async () => {
    setDisabled(true);
    const res = await highfive(id, token);
    if (res.success) {
      setAnim(true);
      setTimeout(() => setAnim(false), 700);
      setToast('👏 ハイタッチ！友情パワー +1');
      setFriendship((prev) => (prev ?? 0) + 1);
    } else {
      setToast(res.error || 'ハイタッチできませんでした');
    }
  };

  if (loading || !profile) {
    return <Container sx={{ mt: 4 }}>Loading…</Container>;
  }

  // Build categories for XPCard (readonly)
  const cats = [
    { key: 'stealth', label: '正体隠匿', color: '#3f51b5' },
    { key: 'heavy', label: '重量級', color: '#795548' },
    { key: 'light', label: '軽量級', color: '#009688' },
    { key: 'party', label: 'パーティ', color: '#ff9800' },
    { key: 'gamble', label: 'ギャンブル', color: '#9c27b0' },
    { key: 'quiz', label: 'クイズ', color: '#e91e63' }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Avatar
          src={profile.avatar_url}
          sx={{
            width: 96,
            height: 96,
            mx: 'auto',
            mb: 1,
            animation: anim ? `${highfiveKF} 0.7s ease-in-out` : 'none'
          }}
        />
        <Typography variant="h5">{profile.name || `User ${id}`}</Typography>
        {profile.bio && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {profile.bio}
          </Typography>
        )}

        {/* ハイタッチボタン */}
        {token && userInfo?.id !== Number(id) && (
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleHighfive}
            disabled={disabled}
          >
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

      {/* XP Cards */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {cats.map((c) => {
          const xp = profile[`xp_${c.key}`] ?? 0;
          const rank =
            xp >= 800 ? 'Master' : xp >= 400 ? 'Gold' : xp >= 150 ? 'Silver' : xp >= 50 ? 'Bronze' : 'Rookie';
          const badgeUrl = `/badges/${c.key}_${rank.toLowerCase()}.png`;
          return (
            <Grid item xs={6} sm={4} md={2} key={c.key}>
              <XPCard
                category={c.label}
                currentXP={xp}
                rankLabel={rank}
                badgeUrl={badgeUrl}
                color={c.color}
                nextXP={null}
              />
            </Grid>
          );
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
  );
}