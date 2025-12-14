// src/services/api.js

const SERVER_URL = ''
/**
 * 汎用 fetch ラッパー
 * Usage:
 *   apiFetch('/api/mahjong/monthly')
 *   apiFetch('/api/mahjong/games', { method:'POST', body: JSON.stringify({...}) })
 *
 * - `opts.body` が FormData でない限り JSON を想定し、Content-Type を自動付与
 * - `localStorage.token` があれば Authorization ヘッダーを自動付与
 * - 成功時は JSON を返す（204 No Content の場合は null）
 * - 失敗時は throw Error
 */
export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token') || ''
  const headers =
    opts.body instanceof FormData
      ? { ...(opts.headers || {}), Authorization: token ? `Bearer ${token}` : undefined }
      : {
          'Content-Type': 'application/json',
          ...(opts.headers || {}),
          ...(token && { Authorization: `Bearer ${token}` }),
        }

  const res = await fetch(`${SERVER_URL}${path}`, { ...opts, headers })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}

// 既存モジュールとの互換のため default でも輸出
export default apiFetch
// 同じサーバーで運用なら ""
// 分ける場合は "http://localhost:3001" 等を指定

/**
 * 新規ユーザー登録
 * @param {object} param0 { name, email, password }
 * @returns {object} { success: boolean, token?: string, user?: object, error?: string }
 */
