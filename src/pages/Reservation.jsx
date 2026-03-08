// src/pages/Reservation.jsx (改良後の例)
import React from 'react'
import { Container, Paper, Typography, Button, Box } from '@mui/material'
import SeoHead from '../components/SeoHead'
import PublicPageLinks from '../components/PublicPageLinks'
import businessInfo from '../config/businessInfo.json'

function Reservation() {
  return (
    <>
      <SeoHead pageKey="reservation" />
      <Container sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            予約案内
          </Typography>
          <Typography variant="body1" paragraph>
            {businessInfo.name}
            の予約は現在、公式LINEから承っております。以下のボタンからご連絡ください。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            店舗情報: {businessInfo.displayAddress}
          </Typography>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              sx={{ mb: 2 }}
              onClick={() => window.open(businessInfo.lineUrl, '_blank')}
            >
              LINEで予約する
            </Button>
          </Box>

          <Typography variant="body2" color="textSecondary">
            【お知らせ】
            <br />
            ご連絡の際は以下の情報を添えていただくとスムーズです：
            <br />
            ・お名前
            <br />
            ・ご希望日時
            <br />
            ・人数
            <br />
            ・電話番号
            <br />
            ・その他ご要望
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, mt: 4 }}>
          <PublicPageLinks />
        </Paper>
      </Container>
    </>
  )
}

export default Reservation
