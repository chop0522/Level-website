const fs = require('fs')
const path = require('path')
const businessInfo = require('../src/config/businessInfo.json')
const sitePages = require('../src/config/sitePages.json')

const publicNavLinks = [
  { href: '/', label: 'ホーム' },
  { href: '/menu', label: 'メニュー' },
  { href: '/access', label: 'アクセス・店舗情報' },
  { href: '/faq', label: 'FAQ' },
  { href: '/reservation', label: '予約案内' },
]

const menuSections = {
  playPricing: [
    {
      label: '平日',
      items: ['30分 300円', '4時間パック 1,200円', '1日パック 2,400円'],
    },
    {
      label: '土日祝日',
      items: ['30分 400円', '4時間パック 1,600円', '1日パック 2,800円'],
    },
  ],
  softDrinks: {
    '450円': ['ホットカフェオレ'],
    '400円': ['カフェオレ', 'ホットココア'],
    '350円': [
      'ホットミルク',
      'ホットウーロン',
      'ホット緑茶',
      'オレンジジュース',
      'コーヒー',
      'トマトジュース',
    ],
    '300円': [
      'アップル',
      'ジンジャーエール',
      'コーラ',
      'メロンソーダ',
      'ウーロン茶',
      '緑茶',
      'ミルク',
    ],
  },
  alcohol: {
    '3,500円': ['スパークリングワイン（ボトル）'],
    '1,050円': ['エルディンガーヴァイスビール（瓶）'],
    '950円': ['コロナビール（瓶）'],
    '850円': ['カルスバーグビール（瓶）'],
    '600円': ['ホワイトルシアン', 'ブラッディマリー'],
    '550円': [
      '角（ハイボール / 水割り / ロック）',
      'カシスオレンジ',
      'カシスウーロン',
      'カシスソーダ',
      'カシスアップル',
      'カシスジンジャー',
      'カシスミルク',
      'パライソオレンジ',
      'ライチグレープティー',
      'ファジーネーブル',
      'ピーチウーロン',
      'ピーチフィズ',
      'ピーチジンジャー',
      'スクリュードライバー',
      'ジントニック',
      'ジンバック',
      'モスコミュール',
    ],
    '500円': [
      'ジムビーム（ハイボール / 水割り / ロック）',
      'レモンサワー',
      'テキーラショット',
      'イェーガーマイスターショット',
      'ラムショット',
      '梅酒（ロック / ソーダ）',
      'グラスワイン（白 / 赤）',
      'ウーロンハイ',
      '緑茶ハイ',
      'タコハイ',
    ],
  },
}

const faqSections = [
  {
    title: '料金関連',
    paragraphs: [
      '平日30分300円、土日祝日30分400円、平日4時間パック1200円、土日祝日4時間パック1600円、平日1日パック2400円、土日祝日1日パック2800円です。',
      'ワンドリンク制は、入店時にソフトドリンク（300円）またはアルコール（500円）をご注文いただく仕組みです。',
      '貸切プランは平日2時間20,000円 / 4時間30,000円、土日祝日9:00 - 12:30は30,000円です。',
    ],
  },
  {
    title: '予約方法',
    paragraphs: [
      '公式LINE・当サイトの予約フォーム・オープンチャット・X の DM・ホットペッパーで予約できます。',
      '当日の飛び込み来店も可能ですが、席が埋まっている場合はお待ちいただくことがあります。',
    ],
  },
  {
    title: '飲食関連',
    paragraphs: [
      '食べ物は持ち込み可能ですが、飲み物の持ち込みはできません。',
      'アルコール提供があり、フードメニューはありません。隣のインドカレー屋さんや Uber Eats などをご利用ください。',
    ],
  },
  {
    title: '問い合わせ',
    paragraphs: [
      'その他の問い合わせは公式LINEからお願いします。',
      `電話番号: ${businessInfo.telephone}（LINE優先）`,
    ],
  },
]

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function normalizePath(routePath = '/') {
  if (!routePath || routePath === '/') {
    return '/'
  }

  return routePath.endsWith('/') ? routePath.slice(0, -1) : routePath
}

