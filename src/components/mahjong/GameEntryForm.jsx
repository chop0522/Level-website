import { useState, useContext, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { AuthContext } from '../../contexts/TokenContext';
import { apiFetch } from '../../services/api';
import { ranks } from '../../utils/mahjong'; // rank list (non-admin 単票用)

/**
 * 改善版 GameEntryForm
 * - 管理者: 4人分をテーブルで一括入力（ユーザーはAutocomplete、点数は直接入力、順位は1～4）
 * - 一般ユーザー: 既存の単票フォームのまま
 * - 送信は /api/mahjong/matches** に一括POST（`test: true` でランキングに反映しない）
 * - サーバが user_id に対応している場合は user_id を、未対応でも username を渡すフォールバック
 */
export default function GameEntryForm({ open, onClose, onSubmitted }) {
  const { userInfo: user } = useContext(AuthContext);

  // ===== 非管理者（単票）用の既存ステート =====
  const [rank, setRank] = useState(1);
  const [score, setScore] = useState(25000);
  const [username, setUsername] = useState('');

  // ===== 共通 =====
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTest, setIsTest] = useState(false);

  // ===== 管理者（4人一括）用 =====
  const [userList, setUserList] = useState([]); // [{id, name}] を想定（文字列のみでも受ける）
  const defaultRows = useMemo(
    () => ([1, 2, 3, 4].map((r) => ({ rank: r, user: null, score: 25000 }))),
    []
  );
  const [rows, setRows] = useState(defaultRows);

  // 管理者はユーザー一覧取得（id/name の両対応にしておく）
  useEffect(() => {
    let ignore = false;
    if (user?.role === 'admin') {
      apiFetch('/api/admin/users/list')
        .then((list) => {
          if (ignore) return;
          if (!Array.isArray(list)) return setUserList([]);
          // list が ["name", ...] 形式 or [{id,name}, ...] 形式どちらにも対応
          const normalized = list.map((u) =>
            typeof u === 'string'
              ? { id: u, name: u }
              : {
                  id: u.id ?? u.user_id ?? u.username ?? u.name,
                  name: u.name ?? u.display_name ?? u.username ?? '',
                }
          );
          setUserList(normalized);
        })
        .catch(() => setUserList([]));
    }
    return () => {
      ignore = true;
    };
  }, [user]);

  const resetAdminForm = () => setRows(defaultRows);

  const handleAdminCellChange = (index, key, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const autoRankByScore = () => {
    // スコアが高い順に rank 1～4 を自動割当（同点は先勝ち）
    const scored = rows.map((r, i) => ({ ...r, _i: i }));
    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const ranked = scored.map((r, idx) => ({ ...r, rank: idx + 1 }));
    // 元の並び順で戻す
    ranked.sort((a, b) => a._i - b._i);
    setRows(ranked.map(({ _i, ...rest }) => rest));
  };

  const validateAdmin = () => {
    // 4行とも user と score が入っているか／ユーザー重複チェック
    const chosenIds = new Set();
    for (const r of rows) {
      if (!r.user || !r.user.name) return 'すべての行でプレイヤーを選択してください。';
      if (r.score === '' || r.score === null || Number.isNaN(Number(r.score))) return '点数は数値で入力してください。';
      const uid = r.user.id ?? r.user.name; // id が無い場合は name で代替（暫定）
      if (chosenIds.has(uid)) return '同じプレイヤーが重複しています。';
      chosenIds.add(uid);
    }
    const ranksSet = new Set(rows.map((r) => r.rank));
    if (ranksSet.size !== 4 || Math.min(...ranksSet) !== 1 || Math.max(...ranksSet) !== 4) {
      return '順位は1～4を各1回ずつにしてください（「自動順位」ボタンで割り当て可）。';
    }
    return '';
  };

  const handleAdminSubmit = async () => {
    const v = validateAdmin();
    if (v) {
      setErr(v);
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const payload = {
        test: isTest,
        results: rows.map((r) => ({
          rank: r.rank,
          finalScore: Number(r.score),
          ...(r.user?.id ? { user_id: r.user.id } : { username: r.user?.name })
        }))
      };

      await apiFetch('/api/mahjong/matches', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      onSubmitted?.();
      onClose?.();
      resetAdminForm();
    } catch (e) {
      setErr(e.message || '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSingle = async () => {
    try {
      setLoading(true);
      await apiFetch('/api/mahjong/games', {
        method: 'POST',
        body: JSON.stringify({
          rank,
          finalScore: Number(score),
          username: username || undefined,
        }),
      });
      onSubmitted?.();
      onClose?.();
    } catch (e) {
      setErr(e.message || '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ===== Render =====
  const isAdmin = user?.role === 'admin';

  return (
    <Dialog open={open} onClose={onClose} maxWidth={isAdmin ? 'md' : 'xs'} fullWidth>
      <DialogTitle>対局結果を登録</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          {isAdmin ? (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={64}>順位</TableCell>
                    <TableCell>プレイヤー</TableCell>
                    <TableCell width={160}>終局持ち点</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={row.rank}
                          onChange={(e) => handleAdminCellChange(idx, 'rank', Number(e.target.value))}
                        >
                          {[1, 2, 3, 4].map((r) => (
                            <MenuItem key={r} value={r}>{r} 位</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          options={userList}
                          getOptionLabel={(o) => (o?.name ?? '')}
                          value={row.user}
                          onChange={(_, v) => handleAdminCellChange(idx, 'user', v)}
                          renderInput={(params) => (
                            <TextField {...params} label="ユーザー" placeholder="名前で検索" size="small" />
                          )}
                          isOptionEqualToValue={(a, b) => (a?.id ?? a?.name) === (b?.id ?? b?.name)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={row.score}
                          onChange={(e) => handleAdminCellChange(idx, 'score', Number(e.target.value))}
                          inputProps={{ step: 100 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                <FormControlLabel
                  control={<Checkbox checked={isTest} onChange={(e) => setIsTest(e.target.checked)} />}
                  label="テスト（ランキングに反映しない）"
                />
                <Button onClick={autoRankByScore} variant="outlined">自動順位（点数降順）</Button>
                <Button onClick={resetAdminForm} variant="text">リセット</Button>
              </Stack>
            </>
          ) : (
            <>
              {/* 一般ユーザーは従来のフォーム */}
              <TextField
                select
                label="順位"
                value={rank}
                onChange={(e) => setRank(Number(e.target.value))}
                fullWidth
              >
                {ranks.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r} 位
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="終局持ち点"
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                fullWidth
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        {isAdmin ? (
          <Button onClick={handleAdminSubmit} variant="contained" disabled={loading}>
            一括登録
          </Button>
        ) : (
          <Button onClick={handleSubmitSingle} variant="contained" disabled={loading}>
            登録
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}