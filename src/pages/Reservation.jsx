// src/pages/Reservation.jsx (改良後の例)
import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';

function Reservation() {
  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          予約案内
        </Typography>
        <Typography variant="body1" paragraph>
          予約は現在、公式LINEから承っております。
          以下のボタンをタップして、LINEにてご連絡ください。
        </Typography>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="success"
            sx={{ mb: 2 }}
            onClick={() => window.open('https://lin.ee/pyc6UjM', '_blank')}
          >
            LINEで予約する
          </Button>
        </Box>

        <Typography variant="body2" color="textSecondary">
          【お知らせ】<br />
          ご連絡の際は以下の情報を添えていただくとスムーズです：<br />
          ・お名前<br />
          ・ご希望日時<br />
          ・人数<br />
          ・電話番号<br />
          ・その他ご要望
        </Typography>
      </Paper>
    </Container>
  );
}

export default Reservation;