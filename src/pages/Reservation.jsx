// src/pages/Reservation.jsx
import React, { useState } from 'react';
import { createReservation } from '../services/api';

// ▼ Material UI
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button 
} from '@mui/material';

function Reservation() {
  const [dateTime, setDateTime] = useState('');
  const [people, setPeople] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ★簡易バリデーション
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'お名前を入力してください';
    }
    if (!phone.trim()) {
      newErrors.phone = '電話番号を入力してください';
    } else if (!/^\d+$/.test(phone.trim())) {
      newErrors.phone = '電話番号は数字のみで入力してください';
    }
    if (!dateTime) {
      newErrors.dateTime = '日時を選択してください';
    }
    if (!people || people < 1) {
      newErrors.people = '人数を1以上で指定してください';
    }
    
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // エラーがあれば送信中断
      return;
    }

    // APIにリクエスト送信 (name, phone, dateTime, people, note)
    const res = await createReservation({ name, phone, dateTime, people, note });
    if (res.success) {
      alert('予約が完了しました！');
      // 必要に応じてフォームをリセット
      setName('');
      setPhone('');
      setDateTime('');
      setPeople(1);
      setNote('');
      setErrors({});
    } else {
      alert('予約に失敗しました...');
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          予約フォーム
        </Typography>
        <Typography variant="body1" paragraph>
          希望日時やお名前、人数をご入力の上、送信してください。
          確認後、スタッフより公式LINEまたはお電話にてご連絡いたします。
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* お名前 */}
          <TextField
            label="お名前"
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
          />

          {/* 電話番号 */}
          <TextField
            label="電話番号"
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
          />

          {/* 日時 */}
          <TextField
            label="日時"
            type="datetime-local"
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            error={Boolean(errors.dateTime)}
            helperText={errors.dateTime}
            InputLabelProps={{
              shrink: true, // ラベルを上に移動
            }}
          />

          {/* 人数 */}
          <TextField
            label="人数"
            type="number"
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            error={Boolean(errors.people)}
            helperText={errors.people}
            inputProps={{ min: 1 }}
          />

          {/* 備考 */}
          <TextField
            label="備考(任意)"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button type="submit" variant="contained" color="primary">
            予約する
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Reservation;