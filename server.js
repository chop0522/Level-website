require('dotenv').config()
const express = require('express')
const compression = require('compression')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const path = require('path')
const { Pool } = require('pg')
const upload = require('./uploadConfig')
const { calcMahjongPoint } = require('./utils/mahjong')
const {
  buildRobotsTxt,
  buildSitemapXml,
  renderPublicPageHtml,
  getCanonicalPublicPath,
  getPageByPath,
} = require('./utils/seoShell')

const {
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES = '30d',
  QR_SECRET = 'qr_secret_change_me',
  PORT = 3001,
} = process.env

const poolConfig = DATABASE_URL ? { connectionString: DATABASE_URL } : {}
const pool = new Pool(poolConfig)

// Helpers & middlewares
const { createUserHelpers } = require('./routes/helpers/userHelpers')
const { createAuthMiddleware } = require('./routes/middlewares/auth')

// Routers
const createAuthRouter = require('./routes/auth')
const createUserRouter = require('./routes/user')
const createSocialRouter = require('./routes/social')
const createXpRouter = require('./routes/xp')
const createMahjongRouter = require('./routes/mahjong')
const createEventsRouter = require('./routes/events')
const createDeprecatedRouter = require('./routes/deprecated')
const createBreakoutRouter = require('./routes/breakout')

const userHelpers = createUserHelpers(pool)
const { authenticateToken, authenticateAdmin } = createAuthMiddleware({
  jwt,
  jwtSecret: JWT_SECRET,
  pool,
  findUserByEmail: userHelpers.findUserByEmail,
})

const app = express()
app.use(compression())
app.use(express.json())
app.use(cors())

// --- Auth ---
app.use(
  '/auth',
  createAuthRouter({
    jwt,
    bcrypt,
    jwtSecret: JWT_SECRET,
    jwtExpires: JWT_EXPIRES,
    findUserByEmail: userHelpers.findUserByEmail,
    createUserInDB: userHelpers.createUserInDB,
  })
)

// --- API (user/profile) ---
app.use(
  '/api',
  createUserRouter({
    pool,
    jwt,
    jwtSecret: JWT_SECRET,
    bcrypt,
    authenticateToken,
    authenticateAdmin,
    upload,
    findUserByEmail: userHelpers.findUserByEmail,
  })
)

// --- Social (highfive/friendship) ---
app.use(
  '/api',
  createSocialRouter({
    pool,
    authenticateToken,
  })
)

// --- XP / Achievements ---
app.use(
  '/api',
  createXpRouter({
    pool,
    jwt,
    qrSecret: QR_SECRET,
    authenticateToken,
  })
)

// --- Mahjong ---
app.use(
  '/api',
  createMahjongRouter({
    pool,
    authenticateToken,
    authenticateAdmin,
    calcMahjongPoint,
    findUserByName: userHelpers.findUserByName,
  })
)

// --- Events ---
app.use(
  '/api',
  createEventsRouter({
    pool,
    authenticateToken,
    authenticateAdmin,
  })
)

// --- Deprecated endpoints ---
app.use(
  '/api',
  createDeprecatedRouter({
    authenticateToken,
    authenticateAdmin,
  })
)

// --- Breakout ---
app.use(
  '/api/breakout',
  createBreakoutRouter({
    pool,
    authenticateToken,
  })
)

// --- SEO assets ---
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(buildRobotsTxt())
})

const NOINDEX_PATHS = [
  '/mypage',
  '/mypage/*',
  '/login',
  '/signup',
  '/achievements',
  '/mahjong',
  '/mahjong/*',
  '/qr',
]
app.get(NOINDEX_PATHS, (_req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow')
  res.set('Cache-Control', 'no-cache')
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.get('/sitemap.xml', (_req, res) => {
  try {
    res.type('application/xml').send(buildSitemapXml())
  } catch (err) {
    console.error(err)
    res.status(500).type('text/plain').send('sitemap error')
  }
})

// --- Static assets ---
app.use(
  express.static(path.join(__dirname, 'build'), {
    index: false,
    maxAge: '365d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }
    },
  })
)

app.get('*', (_req, res) => {
  const canonicalPath = getCanonicalPublicPath(_req.path)

  if (canonicalPath && canonicalPath !== _req.path) {
    const query = _req.url.includes('?') ? _req.url.slice(_req.url.indexOf('?')) : ''
    res.redirect(301, `${canonicalPath}${query}`)
    return
  }

  const pageEntry = getPageByPath(_req.path)

  if (pageEntry) {
    res.setHeader('Cache-Control', 'no-cache')
    res.type('html').send(
      renderPublicPageHtml(_req.path, {
        buildDir: path.join(__dirname, 'build'),
        googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || '',
      })
    )
    return
  }

  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

// --- Server start ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
