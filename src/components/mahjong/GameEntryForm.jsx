import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert
} from '@mui/material';
import { apiFetch } from '../../services/api';
import { ranks } from '../../../utils/mahjong'; // rank list

export default function GameEntryForm({ open, onClose, onSubmitted }) {
  const [rank, setRank] = useState(1);
  const [score, setScore] = useState(25000);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await apiFetch('/api/mahjong/games', {
        method: 'POST',
        body: JSON.stringify({ rank, finalScore: score })
      });
      onSubmitted();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>対局結果を登録</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          登録
        </Button>
      </DialogActions>
    </Dialog>
  );
}