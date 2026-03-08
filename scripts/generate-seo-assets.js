const fs = require('fs')
const path = require('path')
const { buildRobotsTxt, buildSitemapXml } = require('../utils/seoShell')

const projectRoot = path.join(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')

fs.writeFileSync(path.join(publicDir, 'robots.txt'), `${buildRobotsTxt()}\n`, 'utf8')
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), `${buildSitemapXml()}\n`, 'utf8')

console.log('Generated public/robots.txt and public/sitemap.xml')
