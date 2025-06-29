import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import apiFetch from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
import Chip from '@mui/material/Chip';
import { getRankFromPoint } from '../utils/mahjongRank';

export default function LifetimeRankingPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    apiFetch('/api/mahjong/lifetime')
      .then((res) => {
        if (mounted) {
          setRows(res.ranking || []);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setErr(e.message);
          setLoading(false);
        }
      });
    return () => (mounted = false);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        麻雀 通算ランキング
      </Typography>

      {/* ナビゲーションリンク */}
      <Button
        component={RouterLink}
        to="/mahjong"
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      >
        今月ランキングへ
      </Button>

      {loading && <CircularProgress />}
      {err && <Typography color="error">{err}</Typography>}

      {!loading && !err && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>プレイヤー</TableCell>
                <TableCell align="right">通算 Pt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={r.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <UserAvatar id={r.id} size={28} sx={{ mr: 1 }} />
                      <Typography component="span">{r.name}</Typography>
                      <Chip
                        label={getRankFromPoint(r.total_pt).label}
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: getRankFromPoint(r.total_pt).color,
                          color: '#fff'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">{r.total_pt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
