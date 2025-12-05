// src/pages/Menu.jsx
import React from 'react'
import { Container, Paper, Typography, Box } from '@mui/material'
import { Helmet } from 'react-helmet-async'

function Menu() {
  return (
    <>
      <Helmet>
        <title>料金・ドリンクメニュー</title>
        <link rel="canonical" href="https://gamecafe-level.com/menu" />
        <meta
          name="description"
          content="平日/土日祝の利用料金やワンドリンク制の案内、アルコール・ソフトドリンクメニューを掲載。行徳駅徒歩数分のボードゲーム＆麻雀カフェ。"
        />
      </Helmet>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            メニュー
          </Typography>
          <Typography variant="body1" paragraph>
            当店のフードメニュー・ドリンクメニュー・プレイ料金などを一覧にまとめています。
          </Typography>
        </Paper>

        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              プレイ料金
            </Typography>
            <Typography variant="body1">
              30分 300円 ／ 4時間パック 1,200円 ／ 1日パック 2,400円
              <br />
              ワンドリンク制 (ソフトドリンク 300円 / アルコール 500円)
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              ドリンクメニュー
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              ALL 500円 (アルコール系)
            </Typography>
            <Typography variant="body1">
              <strong>Highball</strong>
              <br />
              ・角ハイボール
              <br />
              ・ビームハイボール
              <br />
              <br />
              <strong>Cocktail</strong>
              <br />
              ・カシスオレンジ / カシスソーダ / ジントニック / パライングレープフルーツ /
              チャイナブルー / ピーチウーロン / ピーチグレープフルーツ / カルーアミルク /
              カルーアオレンジ / マリブコーク / マリブオレンジ / マリブサーフ / スクリュードライバー
              / ブルドッグ / テキーラ(ショット) / イエガーマイスター(ショット) /
              <br />
              <br />
              <strong>Whisky</strong>
              <br />
              ・角 (ロック/ソーダ/水割り)
              <br />
              ・ジムビーム
              <br />
              <br />
              <strong>Wine</strong>
              <br />
              ・グラスワイン (赤/白)
              <br />
              <br />
              <strong>Plum-Wine (梅酒)</strong>
              <br />
              ・ロック / ソーダ
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              ALL 300円 (ソフトドリンク)
            </Typography>
            <Typography variant="body1">
              ・オレンジジュース / ジンジャーエール / コーラ / メロンソーダ / トマトジュース /
              アップルジュース / ウーロン茶 / 緑茶 / コーヒー
            </Typography>
          </Paper>
        </Box>

        {/* 今後、軽食やフードメニューを追加する余地があれば... */}
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1">
              現在フードメニューはございませんが、隣のインドカレー屋さんやUber
              Eats等をご利用ください。
            </Typography>
          </Paper>
        </Box>
      </Container>
    </>
  )
}

export default Menu
