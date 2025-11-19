// src/pages/MahjongPage.jsx
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Typography,
  Paper,
  IconButton
} from '@mui/material';
import Chip from '@mui/material/Chip';
import { getRankFromPoint } from '../utils/mahjongRank';
import AddIcon from '@mui/icons-material/Add';
import { apiFetch } from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
import { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../contexts/TokenContext';
import GameEntryForm from '../components/mahjong/GameEntryForm';
import AdminGameList from '../components/mahjong/AdminGameList';
import { Helmet } from 'react-helmet-async';

export default function MahjongPage() {
  const { token, userInfo: user } = useContext(AuthContext); // 認証情報
  const [tab, setTab] = useState(0);           // 0=今月, 1=先月
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false); // 対局登録フォーム
  const [adminOpen, setAdminOpen] = useState(false); // 管理者: 履歴編集ダイアログ

  // 月間ランキング取得
  useEffect(() => {
    async function fetchRank() {
      try {
        setLoading(true);
        setError('');
        const month =
          tab === 0 ? '' : `?month=${dayjs().subtract(1, 'month').format('YYYY-MM')}`;
        const res = await apiFetch(`/api/mahjong/monthly${month}`);
        setRows(res.ranking);
      } catch (err) {
        setError(err.message || '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchRank();
  }, [tab]);

  return (
    <Box sx={{ p: 3 }}>
      <Helmet>
        <title>今月の麻雀ランキング</title>
        <link rel="canonical" href="https://gamecafe-level.com/mahjong" />
        <meta
          name="description"
          content="ゲームカフェ.Levelの月間麻雀ランキング。今月と先月の成績を掲載。テスト対局は集計に含めません。名前変更は現行名で表示されます。"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="今月の麻雀ランキング｜ゲームカフェ.Level" />
        <meta property="og:description" content="今月と先月の月間麻雀ランキング。対局登録のテストは集計対象外です。" />
        <meta property="og:url" content="https://gamecafe-level.com/mahjong" />
        <meta property="og:image" content="https://gamecafe-level.com/ogp/home.jpg" />
        <meta property="og:locale" content="ja_JP" />

        {/* FAQ 構造化データ（ランキングの仕様） */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "どの期間の成績ですか？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "日本時間（JST）の月単位で集計しています。画面のタブで今月・先月を切り替えて表示できます。"
              }
            },
            {
              "@type": "Question",
              name: "点数計算はどうやっていますか？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "4人の持ち点合計が100,000点になるように入力し、終局持ち点と順位から店内の換算ルールでポイントに自動換算しています。"
              }
            },
            {
              "@type": "Question",
              name: "テスト対局はランキングに含まれますか？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "含まれません。テスト登録（is_test=true）の対局は集計から除外しています。"
              }
            },
            {
              "@type": "Question",
              name: "名前を変更した場合の扱いは？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "同じアカウント（同一ユーザーID）の成績は現行の表示名で統一して表示します。"
              }
            },
            {
              "@type": "Question",
              name: "同点のときはどうなりますか？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "順位は入力の1〜4を各1回割り当てます（同点でも順位は入力に従います）。"
              }
            }
          ]
        })}</script>

        {/* パンくず（任意） */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "ホーム",
              item: "https://gamecafe-level.com/"
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "麻雀ランキング",
              item: "https://gamecafe-level.com/mahjong"
            }
          ]
        })}</script>
      </Helmet>
      <Typography variant="h5" gutterBottom>
        麻雀月間ランキング
      </Typography>

      <Button
        component={RouterLink}
        to="/mahjong/lifetime"
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      >
        通算ランキングへ
      </Button>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="今月" />
        <Tab label="先月" />
      </Tabs>

      {user && user.role === 'admin' && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <IconButton
            size="small"
            onClick={() => setFormOpen(true)}
            title="対局を追加"
          >
            <AddIcon />
          </IconButton>
          <Button variant="outlined" size="small" onClick={() => setAdminOpen(true)}>
            対局履歴を編集（管理者）
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 3 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <Paper elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>プレイヤー</TableCell>
                <TableCell align="right">Pt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => {
                const lifetimeRank = getRankFromPoint(r.total_pt ?? 0);
                return (
                  <TableRow
                    key={r.id}
                    sx={{
                      bgcolor:
                        user && r.id === user.id ? 'rgba(255,215,0,0.15)' : undefined
                    }}
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <UserAvatar id={r.id} size={28} sx={{ mr: 1 }} />
                        <Typography component="span">{r.name}</Typography>
                        <Chip
                          label={lifetimeRank.label}
                          size="small"
                          sx={{
                            bgcolor: lifetimeRank.color,
                            color: '#fff',
                            ml: 1
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{r.monthly_pt}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      <AdminGameList open={adminOpen} onClose={() => setAdminOpen(false)} />
      <GameEntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmitted={() => setTab((prev) => prev)} /* re-fetch current tab */
      />
    </Box>
  );
}
