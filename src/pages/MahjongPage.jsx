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

export default function MahjongPage() {
  const { token, userInfo: user } = useContext(AuthContext); // 認証情報
  const [tab, setTab] = useState(0);           // 0=今月, 1=先月
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false); // 対局登録フォーム

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
        <IconButton
          size="small"
          sx={{ ml: 1 }}
          onClick={() => setFormOpen(true)}
        >
          <AddIcon />
        </IconButton>
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
              {rows.map((r, i) => (
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
                        label={getRankFromPoint(r.monthly_pt).label}
                        size="small"
                        sx={{
                          bgcolor: getRankFromPoint(r.monthly_pt).color,
                          color: '#fff',
                          ml: 1
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">{r.monthly_pt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <GameEntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmitted={() => setTab((prev) => prev)} /* re-fetch current tab */
      />
    </Box>
  );
}