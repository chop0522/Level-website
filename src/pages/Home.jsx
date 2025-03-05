// src/pages/Home.jsx
import React from 'react';
import { Container, Typography } from '@mui/material';

function Home() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Welcome to Board Game Cafe</Typography>
      <Typography>
        ここではボードゲームカフェの情報を管理し、ユーザーはマイページでスコアや麻雀役などを確認できます。
      </Typography>
    </Container>
  );
}

export default Home;