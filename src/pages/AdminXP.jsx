import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Snackbar,
  Alert,
  Stack
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import debounce from 'lodash.debounce';
import { AuthContext } from '../contexts/TokenContext';
import { adminDeleteUser } from '../services/api';

/**
 * 管理者が任意ユーザーへ XP を付与する簡易ツール
 * ※ エンドポイント /api/giveXP (POST) 側で authenticateAdmin を必須にしてください
 */
const categories = [
  { key: 'stealth', label: '正体隠匿' },
  { key: 'heavy',   label: '重量級' },
  { key: 'light',   label: '軽量級' },
  { key: 'party',   label: 'パーティ' },
  { key: 'gamble',  label: 'ギャンブル' },
  { key: 'quiz',    label: 'クイズ' }
];

export default function AdminXP() {
  const { token } = useContext(AuthContext);

  const [userQ, setUserQ] = useState('');
  const [options, setOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [category,  setCategory]  = useState('stealth');
  const [loading,   setLoading]   = useState(false);
  const [toastMsg,  setToastMsg]  = useState('');
  const [errorMsg,  setErrorMsg]  = useState('');
  const [delId,    setDelId]    = useState('');
  // delId holds the numeric user.id chosen via Autocomplete, or manual input
  const [delError, setDelError] = useState('');
  const [delMsg,   setDelMsg]   = useState('');

  const searchUsers = React.useMemo(
    () => debounce(async (q) => {
      if (!q) return setOptions([]);
      try {
        const res = await fetch(`/api/admin/users?query=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setOptions(data);
      } catch { /* ignore */ }
    }, 400),
    [token]
  );

  useEffect(() => { searchUsers(userQ); }, [userQ, searchUsers]);

  const handleDeleteUser = async () => {
    setDelError('');
    const targetId = delId || selectedUser?.id;
    if (!targetId) {
      setDelError('ユーザーIDを入力してください');
      return;
    }
    if (!window.confirm(`${targetId} を削除します。よろしいですか？`)) return;
    const res = await adminDeleteUser(targetId, token);
    if (res.success) {
      setDelMsg(`ユーザー ${targetId} を削除しました`);
      setDelId('');
      setSelectedUser(null);
    } else {
      setDelError(res.error || '削除に失敗しました');
    }
  };

  const handleGiveXP = async () => {
    setErrorMsg('');
    if (!selectedUser) {
      setErrorMsg('ユーザーを選択してください');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/giveXP', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: selectedUser.email, category, amount: 10 })
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg(`${selectedUser.email} に ${categories.find(c => c.key === category)?.label} +10 XP を付与しました`);
        setSelectedUser(null);
        setUserQ('');
      } else {
        setErrorMsg(data.error || '付与に失敗しました');
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        XP 付与 (管理者専用)
      </Typography>

      <Stack spacing={2} sx={{ mt: 2 }}>
        <Autocomplete
          fullWidth
          options={options}
          getOptionLabel={(o) =>
            o.name
              ? `${o.name} (${o.email}) — ${o.xp_total} XP`
              : ''
          }
          noOptionsText="該当なし"
          inputValue={userQ}
          onInputChange={(_, v) => setUserQ(v)}
          value={selectedUser}
          onChange={(_, v) => {
            setSelectedUser(v);
            setDelId(v?.id ?? '');
          }}
          renderInput={(params) => (
            <TextField {...params} label="ユーザー検索" />
          )}
        />

        {selectedUser && (
          <Alert severity="info">
            選択中: {selectedUser.name} ({selectedUser.email}) — 合計 {selectedUser.xp_total} XP
          </Alert>
        )}

        <TextField
          select
          label="カテゴリ"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <MenuItem key={c.key} value={c.key}>
              {c.label}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="contained"
          disabled={loading}
          onClick={handleGiveXP}
        >
          +10 XP 付与
        </Button>

        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      </Stack>

      {/* ユーザー削除 */}
      <Stack spacing={2} sx={{ mt: 4 }}>
        <Typography variant="h6">ユーザー削除 (物理削除)</Typography>
        <TextField
          label="ユーザー ID (数値)"
          placeholder="検索で選択すると自動入力"
          fullWidth
          value={delId}
          onChange={(e) => setDelId(e.target.value)}
        />
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteUser}
          disabled={!delId}
        >
          削除
        </Button>
        {delError && <Alert severity="error">{delError}</Alert>}
      </Stack>

      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={3500}
        onClose={() => setToastMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToastMsg('')}>
          {toastMsg}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(delMsg)}
        autoHideDuration={3500}
        onClose={() => setDelMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setDelMsg('')}>
          {delMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}