function absoluteUrl(routePath = '/') {
  const base = trimTrailingSlash(businessInfo.siteUrl)
  const normalized = normalizePath(routePath)
  return normalized === '/' ? `${base}/` : `${base}${normalized}`
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getPageByPath(routePath) {
  const normalized = normalizePath(routePath)
  return Object.entries(sitePages).find(([, page]) => page.path === normalized) || null
}

function buildLocalBusinessJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${trimTrailingSlash(businessInfo.siteUrl)}/#localbusiness`,
    name: businessInfo.name,
    url: businessInfo.siteUrl,
    address: {
      '@type': 'PostalAddress',
      postalCode: businessInfo.address.postalCode,
      addressCountry: businessInfo.address.addressCountry,
      addressRegion: businessInfo.address.addressRegion,
      addressLocality: businessInfo.address.addressLocality,
      streetAddress: businessInfo.address.streetAddress,
    },
    sameAs: businessInfo.sameAs,
    description: businessInfo.description,
    menu: businessInfo.menuUrl,
  }

  if (businessInfo.telephone) {
    data.telephone = businessInfo.telephone
  }

  if (businessInfo.defaultOgImage) {
    data.image = absoluteUrl(businessInfo.defaultOgImage)
  }

  if (Array.isArray(businessInfo.openingHours) && businessInfo.openingHours.length > 0) {
    data.openingHoursSpecification = businessInfo.openingHours.map((item) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: item.schemaDays,
      opens: item.opens,
      closes: item.closes,
    }))
  }

  return data
}

function buildOrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${trimTrailingSlash(businessInfo.siteUrl)}/#organization`,
    name: businessInfo.name,
    url: businessInfo.siteUrl,
    sameAs: businessInfo.sameAs,
    address: {
      '@type': 'PostalAddress',
      postalCode: businessInfo.address.postalCode,
      addressCountry: businessInfo.address.addressCountry,
      addressRegion: businessInfo.address.addressRegion,
      addressLocality: businessInfo.address.addressLocality,
      streetAddress: businessInfo.address.streetAddress,
    },
  }

  if (businessInfo.logoPath) {
    data.logo = absoluteUrl(businessInfo.logoPath)
  }

  return data
}

function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${trimTrailingSlash(businessInfo.siteUrl)}/#website`,
    url: businessInfo.siteUrl,
    name: businessInfo.name,
    inLanguage: 'ja-JP',
  }
}

