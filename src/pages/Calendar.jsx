// src/pages/Calendar.jsx  (←ファイル名はそのままでもOK)
// ただし中身は「設備紹介ページ」に変更

import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';

function Features() {
  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      {/* --- 店内設備 --- */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          店内設備
        </Typography>
        <Typography variant="body1" paragraph>
          ・4テーブル、椅子20席<br/>
          ・電源＆Wi-Fi完備<br/>
          ・大型モニター貸出あり<br/>
          ・最新全自動雀卓 AMOS REX3
        </Typography>
      </Paper>

      {/* --- 特徴・ウリ --- */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            特徴・ウリ
          </Typography>
          <Typography variant="body1" paragraph>
            ・ボードゲームは1000種類以上！<br/>
            ・ボードゲーム以外にも、麻雀、ポーカー、クイズ、謎解き、マーダーミステリーなど多彩に遊べる<br/>
            ・店内写真や内装イメージなども今後アップ予定
          </Typography>
        </Paper>
      </Box>

      {/* --- アクセス・周辺情報 --- */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            アクセス・周辺情報
          </Typography>
          <Typography variant="body1" paragraph>
            ・最寄り駅：東京メトロ東西線「行徳駅」<br/>
            ・近隣の駐車場：コインパーキングを利用可
          </Typography>
        </Paper>
      </Box>

      {/* --- 貸切時の設備 --- */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            貸切時の設備
          </Typography>
          <Typography variant="body1" paragraph>
            ・広いスペースを全面的に使え、大人数でのボードゲームやイベントが可能<br/>
            ・大型モニターや最新全自動雀卓（AMOS REX3）も利用可
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default Features;