export async function registerUser({ name, email, password }) {
  try {
    const res = await fetch(`${SERVER_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || '登録に失敗しました' }
    }
    return data // { success: true, token, user }
  } catch (err) {
    console.error('Error in registerUser:', err)
    return { success: false, error: err.message }
  }
}

/**
 * ログイン (既存ユーザー)
 * @param {string} email
 * @param {string} password
 * @returns {object} { success: boolean, token?: string, user?: object, error?: string }
 */
export async function loginUser(email, password) {
  try {
    const res = await fetch(`${SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return await res.json()
  } catch (err) {
    console.error('Error in loginUser:', err)
    return { success: false, error: err.message }
  }
}

/**
 * ログイン中ユーザー情報を取得
 * @param {string} token JWTトークン
 * @returns {object} ユーザーデータ { id, name, email, role, ... } or { success: false, error?: string }
 */
export async function getUserInfo(token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return await res.json()
  } catch (err) {
    console.error('Error in getUserInfo:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 予約作成 [廃止]
 * 予約は公式LINEで運用しているため、このAPIは無効化しました。
 * 呼び出された場合は即座にエラーを返します。
 */
export async function createReservation() {
  console.warn('[deprecated] createReservation: 予約機能は廃止されました')
  return { success: false, error: '予約フォームは廃止しました。公式LINEからご予約ください。' }
}

/**
 * 予約一覧取得 (管理者) [廃止]
 */
export async function getAllReservations() {
  console.warn('[deprecated] getAllReservations: 予約機能は廃止されました')
  return { error: '予約管理は廃止しました（/admin も非表示）' }
}

/**
 * 予約削除 (管理者) [廃止]
 */
export async function deleteReservation() {
  console.warn('[deprecated] deleteReservation: 予約機能は廃止されました')
  return { success: false, error: '予約管理は廃止しました' }
}
// -----------------------------
// Profile (avatar & bio)
// -----------------------------

/**
 * プロフィールを取得 (bio など)
 * アバター画像は `/api/users/{id}/avatar` から取得してください
 * @param {string} token JWT
 * @returns {object} { id, name, bio } or { error }
 */
export async function getProfile(token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return await res.json()
  } catch (err) {
    console.error('Error in getProfile:', err)
    return { error: err.message }
  }
}

/**
 * プロフィールを更新 (name と/または bio)
 * @param {string} token JWT
 * @param {object} body  { name?, bio? }
 * @returns {object} { success: true, user } or { error }
 */
export async function updateProfile(token, body) {
  try {
    const res = await fetch(`${SERVER_URL}/api/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    return await res.json()
  } catch (err) {
    console.error('Error in updateProfile:', err)
    return { error: err.message }
  }
}

/**
 * アバター画像をアップロード
 * @param {string} token JWT
 * @param {File}   file  画像ファイル
 * @returns {object} { success: true } or { error }
 */
export async function uploadAvatar(token, file) {
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const res = await fetch(`${SERVER_URL}/api/upload-avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    return await res.json()
  } catch (err) {
    console.error('Error in uploadAvatar:', err)
    return { error: err.message }
  }
}

// -----------------------------
// Breakout mini game API
// -----------------------------

export async function getBreakoutStatus() {
  try {
    return await apiFetch('/api/breakout/status')
  } catch (err) {
    console.warn('getBreakoutStatus failed:', err?.message || err)
    return null
  }
}

export async function startBreakoutRun() {
  try {
    return await apiFetch('/api/breakout/start', { method: 'POST' })
  } catch (err) {
    return { error: err.message }
  }
}

export async function submitBreakoutRun(payload) {
  try {
    return await apiFetch('/api/breakout/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (err) {
    return { error: err.message }
  }
}

export async function getBreakoutLeaderboard(scope = 'all', limit = 50) {
  try {
    return await apiFetch(`/api/breakout/leaderboard?scope=${scope}&limit=${limit}`)
  } catch (err) {
    console.warn('getBreakoutLeaderboard failed:', err?.message || err)
    return { items: [], scope, limit }
  }
}

export async function getMyBreakoutHistory(limit = 20) {
  try {
    return await apiFetch(`/api/breakout/me?limit=${limit}`)
  } catch (err) {
    console.warn('getMyBreakoutHistory failed:', err?.message || err)
    return { best: null, runs: [], playsRemaining: 0 }
  }
}

/**
 * カテゴリXPを加算し、ランク/バッジ情報を取得
 * @param {string} token JWT
 * @param {string} category ('stealth'|'heavy'|'light'|'party'|'gamble'|'quiz')
 * @returns {object} {
 *   success:boolean,
 *   xpGain:number,
 *   currentXP:number,
 *   rank:number,
 *   label:string,
 *   badge_url:string,
 *   rankUp:boolean,
 *   next_required_xp:number|null,
 *   error?:string
 * }
 */
export async function gainXP(token, category) {
  try {
    const res = await fetch(`${SERVER_URL}/api/gameCategory`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category }),
    })
    return await res.json()
  } catch (err) {
    console.error('Error in gainXP:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 署名付きQRトークンをサーバーで検証してXPを付与
 * @param {string} token   JWT (ログインユーザー)
 * @param {string} qrToken QRに埋め込まれた署名JWT (t= の値)
 * @returns {object} サーバーレスポンス
 *   { success, xpGain, currentXP, rank, label, badge_url, rankUp, next_required_xp, error? }
 */
export async function claimQR(token, qrToken) {
  try {
    const res = await fetch(`${SERVER_URL}/api/qr/claim`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: qrToken }),
    })
    return await res.json()
  } catch (err) {
    console.error('Error in claimQR:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 総合ランク & 実績データを取得
 * @param {string} token JWT
 * @returns {object} { success, xp_total, totalRank, user } or { success:false, error }
 */
export async function getAchievements(token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return await res.json()
  } catch (err) {
    console.error('Error in getAchievements:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 公開ユーザー一覧を取得 (Leaderboard)
 * @param {string} sort  'total'|'stealth'|'heavy'|'light'|'party'|'gamble'|'quiz'
 * @param {number} limit 返却件数 (最大 200)
 * @returns {object} { success:boolean, users:array } or { error }
 */
export async function getUsers(sort = 'total', limit = 50) {
  try {
    const res = await fetch(`${SERVER_URL}/api/users?sort=${sort}&limit=${limit}`)
    return await res.json()
  } catch (err) {
    console.error('Error in getUsers:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 公開プロフィールを取得 (read-only)
 * @param {number} userId
 * @param {string} token (任意: private プロフ閲覧時に本人確認用)
 * @returns {object} { success:boolean, profile:object } or { error }
 */
export async function getPublicProfile(userId, token = '') {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch(`${SERVER_URL}/api/profile/${userId}`, { headers })
    return await res.json()
  } catch (err) {
    console.error('Error in getPublicProfile:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 友情パワーを取得（自分と targetId のペア）
 * @param {number} targetId 相手ユーザーID
 * @param {string} token    JWT (自分のログイン)
 * @returns {object} { success:true, power:number } or { success:false, error }
 */
export async function getFriendship(targetId, token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/friendship/${targetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return await res.json()
  } catch (err) {
    console.error('Error in getFriendship:', err)
    return { success: false, error: err.message }
  }
}

/**
 * ハイタッチ（友情パワー +1、1日1回制限）
 * @param {number} targetId 相手ユーザーID
 * @param {string} token    JWT
 * @returns {object} { success:true, power:number } or { success:false, error }
 */
export async function highfive(targetId, token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/highfive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target_id: targetId }),
    })
    return await res.json()
  } catch (err) {
    console.error('Error in highfive:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 最近ハイタッチした相手一覧を取得
 * @param {string} token JWT
 * @param {number} limit 取得件数（既定10, 最大50）
 * @returns {object} { success:true, recent:[{ partner_id:number, last_date:string }] } or { success:false, error }
 */
export async function getRecentHighfives(token, limit = 10) {
  try {
    const res = await fetch(`${SERVER_URL}/api/highfives/recent?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` }
    }
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch (e) {
      console.warn('getRecentHighfives: non-JSON response', text?.slice(0, 120))
      return { success: false, error: 'non_json_response' }
    }
  } catch (err) {
    console.error('Error in getRecentHighfives:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 未読ハイタッチ一覧を取得しつつ既読化する
 * @param {string} token JWT
 * @param {number} limit 件数 (デフォルト20、最大50)
 * @returns {object} { success:true, unread:[{ from_id:number, date:string }] } or { success:false, error }
 */
export async function getUnreadHighfives(token, limit = 20) {
  try {
    const res = await fetch(`${SERVER_URL}/api/highfives/unread?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` }
    }
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch (e) {
      console.warn('getUnreadHighfives: non-JSON response', text?.slice(0, 120))
      return { success: false, error: 'non_json_response' }
    }
  } catch (err) {
    console.error('Error in getUnreadHighfives:', err)
    return { success: false, error: err.message }
  }
}

/**
 * パスワードを変更
 * @param {string} oldPassword  現在のパスワード
 * @param {string} newPassword  新しいパスワード
 * @param {string} token        JWT
 * @returns {object} { success:true } or { success:false, error }
 */
export async function changePassword(oldPassword, newPassword, token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/changePassword`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    })
    return await res.json()
  } catch (err) {
    console.error('Error in changePassword:', err)
    return { success: false, error: err.message }
  }
}

/**
 * アカウントを削除（退会）
 * @param {string} token JWT
 * @returns {object} { success:true } or { success:false, error }
 */
export async function deleteAccount(token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return await res.json()
  } catch (err) {
    console.error('Error in deleteAccount:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 管理者: ユーザー完全削除
 * @param {number} userId  削除したいユーザーID
 * @param {string} token   管理者 JWT
 * @returns {object} { success:true } or { success:false, error }
 */
export async function adminDeleteUser(userId, token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return await res.json()
  } catch (err) {
    console.error('Error in adminDeleteUser:', err)
    return { success: false, error: err.message }
  }
}
