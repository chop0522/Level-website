const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const buildDir = path.join(projectRoot, 'build')
const targetArg = process.argv[2] || ''
const remoteBase = targetArg ? targetArg.replace(/\/$/, '') : ''
const localPort = process.env.SEO_VERIFY_PORT || '4110'

const publicPaths = ['/', '/menu', '/access', '/faq', '/equipment', '/reservation']
const requiredStrings = [
  'ゲームカフェ.Level',
  '千葉県市川市湊新田2-1-18',
  '#localbusiness',
  '#organization',
  '#website',
  'canonical',
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

  assert(html.includes('/menu'), `${label} ${routePath} is missing the menu link`)
  assert(html.includes('/access'), `${label} ${routePath} is missing the access link`)
  assert(html.includes('/faq'), `${label} ${routePath} is missing the FAQ link`)
  assert(html.includes('/reservation'), `${label} ${routePath} is missing the reservation link`)
}

async function fetchText(url) {
  const response = await fetch(url)
  assert(response.ok, `Request failed: ${url} (${response.status})`)
  return response.text()
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
  assert(
    robots.includes('Sitemap: https://gamecafe-level.com/sitemap.xml'),
    'build robots.txt is missing the sitemap line'
  )
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

  const robots = await fetchText(`${baseUrl}/robots.txt`)
  assert(
    robots.includes('Sitemap: https://gamecafe-level.com/sitemap.xml'),
    `${label} robots.txt is missing the sitemap line`
  )

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
