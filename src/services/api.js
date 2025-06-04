// src/services/api.js

const SERVER_URL = ''; 
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
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || '登録に失敗しました' };
    }
    return data; // { success: true, token, user }
  } catch (err) {
    console.error("Error in registerUser:", err);
    return { success: false, error: err.message };
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
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (err) {
    console.error("Error in loginUser:", err);
    return { success: false, error: err.message };
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
        'Authorization': `Bearer ${token}`
      }
    });
    return await res.json();
  } catch (err) {
    console.error("Error in getUserInfo:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 予約を作成
 * @param {object} param0 { name, phone, dateTime, people, note }
 * @returns {object} { success: boolean, reservation?: object, error?: string }
 */
export async function createReservation({ name, phone, dateTime, people, note }) {
  try {
    const res = await fetch(`${SERVER_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, dateTime, people, note })
    });
    return await res.json();
  } catch (err) {
    console.error("Error in createReservation:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 予約一覧を取得 (管理者用)
 * @param {string} token 管理者JWT
 * @returns {array|object} 成功時 reservations配列, 失敗時 { error: string }
 */
export async function getAllReservations(token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/reservations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || '予約一覧の取得に失敗しました' };
    }
    return data; // reservations配列
  } catch (err) {
    console.error("Error in getAllReservations:", err);
    return { error: err.message };
  }
}

/**
 * 予約を削除 (管理者用)
 * @param {number} reservationId
 * @param {string} token 管理者JWT
 * @returns {object} { success: boolean, error?: string }
 */
export async function deleteReservation(reservationId, token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await res.json();
  } catch (err) {
    console.error("Error in deleteReservation:", err);
    return { success: false, error: err.message };
  }
}
// -----------------------------
// Profile (avatar & bio)
// -----------------------------

/**
 * プロフィールを取得 (avatar_url, bio)
 * @param {string} token JWT
 * @returns {object} { id, name, avatar_url, bio } or { error }
 */
export async function getProfile(token) {
  try {
    const res = await fetch(`${SERVER_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    console.error('Error in getProfile:', err);
    return { error: err.message };
  }
}

/**
 * プロフィールを更新 (name, avatar_url と/または bio)
 * @param {string} token JWT
 * @param {object} body  { name?, avatar_url?, bio? }
 * @returns {object} { success: true, user } or { error }
 */
export async function updateProfile(token, body) {
  try {
    const res = await fetch(`${SERVER_URL}/api/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error('Error in updateProfile:', err);
    return { error: err.message };
  }
}

/**
 * アバター画像をアップロード
 * @param {string} token JWT
 * @param {File}   file  画像ファイル
 * @returns {object} { success: true, avatar_url } or { error }
 */
export async function uploadAvatar(token, file) {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch(`${SERVER_URL}/api/upload-avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    return await res.json();
  } catch (err) {
    console.error('Error in uploadAvatar:', err);
    return { error: err.message };
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ category })
    });
    return await res.json();
  } catch (err) {
    console.error('Error in gainXP:', err);
    return { success: false, error: err.message };
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: qrToken })
    });
    return await res.json();
  } catch (err) {
    console.error('Error in claimQR:', err);
    return { success: false, error: err.message };
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    console.error('Error in getAchievements:', err);
    return { success: false, error: err.message };
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
    const res = await fetch(`${SERVER_URL}/api/users?sort=${sort}&limit=${limit}`);
    return await res.json();
  } catch (err) {
    console.error('Error in getUsers:', err);
    return { success: false, error: err.message };
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
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${SERVER_URL}/api/profile/${userId}`, { headers });
    return await res.json();
  } catch (err) {
    console.error('Error in getPublicProfile:', err);
    return { success: false, error: err.message };
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    console.error('Error in getFriendship:', err);
    return { success: false, error: err.message };
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ target_id: targetId })
    });
    return await res.json();
  } catch (err) {
    console.error('Error in highfive:', err);
    return { success: false, error: err.message };
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    console.error('Error in getRecentHighfives:', err);
    return { success: false, error: err.message };
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    console.error('Error in getUnreadHighfives:', err);
    return { success: false, error: err.message };
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    return await res.json();
  } catch (err) {
    console.error('Error in changePassword:', err);
    return { success: false, error: err.message };
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    console.error('Error in deleteAccount:', err);
    return { success: false, error: err.message };
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    console.error('Error in adminDeleteUser:', err);
    return { success: false, error: err.message };
  }
}