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
ゲームカフェ.Levelへようこそ！
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
            1000種類以上のボードゲームを取り揃えております。お一人様での相席、グループでのご来店も大歓迎です！
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
            平日 15:00 - 24:00 / 土日祝 13:00 - 24:00 / 定休日：月曜
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {/* 料金プラン・予約方法など簡易情報 */}
            30分300円　4時間パック1,200円　1日パック2,400円　ワンドリンク制
            貸切プラン　平日2時間20,000円　4時間30,000円
            　　　　　　土日祝日　9時から12時30分　30,000円　※お時間はご相談ください
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
            src="https://glass-jade-d4c.notion.site/1b18fda9d98d80aa994fc8b3091c62d2?v=1b18fda9d98d809b8e87000ccca0a291"
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
          　千葉県市川市湊新田2−1−１８ビアメゾンロジェール１０１
          </Typography>
          <Box sx={{ mt: 2 }}>
            <iframe
              title="GoogleMap"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.867767207533!2d139.90914127620368!3d35.6802578300267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188768af217c7b%3A0x42dc8c85cafabf51!2z44Ky44O844Og44Kr44OV44KnLkxldmVs!5e0!3m2!1sja!2sjp!4v1741783603258!5m2!1sja!2sjp"
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
              onClick={() => window.open('https://x.com/GamecafeLevel', '_blank')}
              color="primary"
            >
              <XIcon />
            </IconButton>
          </Grid>
          {/* LINE */}
          <Grid item>
            <IconButton
              onClick={() => window.open('https://lin.ee/pyc6UjM', '_blank')}
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