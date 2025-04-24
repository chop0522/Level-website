// src/pages/Calendar.jsx
import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';

// 店内写真（jpg ＋ webp）
import mahjongJpg      from '../assets/images/mahjong_table.jpg';
import mahjongWebp     from '../assets/images/mahjong_table.webp';
import shelfJpg        from '../assets/images/boardgame_shelves.jpg';
import shelfWebp       from '../assets/images/boardgame_shelves.webp';

// WebP + JPG フォールバック表示用
const Picture = ({ webp, jpg, alt }) => (
  <picture>
    {webp && <source type="image/webp" srcSet={webp} />}
    <img src={jpg} alt={alt} loading="lazy" style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
  </picture>
);

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

        {/* 今後、写真を追加する場所 (例: テーブル・椅子写真) */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {/* 写真の説明をここに入れる */}
            テーブル・椅子のイメージ
          </Typography>
          <Picture
            webp={mahjongWebp}
            jpg={mahjongJpg}
            alt="最新全自動雀卓 AMOS REX3"
          />
        </Box>

        {/* 大型モニターや雀卓の写真を追加するなら下記を複製 */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            大型モニター / 全自動雀卓イメージ
          </Typography>
          {/* 例: <img src={monitorPhoto} alt="大型モニター" style={{ maxWidth: '100%' }} /> */}
          <Paper
            variant="outlined"
            sx={{
              height: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            {/* プレースホルダー */}
            写真(モニター・雀卓)のプレースホルダー
          </Paper>
        </Box>
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

          {/* 特徴や内装写真を追加 */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              内装イメージ / ボードゲーム棚など
            </Typography>
            <Picture
              webp={shelfWebp}
              jpg={shelfJpg}
              alt="店内ボードゲーム棚"
            />
          </Box>
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

          {/* アクセス写真(外観,看板など) */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              店舗外観 / 看板イメージ
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              {/* プレースホルダー */}
              写真(外観)のプレースホルダー
            </Paper>
          </Box>
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

          {/* 貸切利用時のイメージ写真 */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              貸切時の様子 / 大人数写真など
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              {/* プレースホルダー */}
              写真(貸切イメージ)のプレースホルダー
            </Paper>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Features;