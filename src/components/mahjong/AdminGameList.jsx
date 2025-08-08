

import React, { useEffect, useMemo, useState, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Alert, TextField, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import { AuthContext } from '../../contexts/TokenContext';
import { apiFetch } from '../../services/api';

/**
 * 管理者用: 対局履歴を直接編集するダイアログ
 * - /api/mahjong/games で一覧取得（month/JST・テスト絞り込み可）
 * - セルで rank / final_score を直接編集 → 保存で PATCH /api/mahjong/games/:id
 * - テスト行はランキング/合計Ptに影響しない。通常行は保存後にMVが更新される
 */
export default function AdminGameList({ open, onClose }) {
  const { userInfo } = useContext(AuthContext);
  const isAdmin = userInfo?.role === 'admin';

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [testFilter, setTestFilter] = useState('all'); // all | true | false

  const monthOptions = useMemo(() => {
    const now = dayjs();
    // 直近6ヶ月を候補に
    return Array.from({ length: 6 }, (_, i) => now.subtract(i, 'month').format('YYYY-MM'));
  }, []);

  const fetchRows = async () => {
    setLoading(true);
    setErr('');
    try {
      const q = new URLSearchParams();
      if (month) q.set('month', month);
      if (testFilter !== 'all') q.set('test', testFilter);
      const res = await apiFetch(`/api/mahjong/games?${q.toString()}`);
      setRows(res?.rows ?? []);
    } catch (e) {
      setErr(e.message || '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, month, testFilter]);

  const updateField = (idx, key, val) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  const saveRow = async (r, idx) => {
    setErr('');
    setSavingId(r.id);
    try {
      await apiFetch(`/api/mahjong/games/${r.id}` , {
        method: 'PATCH',
        body: JSON.stringify({
          finalScore: Number(r.final_score),
          rank: Number(r.rank),
        }),
      });
      await fetchRows(); // ポイント再計算＆MV更新があるので再取得
    } catch (e) {
      setErr(e.message || '保存に失敗しました');
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>対局履歴（管理者）— 直接編集</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mb: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              select size="small" label="月"
              value={month} onChange={(e) => setMonth(e.target.value)}
            >
              {monthOptions.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            <TextField
              select size="small" label="テスト"
              value={testFilter} onChange={(e) => setTestFilter(e.target.value)}
            >
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="false">通常のみ</MenuItem>
              <MenuItem value="true">テストのみ</MenuItem>
            </TextField>
            <Button onClick={fetchRows} disabled={loading}>再読み込み</Button>
            {loading && <CircularProgress size={18} />}
          </Stack>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={120}>日時(JST)</TableCell>
              <TableCell>ユーザー</TableCell>
              <TableCell width={90}>順位</TableCell>
              <TableCell width={140}>終局持ち点</TableCell>
              <TableCell width={80}>Pt</TableCell>
              <TableCell width={80}>テスト</TableCell>
              <TableCell width={120} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={r.id}>
                <TableCell>{dayjs(r.played_at_jst).format('MM/DD HH:mm')}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>
                  <TextField select size="small" value={r.rank}
                    onChange={(e) => updateField(idx, 'rank', Number(e.target.value))}>
                    {[1,2,3,4].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={r.final_score}
                    inputProps={{ step: 100 }}
                    onChange={(e) => updateField(idx, 'final_score', Number(e.target.value))}
                  />
                </TableCell>
                <TableCell>{r.point}</TableCell>
                <TableCell>{r.is_test ? <Chip size="small" label="TEST"/> : '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => saveRow(r, idx)}
                    disabled={savingId === r.id}
                  >
                    {savingId === r.id ? '保存中…' : '保存'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>データなし</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}