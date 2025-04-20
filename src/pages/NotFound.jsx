// src/pages/NotFound.jsx
import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function NotFound() {
  return (
    <Container sx={{ textAlign: 'center', mt: 8, mb: 8 }}>
      <Typography variant="h2" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        お探しのページは見つかりませんでした
      </Typography>

      <Button
        variant="contained"
        color="primary"
        component={RouterLink}
        to="/"
        sx={{ mt: 4 }}
      >
        ホームへ戻る
      </Button>
    </Container>
  );
}

export default NotFound;