// server.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg'); // ← PostgreSQLを使う

// 1) Expressアプリ作成
const app = express();
app.use(express.json());
app.use(cors()); // 開発時のみ許可。本番では設定調整

// 2) 環境変数の読み込み
const {
  DATABASE_URL,  // ← NotionではなくPG接続URL
  JWT_SECRET,
  PORT
} = process.env;

// 3) PostgreSQLプール初期化
const pool = new Pool({
  connectionString: DATABASE_URL
});

// -----------------------------
// DBユーザーデータのヘルパー関数
// -----------------------------

// (A) findUserByEmail: emailからユーザーを検索
async function findUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  if (result.rows.length > 0) {
    // { id, name, email, password_hash, ... }
    return result.rows[0];
  }
  return null;
}

// (B) createUserInDB: ユーザーをDBに作成
//   CREATE TABLE users (
//     id SERIAL PRIMARY KEY,
//     name TEXT,
//     email TEXT UNIQUE,
//     password_hash TEXT
//   );
async function createUserInDB(name, email, passwordHash) {
  const query = `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email
  `;
  const values = [name, email, passwordHash];
  const result = await pool.query(query, values);
  return result.rows[0]; // { id, name, email }
}

// -----------------------------
// JWT関連のミドルウェア
// -----------------------------

// トークン検証
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }
  jwt.verify(token, JWT_SECRET, (err, userData) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = userData; // { email }
    next();
  });
}

// -----------------------------
// 認証系エンドポイント
// -----------------------------

// 新規登録
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }
    // 1) 既存ユーザー確認
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }
    // 2) パスワードハッシュ
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    // 3) DBにユーザー作成
    const newUser = await createUserInDB(name, email, passwordHash);
    // 4) JWT発行
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ success: true, token, user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ログイン
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }
    // 1) DB検索
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // 2) パスワード照合
    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // 3) JWT発行
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    // パスワードハッシュを除くユーザー情報を返す
    const userData = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email
    };
    res.json({ success: true, token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ユーザー情報API (要JWT)
app.get('/api/userinfo', authenticateToken, async (req, res) => {
  try {
    const { email } = req.user;
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }
    // パスワードハッシュを除いて返す
    const userData = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email
    };
    return res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// フロントエンドのビルド成果物を返す(本番用)
// -----------------------------
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// -----------------------------
// サーバー起動
// -----------------------------
const port = PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});