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
          <Typography variant="h4" component="h1" gutterBottom>
            メニュー
          </Typography>
          <Typography variant="body1" paragraph>
            当店のフードメニュー・ドリンクメニュー・プレイ料金などを一覧にまとめています。
          </Typography>
        </Paper>

        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              プレイ料金
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {`平日
30分 300円
4時間パック 1,200円
1日パック 2,400円

土日祝日
30分 400円
4時間パック 1,600円
1日パック 2,800円

ワンドリンク制 `}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              ドリンクメニュー
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              ソフトドリンク
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {`ホットカフェオレ　450円
カフェオレ　400円
ホットココア　400円

350円
ホットミルク
ホットウーロン
ホット緑茶
オレンジジュース
コーヒー
トマトジュース

300円
アップル
ジンジャーエール
コーラ
メロンソーダ
ウーロン茶
緑茶
ミルク`}
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
              アルコール
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {`スパークリングワイン　3,500円
（ボトル）

エルディンガーヴァイスビール（瓶）　1,050円
コロナビール（瓶）　950円
カルスバーグビール（瓶）　850円

角　550円
（ハイボール/水割り/ロック）

ジムビーム　500円
（ハイボール/水割り/ロック）

レモンサワー　500円

カクテル 600円
ホワイトルシアン　／　ブラッディマリー

カクテル 550円
カシスオレンジ
カシスウーロン
カシスソーダ
カシスアップル
カシスジンジャー
カシスミルク
パライソオレンジ
ライチグレープティー
ファジーネーブル
ピーチウーロン
ピーチフィズ
ピーチジンジャー
スクリュードライバー
ジントニック
ジンバック
モスコミュール

500円
テキーラショット
イェーガーマイスターショット
ラムショット
梅酒（ロック/ソーダ）
グラスワイン（白/赤）
ウーロンハイ
緑茶ハイ
タコハイ`}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              ※価格はすべて税込表示です
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
