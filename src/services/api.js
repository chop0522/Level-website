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