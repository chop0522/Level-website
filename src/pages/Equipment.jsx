import React from 'react'
import { Container, Paper, Typography, Box } from '@mui/material'
import { Helmet } from 'react-helmet-async'
import ImageWithFallback from '../components/ImageWithFallback'

// 店内写真（jpg ＋ webp）
import mahjongJpg from '../assets/images/mahjong_table.jpg'
import mahjongWebp from '../assets/images/mahjong_table.webp'
import shelfCloseJpg from '../assets/images/boardgame_shelves_close.jpg'
import shelfCloseWebp from '../assets/images/boardgame_shelves_close.webp'
import shelfAngleJpg from '../assets/images/boardgame_shelves_angle.jpg'
import shelfAngleWebp from '../assets/images/boardgame_shelves_angle.webp'
import cafeInteriorJpg from '../assets/images/cafe_interior.jpg'
import cafeInteriorWebp from '../assets/images/cafe_interior.webp'
import cafeExteriorJpg from '../assets/images/cafe_exterior.jpg'
import cafeExteriorWebp from '../assets/images/cafe_exterior.webp'

function Equipment() {
  return (
    <>
      <Helmet>
        <title>設備紹介</title>
        <link rel="canonical" href="https://gamecafe-level.com/equipment" />
        <meta
          name="description"
          content="全自動麻雀卓 AMOS REX3 や大型モニター、電源・Wi-Fi完備の店内設備とボードゲーム棚の写真を掲載しています。行徳駅近くのゲームカフェ。"
        />
      </Helmet>
      <Container sx={{ mt: 4, mb: 4 }}>
        {/* --- 店内設備 --- */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            店内設備
          </Typography>
          <Typography variant="body1" paragraph>
            ・4テーブル、椅子20席
            <br />
            ・電源＆Wi-Fi完備
            <br />
            ・大型モニター貸出あり
            <br />
            ・最新全自動雀卓 AMOS REX3
          </Typography>

          {/* 今後、写真を追加する場所 (例: テーブル・椅子写真) */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {/* 写真の説明をここに入れる */}
              テーブル・椅子のイメージ
            </Typography>
            <ImageWithFallback
              webp={mahjongWebp}
              src={mahjongJpg}
              alt="最新全自動雀卓 AMOS REX3"
              style={{ width: '100%', height: 'auto', borderRadius: 8 }}
            />
          </Box>

          {/* 大型モニターや雀卓の写真を追加するなら下記を複製 */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              大型モニター / 全自動雀卓イメージ
            </Typography>
            {/* 例: <img src={monitorPhoto} alt="大型モニター" style={{ maxWidth: '100%' }} /> */}
            <ImageWithFallback
              webp={cafeInteriorWebp}
              src={cafeInteriorJpg}
              alt="店内レイアウトと大型モニター"
              style={{ width: '100%', height: 'auto', borderRadius: 8 }}
            />
          </Box>
        </Paper>

        {/* --- 特徴・ウリ --- */}
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              特徴
            </Typography>
            <Typography variant="body1" paragraph>
              ・ボードゲームは1000種類以上！
              <br />
              ・ボードゲーム以外にも、麻雀、ポーカー、クイズ、謎解き、マーダーミステリーなど多彩に遊べる
              <br />
            </Typography>

            {/* 特徴や内装写真を追加 */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                内装イメージ / ボードゲーム棚など
              </Typography>
              <ImageWithFallback
                webp={shelfCloseWebp}
                src={shelfCloseJpg}
                alt="店内ボードゲーム棚"
                style={{ width: '100%', height: 'auto', borderRadius: 8 }}
              />
            </Box>

            {/* 角度違いのボードゲーム棚写真 */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ボードゲーム棚（別アングル）
              </Typography>
              <ImageWithFallback
                webp={shelfAngleWebp}
                src={shelfAngleJpg}
                alt="店内ボードゲーム棚 別アングル"
                style={{ width: '100%', height: 'auto', borderRadius: 8 }}
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
              ・最寄り駅：東京メトロ東西線「行徳駅」
              <br />
              ・近隣の駐車場：コインパーキングを利用可
            </Typography>

            {/* アクセス写真(外観,看板など) */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                店舗外観 / 看板イメージ
              </Typography>
              <ImageWithFallback
                webp={cafeExteriorWebp}
                src={cafeExteriorJpg}
                alt="店舗外観"
                style={{ width: '100%', height: 'auto', borderRadius: 8 }}
              />
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
              ・広いスペースを全面的に使え、大人数でのボードゲームやイベントが可能
              <br />
              ・大型モニターや最新全自動雀卓（AMOS REX3）も利用可
            </Typography>
          </Paper>
        </Box>
      </Container>
    </>
  )
}

export default Equipment
