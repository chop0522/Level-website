// src/pages/Home.jsx
import React from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  IconButton 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// ▼ X(旧Twitter)アイコン (ダミーSVG)
const XIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 4 L20 20 M20 4 L4 20" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// ▼ LINEアイコン (ダミーSVG)
const LineIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" fill="currentColor"/>
    <text x="9" y="16" fill="#fff" fontSize="10" fontWeight="bold">LINE</text>
  </svg>
);

// ▼ Noteアイコン (ダミーSVG)
const NoteIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* シンプルな四角 + N の例 */}
    <rect x="3" y="3" width="18" height="18" fill="currentColor"/>
    <text x="7" y="17" fill="#fff" fontSize="10" fontWeight="bold">Note</text>
  </svg>
);

// ▼ Heroセクション (背景画像)
const HeroSection = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '400px',
  backgroundImage: 'url("https://via.placeholder.com/1200x400?text=Hero+Image")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

function Home() {
  return (
    <>
      {/* ----- Hero Section ----- */}
      <HeroSection>
        <Box textAlign="center" sx={{ backgroundColor: 'rgba(0,0,0,0.4)', p: 2 }}>
          <Typography variant="h3" component="h1" sx={{ color: '#fff' }}>
            ボードゲームカフェへようこそ！
          </Typography>
          <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>
            ここにキャッチコピーなどを表示できます
          </Typography>
        </Box>
      </HeroSection>

      {/* ----- 店舗概要・コンセプト ----- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            当店のコンセプト
          </Typography>
          <Typography variant="body1">
            {/* コンセプト、こだわり等をここに入力 */}
            例）「初心者でも安心！豊富なボードゲームと美味しいコーヒーでゆったり過ごせる空間を提供しています。」
          </Typography>
        </Paper>
      </Container>

      {/* ----- 営業情報 ----- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            営業情報
          </Typography>
          <Typography variant="body2">
            {/* ここに営業時間や定休日を入力 */}
            例）平日 12:00 - 22:00 / 土日祝 10:00 - 22:00 / 定休日：火曜
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {/* 料金プラン・予約方法など簡易情報 */}
            例）1時間 ¥500 / ドリンクバー付き / ゲームプレイ無料
          </Typography>
        </Paper>
      </Container>

      {/* ----- リンクボタン集 (メニュー, カレンダー, 予約など) ----- */}
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          各種ページリンク
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/menu"
            >
              メニューを見る
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              component={RouterLink}
              to="/calendar"
            >
              イベントカレンダー
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              component={RouterLink}
              to="/reservation"
            >
              予約フォーム
            </Button>
          </Grid>
          {/* 必要に応じて他のボタン追加 */}
        </Grid>
      </Container>

      {/* ----- ミニカレンダー (Notion iframe) ----- */}
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          ミニカレンダー
        </Typography>
        <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
          <iframe
            src="https://www.notion.so/your-workspace-calendar-url"
            style={{ width: '100%', height: '300px', border: 'none' }}
            title="Mini Notion Calendar"
          />
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          例）お店のイベントや営業日をカレンダーでご確認いただけます。
        </Typography>
      </Container>

      {/* ----- アクセス (Google Map埋め込み) ----- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            アクセス
          </Typography>
          <Typography variant="body1">
            {/* 住所など */}
            例）東京都千代田区丸の内1丁目 ゲームタワー3F 
          </Typography>
          <Box sx={{ mt: 2 }}>
            <iframe
              title="GoogleMap"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.888600269498!2d139.7665745155892!3d35.68124078019379!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6020965a3e2f9df7%3A0x8b5effdb19def56b!2z5pel5pys44CB44CSMTAwLTAwMTIg5p2x5Lqs6YO95riv5Yy65L2P5ZCM77yR77yS77yRIOWkp-moiQ!5e0!3m2!1sja!2sjp!4v1679545491800"
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Box>
        </Paper>
      </Container>

      {/* ----- SNSアイコン (X, LINE, Note) ----- */}
      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          SNSをフォローしよう！
        </Typography>
        <Grid container spacing={2}>
          {/* X (旧Twitter) */}
          <Grid item>
            <IconButton 
              onClick={() => window.open('https://x.com/あなたのアカウント', '_blank')}
              color="primary"
            >
              <XIcon />
            </IconButton>
          </Grid>
          {/* LINE */}
          <Grid item>
            <IconButton
              onClick={() => window.open('https://line.me/あなたのアカウント', '_blank')}
              color="primary"
            >
              <LineIcon />
            </IconButton>
          </Grid>
          {/* Note */}
          <Grid item>
            <IconButton
              onClick={() => window.open('https://note.com/あなたのアカウント', '_blank')}
              color="primary"
            >
              <NoteIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default Home;