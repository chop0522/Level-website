// server.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg'); // PostgreSQL

// 1) Expressアプリ初期化
const app = express();
app.use(express.json());
app.use(cors());

// 2) 環境変数の読み込み
const {
  DATABASE_URL,
  JWT_SECRET,
  PORT = 3001
} = process.env;

// 3) PostgreSQL接続
const pool = new Pool({
  connectionString: DATABASE_URL
});

// -----------------------------
// ヘルパー関数
// -----------------------------

// (A) findUserByEmail: emailからユーザーを検索
async function findUserByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = $1';
  const res = await pool.query(sql, [email]);
  if (res.rows.length > 0) {
    // { id, name, email, password_hash, role, xp_stealth, xp_heavy, ... }
    return res.rows[0];
  }
  return null;
}

// (B) createUserInDB: 新規ユーザーをDBに作成 (role='user' デフォルト)
async function createUserInDB(name, email, passwordHash) {
  const sql = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, 'user')
    RETURNING id, name, email, role
  `;
  const values = [name, email, passwordHash];
  const res = await pool.query(sql, values);
  return res.rows[0]; // { id, name, email, role }
}

// (C) daily_category: カテゴリXP獲得に関するヘルパー
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
    INSERT INTO daily_category(user_id, category)
    VALUES ($1, $2)
  `;
  await pool.query(sql, [userId, category]);
}

// (D) gainCategoryXP => 6列(stealth, heavy, light, party, gamble, quiz)を+X
async function gainCategoryXP(userId, category, xpGained) {
  let sql;
  if (category === 'stealth') {
    sql = 'UPDATE users SET xp_stealth = xp_stealth + $1 WHERE id=$2 RETURNING xp_stealth';
  } else if (category === 'heavy') {
    sql = 'UPDATE users SET xp_heavy = xp_heavy + $1 WHERE id=$2 RETURNING xp_heavy';
  } else if (category === 'light') {
    sql = 'UPDATE users SET xp_light = xp_light + $1 WHERE id=$2 RETURNING xp_light';
  } else if (category === 'party') {
    sql = 'UPDATE users SET xp_party = xp_party + $1 WHERE id=$2 RETURNING xp_party';
  } else if (category === 'gamble') {
    sql = 'UPDATE users SET xp_gamble = xp_gamble + $1 WHERE id=$2 RETURNING xp_gamble';
  } else if (category === 'quiz') {
    sql = 'UPDATE users SET xp_quiz = xp_quiz + $1 WHERE id=$2 RETURNING xp_quiz';
  } else {
    throw new Error("Unknown category: " + category);
  }
  const res = await pool.query(sql, [xpGained, userId]);
  return res.rows[0];
}

// (E) 予約をDBに保存するヘルパー
async function createReservationInDB(name, phone, dateTime, people, note) {
  // reservationsテーブル:
  // (id SERIAL, name TEXT, phone TEXT, date_time TIMESTAMP, people INTEGER, note TEXT, created_at TIMESTAMP DEFAULT NOW())
  const sql = `
    INSERT INTO reservations (name, phone, date_time, people, note)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, phone, date_time, people, note
  `;
  const values = [name, phone, dateTime, people, note];
  const res = await pool.query(sql, values);
  return res.rows[0]; // { id, name, phone, date_time, people, note }
}

// -----------------------------
// JWTミドルウェア
// -----------------------------
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
// Adminチェックミドルウェア
// -----------------------------
async function authenticateAdmin(req, res, next) {
  try {
    const email = req.user.email;
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }
    if (userRow.role !== 'admin') {
      return res.status(403).json({ error: "Admin only" });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
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
    // 既存ユーザー確認
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }
    // パスワードをハッシュ化
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);
    // DBに登録
    const newUser = await createUserInDB(name, email, hashed);
    // JWT発行
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
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    const userData = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role
    };
    res.json({ success: true, token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ユーザー情報 (要JWT)
app.get('/api/userinfo', authenticateToken, async (req, res) => {
  try {
    const { email } = req.user;
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      xp_stealth: userRow.xp_stealth,
      xp_heavy:   userRow.xp_heavy,
      xp_light:   userRow.xp_light,
      xp_party:   userRow.xp_party,
      xp_gamble:  userRow.xp_gamble,
      xp_quiz:    userRow.xp_quiz
    };
    return res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// カテゴリXP加算 (1日1回制限)
// -----------------------------
app.post('/api/gameCategory', authenticateToken, async (req, res) => {
  try {
    const { email } = req.user;
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: "Missing category" });
    }
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }
    // 今日同じカテゴリを獲得済みかチェック
    const alreadyGot = await checkDailyCategory(userRow.id, category);
    if (alreadyGot) {
      return res.json({ success: false, msg: "You already got XP for this category today." });
    }
    // +10XP
    const xpGain = 10;
    const updatedVal = await gainCategoryXP(userRow.id, category, xpGain);
    await insertDailyRecord(userRow.id, category);

    res.json({ success: true, xpGain, updatedVal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// イベント (Calendar usage)
// -----------------------------

// イベント一覧取得
app.get('/api/events', async (req, res) => {
  try {
    const sql = 'SELECT id, title, start, "end", all_day FROM events ORDER BY start ASC';
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// イベント作成 (要admin)
app.post('/api/events', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { title, start, end, allDay } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const sql = `
      INSERT INTO events (title, start, "end", all_day)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, start, "end", all_day
    `;
    const values = [title, start, end, allDay || false];
    const result = await pool.query(sql, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// イベント更新 (要admin)
app.put('/api/events/:id', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, allDay } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const sql = `
      UPDATE events
         SET title=$1, start=$2, "end"=$3, all_day=$4
       WHERE id=$5
       RETURNING id, title, start, "end", all_day
    `;
    const values = [title, start, end, allDay || false, id];
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// イベント削除 (要admin)
app.delete('/api/events/:id', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM events WHERE id=$1 RETURNING id';
    const result = await pool.query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 予約機能
// -----------------------------

// reservationsテーブルにINSERT
async function createReservationInDB(name, phone, dateTime, people, note) {
  const sql = `
    INSERT INTO reservations (name, phone, date_time, people, note)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, phone, date_time, people, note
  `;
  const values = [name, phone, dateTime, people, note];
  const result = await pool.query(sql, values);
  return result.rows[0];
}

// POST /api/reservations
app.post('/api/reservations', async (req, res) => {
  try {
    const { name, phone, dateTime, people, note } = req.body;
    if (!name || !phone || !dateTime || !people) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    const newReservation = await createReservationInDB(name, phone, dateTime, people, note || '');
    return res.json({ success: true, reservation: newReservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 予約一覧 (管理用) - 要admin
app.get('/api/reservations', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY date_time ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 予約削除 (管理用) - 要admin
app.delete('/api/reservations/:id', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM reservations WHERE id=$1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------
// フロントエンドのビルド成果物 (本番用)
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