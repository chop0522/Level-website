// src/services/api.js

const SERVER_URL = ''; 
// 同じサーバーで運用なら "", 
// 分けるなら "http://localhost:3001" など

export async function registerUser(name, email, password) {
  const res = await fetch(`${SERVER_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${SERVER_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function getUserInfo(token) {
  const res = await fetch(`${SERVER_URL}/api/userinfo`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}