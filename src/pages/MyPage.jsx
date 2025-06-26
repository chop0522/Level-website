// src/pages/MyPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Button } from '@mui/material';
import { Avatar, Stack, Box, Card, Snackbar, Alert } from '@mui/material';
import { Grid } from '@mui/material';
import XPCard from '../components/xp/XPCard';
import ProfileEditDialog from '../components/profile/ProfileEditDialog';
import AccountSettingsDialog from '../components/account/AccountSettingsDialog';
import {
  getProfile,
  getUserInfo,
  gainXP,
  getRecentHighfives,
  getPublicProfile,
  getUnreadHighfives
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';

import { AuthContext } from '../contexts/TokenContext';
import MyPageNav from '../components/MyPageNav';

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

// yyyy-mm-dd → 'M/D' 形式へ変換
function formatDate(isoStr) {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function MyPage() {
  // コンテキストからダイレクトに取得（名前変更後に即再レンダ）
  const { token, userInfo, setUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [rankUpAnim, setRankUpAnim] = useState({});
  const [recentHF, setRecentHF] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // アバターのキャッシュバスター
  const [avatarVer, setAvatarVer] = useState(Date.now());

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

        // fetch recent highfives (limited to 10)
        const hf = await getRecentHighfives(token, 10);
        if (hf.success) {
          // fetch partner profiles to get name & avatar (Promise.all)
          const enriched = await Promise.all(
            hf.recent.map(async (r) => {
              const p = await getPublicProfile(r.partner_id, token);
              return {
                id: r.partner_id,
                name: (p.profile && p.profile.name) || `User${r.partner_id}`,
                avatar: p.profile?.avatar_url || '',
                last: r.last_date
              };
            })
          );
          setRecentHF(enriched);
        }

        // 未読ハイタッチ通知
        const unread = await getUnreadHighfives(token, 5);
        if (unread.success && unread.unread.length > 0) {
          const senderId = unread.unread[0].from_id;
          const senderProf = await getPublicProfile(senderId, token);
          const senderName =
            (senderProf.profile && senderProf.profile.name) || `User${senderId}`;
          setToast(`👏 ${senderName} さんからハイタッチ！`);
        }
      }
    } catch (err) {
      console.error(err);
      setError('ユーザー情報の取得に失敗しました');
    }
  };

  const fetchProfile = async () => {
    try {
      const p = await getProfile(token);
      if (!p.error) {
        setProfile(p);
        // 画像を最新にするためキャッシュバスターを更新
        setAvatarVer(Date.now());
      }
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

    // 更新 XP
    setUserInfo(prev => ({
      ...prev,
      [`xp_${catKey}`]: res.currentXP
    }));

    // ランクアップ演出
    if (res.rankUp) {
      setRankUpAnim(prev => ({ ...prev, [catKey]: true }));
      setTimeout(() => {
        setRankUpAnim(prev => ({ ...prev, [catKey]: false }));
      }, 1200);
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
      <MyPageNav />

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
                  src={`/api/users/${userInfo.id}/avatar?${avatarVer}`}
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

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => setSettingsOpen(true)}
          >
            アカウント設定
          </Button>

          {/* 麻雀ランキングを見るボタン */}
          <Button
            variant="outlined"
            component={RouterLink}
            to="/mahjong"
            sx={{ mt: 2, ml: 2 }}
          >
            麻雀ランキングを見る
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
            {categories.map((cat) => {
              const xp = userInfo[`xp_${cat.key}`] ?? 0;
              const currentRank = [...rankTable].reverse().find(r => xp >= r.xp) || rankTable[0];
              const nextRank = rankTable.find(r => r.xp > xp);
              // すべて PNG で統一
              const badgeUrl = `/badges/${cat.key}_${currentRank.label.toLowerCase()}.png`;

              return (
                <Grid item xs={12} sm={6} key={cat.key}>
                  <XPCard
                    category={cat.ja}
                    currentXP={xp}
                    rankLabel={currentRank.label}
                    badgeUrl={badgeUrl}
                    nextXP={nextRank ? nextRank.xp : null}
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
            // アップロード成功後にキャッシュバスターを更新
            setAvatarVer(Date.now());
            setToast('プロフィールを更新しました');
          }}
        />
      )}

      {/* アカウント設定ダイアログ */}
      <AccountSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={() => {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
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
  );
}

export default MyPage;