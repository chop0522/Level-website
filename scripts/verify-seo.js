const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const buildDir = path.join(projectRoot, 'build')
const targetArg = process.argv[2] || ''
const remoteBase = targetArg ? targetArg.replace(/\/$/, '') : ''
const localPort = process.env.SEO_VERIFY_PORT || '4110'

const publicPaths = ['/', '/menu/', '/access/', '/faq/', '/equipment/', '/reservation/']
const redirectPairs = [
  ['/menu', '/menu/'],
  ['/access', '/access/'],
  ['/faq', '/faq/'],
  ['/equipment', '/equipment/'],
  ['/reservation', '/reservation/'],
]
const requiredStrings = [
  'ゲームカフェ.Level',
  '千葉県市川市湊新田2-1-18',
  '#localbusiness',
  '#organization',
  '#website',
  'canonical',
  'https://www.googletagmanager.com/gtag/js?id=AW-18011386164',
  "gtag('config', 'AW-18011386164')",
]
const requiredRobotsLines = [
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
  'Sitemap: https://gamecafe-level.com/sitemap.xml',
]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function readFile(filePath) {
  assert(fs.existsSync(filePath), `Missing file: ${filePath}`)
  return fs.readFileSync(filePath, 'utf8')
}

function verifyHtml(html, routePath, label) {
  assert(
    !html.includes('You need to enable JavaScript to run this app.'),
    `${label} ${routePath} still contains the CRA placeholder`
  )

  for (const required of requiredStrings) {
    assert(html.includes(required), `${label} ${routePath} is missing "${required}"`)
  }

  assert(html.includes('/menu/'), `${label} ${routePath} is missing the menu link`)
  assert(html.includes('/access/'), `${label} ${routePath} is missing the access link`)
  assert(html.includes('/faq/'), `${label} ${routePath} is missing the FAQ link`)
  assert(html.includes('/reservation/'), `${label} ${routePath} is missing the reservation link`)
}

async function fetchText(url) {
  const response = await fetch(url)
  assert(response.ok, `Request failed: ${url} (${response.status})`)
  return response.text()
}

async function fetchResponse(url, options) {
  const response = await fetch(url, options)
  assert(response.ok, `Request failed: ${url} (${response.status})`)
  return response
}

function verifyRobotsTxtContent(robots, label) {
  assert(robots.includes('\n'), `${label} robots.txt does not contain literal newlines`)

  const normalized = robots.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n').filter(Boolean)

  for (const line of requiredRobotsLines) {
    assert(lines.includes(line), `${label} robots.txt is missing "${line}"`)
  }

  const disallowLines = lines.filter((line) => line.startsWith('Disallow: '))
  assert(disallowLines.length >= 7, `${label} robots.txt is missing Disallow directives`)
}

async function verifyRedirect(baseUrl, fromPath, toPath, label) {
  const response = await fetch(`${baseUrl}${fromPath}`, { redirect: 'manual' })
  assert(
    [301, 302, 307, 308].includes(response.status),
    `${label} ${fromPath} did not redirect to the canonical URL`
  )

  const location = response.headers.get('location') || ''
  assert(
    location.endsWith(toPath),
    `${label} ${fromPath} redirected to "${location}" instead of "${toPath}"`
  )
}

function verifyBuildArtifacts() {
  const buildFiles = [
    path.join(buildDir, 'index.html'),
    path.join(buildDir, 'menu', 'index.html'),
    path.join(buildDir, 'access', 'index.html'),
    path.join(buildDir, 'faq', 'index.html'),
    path.join(buildDir, 'equipment', 'index.html'),
    path.join(buildDir, 'reservation', 'index.html'),
  ]

  for (const filePath of buildFiles) {
    const html = readFile(filePath)
    verifyHtml(html, filePath.replace(`${buildDir}/`, ''), 'build')
  }

  const robots = readFile(path.join(buildDir, 'robots.txt'))
  const sitemap = readFile(path.join(buildDir, 'sitemap.xml'))
  verifyRobotsTxtContent(robots, 'build')
  assert(sitemap.includes('<urlset'), 'build sitemap.xml is not valid XML')
}

function waitForReady(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Timed out waiting for the local SEO server')),
      15000
    )

    child.stdout.on('data', (chunk) => {
      const text = String(chunk)
      if (text.includes('Server running on port')) {
        clearTimeout(timeout)
        resolve()
      }
    })

    child.stderr.on('data', (chunk) => {
      const text = String(chunk)
      if (text.trim()) {
        process.stderr.write(text)
      }
    })

    child.on('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`Local SEO server exited early with code ${code}`))
    })
  })
}

async function verifyHttpBase(baseUrl, label) {
  for (const routePath of publicPaths) {
    const html = await fetchText(`${baseUrl}${routePath}`)
    verifyHtml(html, routePath, label)
  }

  for (const [fromPath, toPath] of redirectPairs) {
    await verifyRedirect(baseUrl, fromPath, toPath, label)
  }

  const robotsResponse = await fetchResponse(`${baseUrl}/robots.txt`)
  const robotsContentType = robotsResponse.headers.get('content-type') || ''
  assert(
    robotsContentType.includes('text/plain'),
    `${label} robots.txt is not served as plain text`
  )
  const robots = await robotsResponse.text()
  verifyRobotsTxtContent(robots, label)

  const sitemap = await fetchText(`${baseUrl}/sitemap.xml`)
  assert(sitemap.includes('<urlset'), `${label} sitemap.xml is not valid XML`)
}

async function verifyLocalServer() {
  const child = spawn('node', ['server.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: localPort },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  try {
    await waitForReady(child)
    await verifyHttpBase(`http://localhost:${localPort}`, 'local')
  } finally {
    child.kill('SIGINT')
  }
}

async function main() {
  if (!remoteBase) {
    verifyBuildArtifacts()
    await verifyLocalServer()
    console.log('SEO verification passed for build artifacts and local HTTP routes')
    return
  }

  await verifyHttpBase(remoteBase, 'remote')
  console.log(`SEO verification passed for ${remoteBase}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
