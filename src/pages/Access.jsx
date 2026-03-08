import React from 'react'
import { Container, Paper, Typography, Box, Link } from '@mui/material'
import SeoHead from '../components/SeoHead'
import PublicPageLinks from '../components/PublicPageLinks'
import businessInfo from '../config/businessInfo.json'
import { buildLocalBusinessJsonLd, buildOrganizationJsonLd, buildWebsiteJsonLd } from '../lib/seo'

function Access() {
  const structuredData = [
    buildLocalBusinessJsonLd(),
    buildOrganizationJsonLd(),
    buildWebsiteJsonLd(),
  ]

  return (
    <>
      <SeoHead pageKey="access" structuredData={structuredData} />
      <Container sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            アクセス・店舗情報
          </Typography>
          <Typography variant="body1" paragraph>
            {businessInfo.name}の住所とアクセス情報を掲載しています。
          </Typography>
          <Box component="address" sx={{ fontStyle: 'normal', lineHeight: 1.8 }}>
            <Typography variant="body1">{businessInfo.name}</Typography>
            <Typography variant="body1">{businessInfo.displayAddress}</Typography>
            <Typography variant="body1">
              公式サイト: <Link href={businessInfo.siteUrl}>{businessInfo.siteUrl}</Link>
            </Typography>
            {businessInfo.telephone && (
              <Typography variant="body1">電話番号: {businessInfo.telephone}</Typography>
            )}
          </Box>
        </Paper>

        <Box component="section" sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              営業情報
            </Typography>
            {businessInfo.openingHours.map((item) => (
              <Typography key={item.label} variant="body1">
                {item.label}: {item.opens} - {item.closes}
              </Typography>
            ))}
            <Typography variant="body1" sx={{ mt: 1 }}>
              {businessInfo.closedDayNote}
            </Typography>
          </Paper>
        </Box>

        <Box component="section" sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              公式SNS
            </Typography>
            <Typography variant="body1">
              <Link href={businessInfo.xUrl} target="_blank" rel="noopener noreferrer">
                X
              </Link>
            </Typography>
            <Typography variant="body1">
              <Link href={businessInfo.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram
              </Link>
            </Typography>
            <Typography variant="body1">
              <Link href={businessInfo.lineUrl} target="_blank" rel="noopener noreferrer">
                LINE予約
              </Link>
            </Typography>
          </Paper>
        </Box>

        <Box component="section" sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              地図
            </Typography>
            <Typography variant="body2" paragraph>
              地図が表示されない場合は、上記住所または{' '}
              <Link
                href={businessInfo.googleMapsPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google マップ
              </Link>{' '}
              からご確認ください。
            </Typography>
            <Box sx={{ mt: 2 }}>
              <iframe
                title="ゲームカフェ.Level の地図"
                src={businessInfo.googleMapsEmbedUrl}
                width="100%"
                height="320"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Box>
          </Paper>
        </Box>

        <Paper sx={{ p: 3, mt: 4 }}>
          <PublicPageLinks />
        </Paper>
      </Container>
    </>
  )
}

export default Access
