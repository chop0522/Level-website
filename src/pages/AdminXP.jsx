

import React, { useState, useContext } from 'react';
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
import { AuthContext } from '../contexts/TokenContext';

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

  const [email,     setEmail]     = useState('');
  const [category,  setCategory]  = useState('stealth');
  const [loading,   setLoading]   = useState(false);
  const [toastMsg,  setToastMsg]  = useState('');
  const [errorMsg,  setErrorMsg]  = useState('');

  const handleGiveXP = async () => {
    setErrorMsg('');
    if (!email) {
      setErrorMsg('メールアドレスを入力してください');
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
        body: JSON.stringify({ email, category, amount: 10 })
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg(`${email} に ${categories.find(c => c.key === category)?.label} +10 XP を付与しました`);
        setEmail('');
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
        <TextField
          label="ユーザー Email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

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
    </Container>
  );
}