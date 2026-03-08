import React from 'react'
import { Box, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

const defaultLinks = [
  { to: '/menu', label: 'メニュー' },
  { to: '/access', label: 'アクセス・店舗情報' },
  { to: '/faq', label: 'FAQ' },
  { to: '/reservation', label: '予約案内' },
]

function PublicPageLinks({ title = '関連ページ', links = defaultLinks, sx }) {
  return (
    <Box component="nav" aria-label={title} sx={sx}>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {links.map((link) => (
          <Link key={link.to} component={RouterLink} to={link.to} underline="hover">
            {link.label}
          </Link>
        ))}
      </Box>
    </Box>
  )
}

export default PublicPageLinks
