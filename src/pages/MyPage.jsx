// src/pages/MyPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Button } from '@mui/material';
import { Avatar, Stack, Box, Card, Snackbar, Alert } from '@mui/material';
import { Grid } from '@mui/material';
import XPCard from '../components/xp/XPCard';
import ProfileEditDialog from '../components/profile/ProfileEditDialog';
import { getProfile } from '../services/api';
import { getUserInfo } from '../services/api';
import { gainXP } from '../services/api';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../contexts/TokenContext';

// 開発判定（Vite でも Node でも安全に動く）
const isDev =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
  process.env.NODE_ENV === 'development';

// Radar chart related imports
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register radar components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function MyPage() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState('');

  // カテゴリ定義とランクテーブル
  const categories = [
    { key: 'stealth', ja: '正体隠匿', color: '#3f51b5' },
    { key: 'heavy',   ja: '重量級',   color: '#795548' },
    { key: 'light',   ja: '軽量級',   color: '#009688' },
    { key: 'party',   ja: 'パーティ', color: '#ff9800' },
    { key: 'gamble',  ja: 'ギャンブル', color: '#9c27b0' },
    { key: 'quiz',    ja: 'クイズ',   color: '#e91e63' }
  ];

  const rankTable = [
    { label: 'Rookie', xp: 0 },
    { label: 'Bronze', xp: 50 },
    { label: 'Silver', xp: 150 },
    { label: 'Gold',   xp: 400 },
    { label: 'Master', xp: 800 }
  ];

  useEffect(() => {
    // 未ログインならログインページへ
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    // ログイン済みならユーザー情報を取得
    fetchUserInfo();
    fetchProfile();
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const data = await getUserInfo(token);
      if (data.error || !data.id) {
        // トークン失効 → ログイン画面へリダイレクト
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      } else {
        setUserInfo(data);
      }
    } catch (err) {
      console.error(err);
      setError('ユーザー情報の取得に失敗しました');
    }
  };

  const fetchProfile = async () => {
    try {
      const p = await getProfile(token);
      if (!p.error) setProfile(p);
    } catch (err) {
      console.error(err);
    }
  };

  // XP加算 & ランクアップ処理
  const handleGainXP = async (catKey) => {
    const res = await gainXP(token, catKey);
    if (!res.success) {
      console.error(res.error);
      setToast('XP加算に失敗しました');
      return;
    }
    // userInfo ステートを更新
    setUserInfo(prev => ({
      ...prev,
      [`xp_${catKey}`]: res.currentXP
    }));
    // rankUp Toast
    if (res.rankUp) {
      const ja = categories.find(c => c.key === catKey)?.ja || catKey;
      setToast(`${ja} が ${res.label} にランクアップ！`);
    } else {
      setToast(`+${res.xpGain} XP`);
    }
  };

  // レーダーチャート用データ生成
  const createRadarData = () => {
    if (!userInfo) return null;

    // userInfo内のxp_heavy等を展開
    const {
      xp_heavy = 0,
      xp_light = 0,
      xp_quiz = 0,
      xp_party = 0,
      xp_stealth = 0,
      xp_gamble = 0
    } = userInfo;

    return {
      labels: [
        '重量級',   // xp_heavy
        '軽量級',   // xp_light
        'クイズ',   // xp_quiz
        'パーティ', // xp_party
        '正体隠匿', // xp_stealth
        'ギャンブル' // xp_gamble
      ],
      datasets: [
        {
          label: 'カテゴリ別XP',
          data: [
            xp_heavy,
            xp_light,
            xp_quiz,
            xp_party,
            xp_stealth,
            xp_gamble
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  // レーダーチャートオプション
  const radarOptions = {
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        My Page
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* ユーザー情報がまだ取得できていない場合 */}
      {!userInfo && (
        <Typography>Loading...</Typography>
      )}

      {/* ユーザー情報が取得済みの場合 */}
      {userInfo && (
        <>
          <Typography>ようこそ, {userInfo.name}さん</Typography>
          <Typography>登録メール: {userInfo.email}</Typography>

          {/* 管理者の場合のみメッセージ等を表示 (role==='admin') */}
          {userInfo.role === 'admin' && (
            <Typography sx={{ mt: 2, color: 'red' }}>
              ※管理者モードで閲覧中
            </Typography>
          )}

          {/* プロフィールカード */}
          {profile && (
            <Card sx={{ p: 2, mt: 3, maxWidth: 480 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={profile.avatar_url || undefined}
                  sx={{ width: 64, height: 64 }}
                />
                <Box flexGrow={1}>
                  <Typography>{userInfo.name}</Typography>
                  {profile.bio && (
                    <Typography variant="body2" color="text.secondary">
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

          {/* カテゴリ別 XP カード */}
          <Grid container spacing={2} sx={{ mt: 4 }}>
            {categories.map((cat) => {
              const xp = userInfo[`xp_${cat.key}`] ?? 0;
              const currentRank = [...rankTable].reverse().find(r => xp >= r.xp) || rankTable[0];
              const nextRank = rankTable.find(r => r.xp > xp);
              // stealth バッジのみ PNG、それ以外は SVG
              const ext = cat.key === 'stealth' ? 'png' : 'svg';
              const badgeUrl = `/badges/${cat.key}_${currentRank.label.toLowerCase()}.${ext}`;

              return (
                <Grid item xs={12} sm={6} key={cat.key}>
                  <XPCard
                    category={cat.ja}
                    currentXP={xp}
                    rankLabel={currentRank.label}
                    badgeUrl={badgeUrl}
                    nextXP={nextRank ? nextRank.xp : null}
                    color={cat.color}
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
              );
            })}
          </Grid>

          {/* レーダーチャート: カテゴリ別XP */}
          <div style={{ marginTop: '30px', maxWidth: '600px' }}>
            <Typography variant="h6" gutterBottom>
              カテゴリ別XPレーダーチャート
            </Typography>
            {/* レーダーデータ生成後に存在するかチェック */}
            {createRadarData() && (
              <Radar
                data={createRadarData()}
                options={radarOptions}
              />
            )}
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
            setProfile((prev) => ({ ...prev, ...p }));
            setToast('プロフィールを更新しました');
          }}
        />
      )}

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
  );
}

export default MyPage;