function loadEntrypoints(buildDir) {
  const manifestPath = path.join(buildDir, 'asset-manifest.json')

  if (!fs.existsSync(manifestPath)) {
    return []
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  return Array.isArray(manifest.entrypoints) ? manifest.entrypoints : []
}

function buildAssetTags(buildDir) {
  const entrypoints = loadEntrypoints(buildDir)
  const css = entrypoints
    .filter((entry) => entry.endsWith('.css'))
    .map((entry) => `<link rel="stylesheet" href="/${entry}">`)
    .join('')
  const js = entrypoints
    .filter((entry) => entry.endsWith('.js'))
    .map((entry) => `<script defer src="/${entry}"></script>`)
    .join('')

  return { css, js }
}

function renderList(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function renderNav() {
  return `
    <nav class="seo-nav" aria-label="主要ナビゲーション">
      ${publicNavLinks
        .map((link) => `<a class="seo-nav-link" href="${link.href}">${escapeHtml(link.label)}</a>`)
        .join('')}
    </nav>
  `
}

function renderFooter() {
  const openingHours = businessInfo.openingHours
    .map((item) => `${item.label} ${item.opens} - ${item.closes}`)
    .join(' / ')

  return `
    <footer class="seo-footer">
      <section>
        <h2>${escapeHtml(businessInfo.name)}</h2>
        <address>
          ${escapeHtml(businessInfo.displayAddress)}<br>
          <a href="${escapeHtml(businessInfo.siteUrl)}">${escapeHtml(businessInfo.siteUrl)}</a>
        </address>
        ${businessInfo.telephone ? `<p>電話: ${escapeHtml(businessInfo.telephone)}</p>` : ''}
        <p>営業時間: ${escapeHtml(openingHours)} / ${escapeHtml(businessInfo.closedDayNote)}</p>
      </section>
      <nav aria-label="フッターリンク">
        ${publicNavLinks
          .map(
            (link) => `<a class="seo-nav-link" href="${link.href}">${escapeHtml(link.label)}</a>`
          )
          .join('')}
      </nav>
      <section>
        <h2>公式SNS</h2>
        <a class="seo-nav-link" href="${escapeHtml(businessInfo.xUrl)}">X</a>
        <a class="seo-nav-link" href="${escapeHtml(businessInfo.instagramUrl)}">Instagram</a>
        <a class="seo-nav-link" href="${escapeHtml(businessInfo.lineUrl)}">LINE予約</a>
      </section>
    </footer>
  `
}

function renderHomeContent() {
  const openingHours = businessInfo.openingHours
    .map((item) => `${item.label} ${item.opens} - ${item.closes}`)
    .join(' / ')

  return `
    <section class="seo-card">
      <h1>${escapeHtml(businessInfo.name)}</h1>
      <p>${escapeHtml(businessInfo.description)}</p>
      <p>公式URL: <a href="${escapeHtml(businessInfo.siteUrl)}">${escapeHtml(businessInfo.siteUrl)}</a></p>
      <address>
        ${escapeHtml(businessInfo.displayAddress)}
      </address>
    </section>
    <section class="seo-card">
      <h2>営業情報</h2>
      <p>${escapeHtml(openingHours)} / ${escapeHtml(businessInfo.closedDayNote)}</p>
      <p>月曜祝日も営業しております。貸切でのご利用も可能です。</p>
    </section>
    <section class="seo-card">
      <h2>主要ページ</h2>
      <p><a href="/menu">メニューを見る</a> / <a href="/access">アクセス・店舗情報を見る</a> / <a href="/faq">FAQを見る</a></p>
    </section>
  `
}

function renderMenuContent() {
  const pricingHtml = menuSections.playPricing
    .map(
      (section) => `
        <section>
          <h3>${escapeHtml(section.label)}</h3>
          ${renderList(section.items)}
        </section>
      `
    )
    .join('')

  const softDrinkHtml = Object.entries(menuSections.softDrinks)
    .map(([price, items]) => `<h3>${escapeHtml(price)}</h3>${renderList(items)}`)
    .join('')

  const alcoholHtml = Object.entries(menuSections.alcohol)
    .map(([price, items]) => `<h3>${escapeHtml(price)}</h3>${renderList(items)}`)
    .join('')

  return `
    <section class="seo-card">
      <h1>メニュー</h1>
      <p>${escapeHtml(businessInfo.name)}の公式メニューページです。</p>
      <p><a href="${escapeHtml(businessInfo.menuUrl)}">${escapeHtml(businessInfo.menuUrl)}</a></p>
    </section>
    <section class="seo-card">
      <h2>プレイ料金</h2>
      ${pricingHtml}
      <p>ワンドリンク制（ソフトドリンク 300円 / アルコール 500円）</p>
    </section>
    <section class="seo-card">
      <h2>ドリンクメニュー</h2>
      <h3>ソフトドリンク</h3>
      ${softDrinkHtml}
      <h3>アルコール</h3>
      ${alcoholHtml}
      <p>価格はすべて税込表示です。</p>
    </section>
  `
}

function renderAccessContent() {
  const openingHours = businessInfo.openingHours
    .map((item) => `${item.label}: ${item.opens} - ${item.closes}`)
    .join(' / ')

  return `
    <section class="seo-card">
      <h1>アクセス・店舗情報</h1>
      <p>${escapeHtml(businessInfo.name)}の公式店舗情報ページです。</p>
      <address>
        ${escapeHtml(businessInfo.name)}<br>
        ${escapeHtml(businessInfo.displayAddress)}
      </address>
      <p>公式サイト: <a href="${escapeHtml(businessInfo.siteUrl)}">${escapeHtml(businessInfo.siteUrl)}</a></p>
      <p>電話番号: ${escapeHtml(businessInfo.telephone)}</p>
      <p>営業時間: ${escapeHtml(openingHours)} / ${escapeHtml(businessInfo.closedDayNote)}</p>
      <p><a href="${escapeHtml(businessInfo.googleMapsPlaceUrl)}">Google マップを見る</a></p>
    </section>
    <section class="seo-card">
      <h2>公式SNS</h2>
      <p><a href="${escapeHtml(businessInfo.xUrl)}">X</a> / <a href="${escapeHtml(
        businessInfo.instagramUrl
      )}">Instagram</a> / <a href="${escapeHtml(businessInfo.lineUrl)}">LINE予約</a></p>
    </section>
  `
}

function renderFaqContent() {
  return `
    <section class="seo-card">
      <h1>よくある質問</h1>
      <p>${escapeHtml(businessInfo.name)}に関する、よくある質問をまとめています。</p>
    </section>
    ${faqSections
      .map(
        (section) => `
          <section class="seo-card">
            <h2>${escapeHtml(section.title)}</h2>
            ${section.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}
          </section>
        `
      )
      .join('')}
  `
}

function renderEquipmentContent() {
  return `
    <section class="seo-card">
      <h1>設備紹介</h1>
      <p>${escapeHtml(businessInfo.name)}の店内設備や写真を紹介しています。</p>
      <ul>
        <li>4テーブル、椅子20席</li>
        <li>電源・Wi-Fi完備</li>
        <li>大型モニター貸出あり</li>
        <li>全自動麻雀卓 AMOS REX3</li>
      </ul>
    </section>
  `
}

function renderReservationContent() {
  return `
    <section class="seo-card">
      <h1>予約案内</h1>
      <p>予約は公式LINEから承っております。</p>
      <p><a href="${escapeHtml(businessInfo.lineUrl)}">LINEで予約する</a></p>
      <p>ご連絡の際は、お名前・ご希望日時・人数・電話番号・その他ご要望を添えていただくとスムーズです。</p>
    </section>
  `
}

function renderPageContent(pageKey) {
  switch (pageKey) {
    case 'home':
      return renderHomeContent()
    case 'menu':
      return renderMenuContent()
    case 'access':
      return renderAccessContent()
    case 'faq':
      return renderFaqContent()
    case 'equipment':
      return renderEquipmentContent()
    case 'reservation':
      return renderReservationContent()
    default:
      return ''
  }
}

function renderPublicPageHtml(routePath, options = {}) {
  const pageEntry = getPageByPath(routePath)

  if (!pageEntry) {
    return null
  }

  const [pageKey, page] = pageEntry
  const buildDir = options.buildDir || path.join(process.cwd(), 'build')
  const { css, js } = buildAssetTags(buildDir)
  const verificationToken = options.googleSiteVerification || ''
  const canonical = absoluteUrl(page.path)
  const siteImage = absoluteUrl(businessInfo.defaultOgImage)
  const jsonLd = [buildLocalBusinessJsonLd(), buildOrganizationJsonLd(), buildWebsiteJsonLd()]

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
    <meta name="format-detection" content="telephone=no">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${escapeHtml(businessInfo.name)}">
    <meta property="og:title" content="${escapeHtml(page.title)}">
    <meta property="og:description" content="${escapeHtml(page.description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${escapeHtml(siteImage)}">
    <meta property="og:locale" content="ja_JP">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(page.title)}">
    <meta name="twitter:description" content="${escapeHtml(page.description)}">
    <meta name="twitter:image" content="${escapeHtml(siteImage)}">
    ${verificationToken ? `<meta name="google-site-verification" content="${escapeHtml(verificationToken)}">` : ''}
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    ${jsonLd
      .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
      .join('')}
    <style>
      body{margin:0;font-family:"Noto Sans JP",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f6f8fb;color:#1f2937}
      a{color:#0b5ea8}
      .seo-shell{max-width:1120px;margin:0 auto;padding:24px 16px 48px}
      .seo-header{display:flex;flex-direction:column;gap:16px;margin-bottom:24px}
      .seo-brand{font-size:1.6rem;font-weight:700;color:#153047;text-decoration:none}
      .seo-nav{display:flex;flex-wrap:wrap;gap:12px}
      .seo-nav-link{text-decoration:none;font-weight:600}
      .seo-main{display:grid;gap:20px}
      .seo-card{background:#fff;border:1px solid #d8e0ea;border-radius:16px;padding:24px;box-shadow:0 8px 24px rgba(15,23,42,.06)}
      .seo-card h1,.seo-card h2,.seo-card h3{margin:0 0 12px;color:#153047}
      .seo-card p,.seo-card li,.seo-card address{line-height:1.8}
      .seo-card ul{margin:0;padding-left:20px}
      .seo-card address{font-style:normal}
      .seo-footer{display:grid;gap:20px;background:#fff;border:1px solid #d8e0ea;border-radius:16px;padding:24px;margin-top:24px}
      .seo-footer h2{margin:0 0 10px;color:#153047}
      .seo-footer address,.seo-footer p{margin:0;line-height:1.8;font-style:normal}
      @media (min-width: 768px){.seo-footer{grid-template-columns:2fr 1fr 1fr}}
    </style>
    ${css}
  </head>
  <body>
    <noscript>${escapeHtml(businessInfo.name)}の基本情報をこのページで確認できます。</noscript>
    <div id="root">
      <div class="seo-shell">
        <header class="seo-header">
          <a class="seo-brand" href="/">${escapeHtml(businessInfo.name)}</a>
          ${renderNav()}
        </header>
        <main id="main-content" class="seo-main">
          ${renderPageContent(pageKey)}
        </main>
        ${renderFooter()}
      </div>
    </div>
    ${js}
  </body>
</html>`
}

function buildRobotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /mypage',
    'Disallow: /mypage/',
    'Disallow: /login',
    'Disallow: /signup',
    'Disallow: /achievements',
    'Disallow: /mahjong',
    'Disallow: /mahjong/',
    'Disallow: /qr',
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
  ].join('\n')
}

function buildSitemapXml() {
  const today = new Date().toISOString().slice(0, 10)
  const urls = Object.values(sitePages)
    .filter((page) => page.includeInSitemap)
    .map(
      (page) => `
  <url>
    <loc>${escapeHtml(absoluteUrl(page.path))}</loc>
    <lastmod>${today}</lastmod>
  </url>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`
}

module.exports = {
  buildRobotsTxt,
  buildSitemapXml,
  renderPublicPageHtml,
  getPageByPath,
}
