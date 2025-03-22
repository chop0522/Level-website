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
  DATABASE_URL="postgresql://level_db_user:cY30w001byMPCH2F36Y4iH09UzqWneuM@dpg-cvamt75rie7s7396eie0-a/level_db",
  JWT_SECRET,
  PORT=3001
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
    // { id, name, email, password_hash, xp(追加済み), etc }
    return result.rows[0];
  }
  return null;
}

// (B) createUserInDB: ユーザーをDBに作成
//   CREATE TABLE users (
//     id SERIAL PRIMARY KEY,
//     name TEXT,
//     email TEXT UNIQUE,
//     password_hash TEXT,
//     xp INTEGER DEFAULT 0
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
// XP操作用のユーティリティ
// -----------------------------

// gainXP: ユーザーのxpに加算
async function gainXP(userId, xpGained) {
  // 1) 現在xp取得
  const query1 = 'SELECT xp FROM users WHERE id = $1';
  const res1 = await pool.query(query1, [userId]);
  if (res1.rows.length === 0) {
    throw new Error("User not found for gainXP");
  }
  let currentXp = res1.rows[0].xp || 0;

  // 2) 新しいXP
  let newXp = currentXp + xpGained;

  // 3) DB更新
  const query2 = 'UPDATE users SET xp = $1 WHERE id = $2 RETURNING xp';
  const res2 = await pool.query(query2, [newXp, userId]);
  return res2.rows[0].xp; // updated xp
}

// -----------------------------
// 1日1回制限テーブル (daily_category)
// 
// CREATE TABLE daily_category (
//   id SERIAL PRIMARY KEY,
//   user_id INT REFERENCES users(id),
//   category TEXT,
//   date DATE DEFAULT CURRENT_DATE
// );
//
async function checkDailyCategory(userId, category) {
  const sql = `
    SELECT * FROM daily_category
     WHERE user_id = $1
       AND category = $2
       AND date = CURRENT_DATE
  `;
  const res = await pool.query(sql, [userId, category]);
  return (res.rows.length > 0);
}

async function insertDailyRecord(userId, category) {
  const sql = `
    INSERT INTO daily_category (user_id, category)
    VALUES ($1, $2)
  `;
  await pool.query(sql, [userId, category]);
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
      email: userRow.email,
      xp: userRow.xp || 0 // ここでXPを返す
    };
    return res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// ゲームカテゴリ選択API (1日1回制限)
// 例: POST /api/gameCategory { category: "party" }
app.post('/api/gameCategory', authenticateToken, async (req, res) => {
  try {
    const { email } = req.user;
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: "Missing category" });
    }
    // 1) ユーザー検索
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2) 1日1回制限チェック
    const alreadyGot = await checkDailyCategory(userRow.id, category);
    if (alreadyGot) {
      return res.json({ success: false, msg: "You already got XP for this category today." });
    }

    // 3) XP加算
    const xpGained = 10; // 必要ならカテゴリに応じて変化させてもOK
    const newXp = await gainXP(userRow.id, xpGained);

    // 4) DB記録
    await insertDailyRecord(userRow.id, category);

    // 5) レスポンス
    res.json({ success: true, xpGained, newXp });
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