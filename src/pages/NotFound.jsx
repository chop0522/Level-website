// src/pages/NotFound.jsx
import React from 'react'
import { Container, Typography, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

function NotFound() {
  return (
    <Container sx={{ textAlign: 'center', mt: 8, mb: 8 }}>
      <Helmet>
        <title>ページが見つかりません</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="お探しのページは削除されたかURLが変更されています。ゲームカフェ.Levelのトップへお戻りください。"
        />
      </Helmet>
      <Typography variant="h2" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        お探しのページは見つかりませんでした
      </Typography>

      <Button variant="contained" color="primary" component={RouterLink} to="/" sx={{ mt: 4 }}>
        ホームへ戻る
      </Button>
    </Container>
  )
}

export default NotFound
