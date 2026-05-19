import React from 'react'
import { Box, Button, Chip, Container, Grid, Link, Paper, Stack, Typography } from '@mui/material'
import SeoHead from '../components/SeoHead'
import businessInfo from '../config/businessInfo.json'

const playPricing = [
  {
    label: '平日',
    items: [
      ['30分', '300円'],
      ['4時間', '1,200円'],
      ['1日', '2,400円'],
    ],
  },
  {
    label: '土日祝',
    items: [
      ['30分', '400円'],
      ['4時間', '1,600円'],
      ['1日', '2,800円'],
    ],
  },
]

function XLanding() {
  const openingHoursLabel = businessInfo.openingHours
    .map((item) => `${item.label} ${item.opens} - ${item.closes}`)
    .join(' / ')

  return (
    <>
      <SeoHead pageKey="x" />
      <Box sx={{ bgcolor: '#fbfaf7' }}>
        <Container sx={{ py: { xs: 4, md: 6 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="body2" sx={{ color: '#0b4f4a', fontWeight: 700, mb: 1.5 }}>
                東西線行徳駅から徒歩5分
              </Typography>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 800, lineHeight: 1.18 }}>
                Xから来た方へ。初めてでも遊びやすいゲームカフェです。
              </Typography>
              <Typography variant="h6" component="p" sx={{ mt: 2, color: '#344050' }}>
                ボードゲーム未経験でも大丈夫。人数・時間・気分に合わせてゲームをご案内します。おひとり様、相席、会社帰り、飲み会後の少人数の二次会にも使えます。
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                <Button
                  component="a"
                  href={businessInfo.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  color="success"
                  size="large"
                >
                  LINEで空席確認・予約する
                </Button>
                <Button
                  component="a"
                  href={businessInfo.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="large"
                >
                  Xを見る
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box
                component="img"
                src="/x/assets/ogp-gamecafe-level.png"
                alt="ボードゲームを囲む卓上のビジュアル"
                sx={{
                  width: '100%',
                  display: 'block',
                  borderRadius: 1,
                  border: '1px solid #d9e1e8',
                  boxShadow: '0 18px 50px rgba(23, 32, 42, 0.12)',
                }}
              />
            </Grid>
          </Grid>
        </Container>

        <Container sx={{ pb: 4 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <InfoTile title="営業時間">{openingHoursLabel}</InfoTile>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoTile title="定休日">{businessInfo.closedDayNote}</InfoTile>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoTile title="場所">{businessInfo.displayAddress}</InfoTile>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoTile title="予約">公式LINEから空席確認・予約を承っています。</InfoTile>
            </Grid>
          </Grid>
        </Container>

        <Box component="section" sx={{ bgcolor: '#fff', py: 5 }}>
          <Container>
            <Typography variant="h4" component="h2" gutterBottom>
              初めての方へ
            </Typography>
            <Grid container spacing={2}>
              <GuideCard title="未経験でも大丈夫">
                ゲーム名を知らなくても問題ありません。人数と遊びたい雰囲気を聞いて、候補をご案内します。
              </GuideCard>
              <GuideCard title="ルール説明あり">
                初めての方にも、ルールの説明やおすすめボードゲームのご案内をしています。
              </GuideCard>
              <GuideCard title="短時間でも使えます">
                30分から遊べます。待ち合わせ前、会社帰り、二次会前後の短時間利用にも向いています。
              </GuideCard>
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ py: 5 }}>
          <Container>
            <Typography variant="h4" component="h2" gutterBottom>
              おひとり様・相席歓迎
            </Typography>
            <Grid container spacing={2}>
              <GuideCard title="一人で来ても相談できます">
                相席状況は日によって変わります。来店前に公式LINEで確認してもらえると案内しやすいです。
              </GuideCard>
              <GuideCard title="初対面でも入りやすく">
                相席の最初は、会話が自然に生まれ、1回が短いゲームから始めます。
              </GuideCard>
              <GuideCard title="初心者も歓迎">
                経験者だけの場ではありません。初めての方には、料金や遊び方から順番にご案内します。
              </GuideCard>
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ bgcolor: '#fff', py: 5 }}>
          <Container>
            <Typography variant="h4" component="h2" gutterBottom>
              会社帰り・二次会利用
            </Typography>
            <Grid container spacing={2}>
              <GuideCard title="平日夜にも使えます">
                仕事帰りに少しだけ遊ぶ、飲み会後に友人と集まる、といった使い方ができます。
              </GuideCard>
              <GuideCard title="カラオケ以外の選択肢">
                少人数でも会話が生まれやすく、人数や時間に合わせてゲームを変えられます。
              </GuideCard>
              <GuideCard title="空席確認が便利です">
                人数、時間、初めてかどうかを公式LINEで送ってください。席状況を確認してご案内します。
              </GuideCard>
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ py: 5 }}>
          <Container>
            <Typography variant="h4" component="h2" gutterBottom>
              料金
            </Typography>
            <Grid container spacing={2}>
              {playPricing.map((section) => (
                <Grid item xs={12} md={6} key={section.label}>
                  <Paper sx={{ p: 3, borderRadius: 1, height: '100%' }}>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {section.label}
                    </Typography>
                    <Stack spacing={1}>
                      {section.items.map(([label, price]) => (
                        <Box
                          key={label}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 2,
                            borderTop: '1px solid rgba(23,32,42,.12)',
                            pt: 1,
                          }}
                        >
                          <Typography>{label}</Typography>
                          <Typography fontWeight={700}>{price}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ワンドリンク制です。表示は税込です。
            </Typography>
          </Container>
        </Box>

        <Box component="section" sx={{ bgcolor: '#fff', py: 5 }}>
          <Container>
            <Typography variant="h4" component="h2" gutterBottom>
              アクセス
            </Typography>
            <Grid container spacing={2}>
              <GuideCard title="住所">{businessInfo.displayAddress}</GuideCard>
              <GuideCard title="最寄り駅">東京メトロ東西線 行徳駅から徒歩5分です。</GuideCard>
              <GuideCard title="地図">
                <Link
                  href={businessInfo.googleMapsPlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google マップで見る
                </Link>
              </GuideCard>
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ bgcolor: '#e4f4ef', py: 5 }}>
          <Container>
            <Paper sx={{ p: 3, borderRadius: 1, bgcolor: 'transparent', boxShadow: 'none' }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" component="h2" gutterBottom>
                    空席確認・予約
                  </Typography>
                  <Typography>
                    お名前、ご希望日時、人数、電話番号、その他ご要望を送っていただくとスムーズです。
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={1.5}>
                    <Button
                      component="a"
                      href={businessInfo.lineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      color="success"
                      size="large"
                    >
                      LINEで予約する
                    </Button>
                    <Button
                      component="a"
                      href={businessInfo.xUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="large"
                    >
                      Xを見る
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  )
}

function InfoTile({ title, children }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 1, minHeight: 112, height: '100%' }}>
      <Typography component="strong" sx={{ display: 'block', color: '#0b4f4a', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Paper>
  )
}

function GuideCard({ title, children }) {
  return (
    <Grid item xs={12} md={4}>
      <Paper sx={{ p: 2.5, borderRadius: 1, height: '100%' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Chip label={title} size="small" color="primary" variant="outlined" />
        </Stack>
        <Typography color="text.secondary">{children}</Typography>
      </Paper>
    </Grid>
  )
}

export default XLanding
