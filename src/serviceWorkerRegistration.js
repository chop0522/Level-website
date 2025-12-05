/* src/serviceWorkerRegistration.js */
/* CRA の公式 Service Worker (Workbox) を有効化するユーティリティ */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  // [::1] = IPv6 localhost
  window.location.hostname === '[::1]' ||
  // 127.0.0.0/8 も localhost 扱い
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/)
)

export function register(config) {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    /* 開発中は登録しない */
    return
  }

  /**
   * CRA では %PUBLIC_URL% がビルド済み HTML 内で展開されますが、
   * Render などのホスティング環境ではパスが `/` で固定になるため
   * 明示的にルートを指す方が 404 → HTML レスポンス (text/html) 問題を回避できます。
   */
  // ビルド後ルートに配置した Service Worker ファイルを指す
  const swUrl = `/service-worker.js`

  if (isLocalhost) {
    // localhost では Service Worker の更新確認を行う
    checkValidServiceWorker(swUrl, config)
  } else {
    // 本番サーバー
    registerValidSW(swUrl, config)
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((reg) => {
      reg.onupdatefound = () => {
        const installing = reg.installing
        if (installing == null) return
        installing.onstatechange = () => {
          if (installing.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 旧 SW → 新 SW に切替可能
              console.log('New content is available; please refresh.')
              if (config && config.onUpdate) config.onUpdate(reg)
            } else {
              // オフラインキャッシュ完了
              console.log('Content is cached for offline use.')
              if (config && config.onSuccess) config.onSuccess(reg)
            }
          }
        }
      }
    })
    .catch((error) => console.error('SW registration failed:', error))
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type')
      if (response.status === 404 || (contentType && contentType.indexOf('javascript') === -1)) {
        // 404 の場合はいったん SW をリセット
        navigator.serviceWorker.ready
          .then((reg) => reg.unregister())
          .then(() => window.location.reload())
      } else {
        registerValidSW(swUrl, config)
      }
    })
    .catch(() => {
      console.log('No internet connection. App is running in offline mode.')
    })
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => reg.unregister())
  }
}
