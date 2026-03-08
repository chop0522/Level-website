const fs = require('fs')
const path = require('path')
const sitePages = require('../src/config/sitePages.json')
const { renderPublicPageHtml } = require('../utils/seoShell')

const projectRoot = path.join(__dirname, '..')
const buildDir = path.join(projectRoot, 'build')

if (!fs.existsSync(buildDir)) {
  throw new Error('build directory not found. Run the React build first.')
}

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION || ''

for (const page of Object.values(sitePages)) {
  const html = renderPublicPageHtml(page.path, { buildDir, googleSiteVerification })

  if (!html) {
    throw new Error(`Failed to prerender ${page.path}`)
  }

  const outputPath =
    page.path === '/'
      ? path.join(buildDir, 'index.html')
      : path.join(buildDir, page.path.replace(/^\//, ''), 'index.html')

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, html, 'utf8')
}

console.log('Generated prerendered SEO HTML for public pages')
