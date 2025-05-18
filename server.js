// server.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const { Pool } = require('pg'); // PostgreSQL

const multer  = require('multer');
const fs      = require('fs');

// アップロード先ディレクトリを確保 (./uploads)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ファイル名: avatar_<userId>_timestamp.ext
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename   : (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// 1) Expressアプリ初期化
const app = express();
app.use(express.json());
app.use(cors());

// 2) 環境変数の読み込み
const {
  DATABASE_URL,
  JWT_SECRET,
  QR_SECRET = 'qr_secret_change_me',
  PORT = 3001
} = process.env;

// 3) PostgreSQL接続
const pool = new Pool({
  connectionString: DATABASE_URL
});


// -----------------------------
// ヘルパー関数
// -----------------------------

/**
 * Build ORDER BY clause for leaderboard
 * @param {string} sortKey
 * @returns {string}
 */
function leaderboardOrder(sortKey) {
  switch (sortKey) {
    case 'stealth': return 'xp_stealth DESC';
    case 'heavy'  : return 'xp_heavy DESC';
    case 'light'  : return 'xp_light DESC';
    case 'party'  : return 'xp_party DESC';
    case 'gamble' : return 'xp_gamble DESC';
    case 'quiz'   : return 'xp_quiz DESC';
    default       : return 'xp_total DESC';
  }
}

/**
 * 並び順を固定して friendship ペアを一意化
 * @param {number} a
 * @param {number} b
 * @returns {[number,number]} 昇順タプル
 */
function sortPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

/**
 * ユーザーをメールアドレスで検索
 * @param {string} email
 * @returns {object|null} ユーザーRow or null
 */
async function findUserByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = $1';
  const res = await pool.query(sql, [email]);
  if (res.rows.length > 0) {
    // { id, name, email, password_hash, role, xp_stealth, xp_heavy, ... }
    return res.rows[0];
  }
  return null;
}

/**
 * 新規ユーザーをDBに作成 (role='user' デフォルト)
 * @param {string} name 
 * @param {string} email 
 * @param {string} passwordHash 
 * @returns {object} { id, name, email, role }
 */
async function createUserInDB(name, email, passwordHash) {
  const sql = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, 'user')
    RETURNING id, name, email, role
  `;
  const values = [name, email, passwordHash];
  const res = await pool.query(sql, values);
  return res.rows[0];
}

/**
 * 当日同じカテゴリでXPを取得済みかチェック
 * @param {number} userId 
 * @param {string} category 
 * @returns {boolean}
 */
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

/**
 * daily_categoryに「本日取得済み」記録を追加
 * @param {number} userId 
 * @param {string} category 
 */
async function insertDailyRecord(userId, category) {
  const sql = `
    INSERT INTO daily_category (user_id, category)
    VALUES ($1, $2)
  `;
  await pool.query(sql, [userId, category]);
}

/**
 * カテゴリXPを加算
 * @param {number} userId 
 * @param {string} category 
 * @param {number} xpGained 
 * @returns {object} updated column e.g. { xp_stealth: 10 }
 */
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

/**
 * XP から現在のランク情報を取得
 * @param {string} category
 * @param {number} currentXP
 * @returns {object|null} { rank, label, badge_url }
 */
async function getRankInfo(category, currentXP) {
  const sql = `
    SELECT rank, label, badge_url
      FROM xp_ranks
     WHERE category = $1
       AND required_xp <= $2
  ORDER BY rank DESC
     LIMIT 1
  `;
  const res = await pool.query(sql, [category, currentXP]);
  return res.rows[0] || null;
}

/**
 * 現XPから次ランクの required_xp を取得
 * @param {string} category
 * @param {number} currentXP
 * @returns {object|null} { rank, required_xp }
 */
async function getNextRankInfo(category, currentXP) {
  const sql = `
    SELECT rank, required_xp
      FROM xp_ranks
     WHERE category = $1
       AND required_xp > $2
  ORDER BY required_xp ASC
     LIMIT 1
  `;
  const res = await pool.query(sql, [category, currentXP]);
  return res.rows[0] || null;
}

/**
 * reservationsテーブルに予約をINSERT
 * @param {string} name 
 * @param {string} phone 
 * @param {string} dateTime 
 * @param {number} people 
 * @param {string} note 
 * @returns {object} { id, name, phone, date_time, people, note }
 */
async function createReservationInDB(name, phone, dateTime, people, note) {
  const sql = `
    INSERT INTO reservations (name, phone, date_time, people, note)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, phone, date_time, people, note
  `;
  const values = [name, phone, dateTime, people, note];
  const res = await pool.query(sql, values);
  return res.rows[0];
}

// -----------------------------
// JWTミドルウェア
// -----------------------------

/**
 * トークンを検証
 */
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

/**
 * 管理者チェック (role==='admin')
 */
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
    // adminならOK
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
    // 既に同メールが登録されていないか
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // パスワードをハッシュ化
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);
    // DBにユーザー作成
    const newUser = await createUserInDB(name, email, hashed);

    // JWTには id と role も入れる
    const token = jwt.sign(
      { id: newUser.id, email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
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

    const token = jwt.sign(
      { id: userRow.id, email, role: userRow.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
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
    // 全列返す例 (roleやXP系を含む)
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
      xp_quiz:    userRow.xp_quiz,
      xp_total:   userRow.xp_total,
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

    // XP加算 (例: +10)
    const xpGain = 10;
    const updatedVal = await gainCategoryXP(userRow.id, category, xpGain);
    await insertDailyRecord(userRow.id, category);
    // 合計XPを更新
    await pool.query(
      'UPDATE users SET xp_total = xp_total + $1 WHERE id = $2',
      [xpGain, userRow.id]
    );

    const currentXP = Object.values(updatedVal)[0];      // 例: 60
    const newRank   = await getRankInfo(category, currentXP);
    const prevRank  = await getRankInfo(category, currentXP - xpGain);
    const rankUp = !prevRank || newRank.rank > prevRank.rank;

    const nextRank = await getNextRankInfo(category, currentXP);

    res.json({
      success: true,
      xpGain,
      currentXP,
      rank: newRank.rank,
      label: newRank.label,
      badge_url: newRank.badge_url,
      rankUp,
      next_required_xp: nextRank ? nextRank.required_xp : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// QRコード用 XP クレーム
// -----------------------------
app.post('/api/qr/claim', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;               // JWT from QR
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing QR token' });
    }

    // Verify QR JWT
    let decoded;
    try {
      decoded = jwt.verify(token, QR_SECRET); // { cat }
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired QR token' });
    }
    const category = decoded.cat;
    if (!['stealth','heavy','light','party','gamble','quiz'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }

    // Same daily check
    const userRow = await findUserByEmail(req.user.email);
    const already = await checkDailyCategory(userRow.id, category);
    if (already) {
      return res.json({ success: false, error: 'Already claimed today' });
    }

    const xpGain = 10;
    const updatedVal = await gainCategoryXP(userRow.id, category, xpGain);
    await insertDailyRecord(userRow.id, category);
    // 合計XPを更新
    await pool.query(
      'UPDATE users SET xp_total = xp_total + $1 WHERE id = $2',
      [xpGain, userRow.id]
    );

    const currentXP = Object.values(updatedVal)[0];
    const newRank   = await getRankInfo(category, currentXP);
    const prevRank  = await getRankInfo(category, currentXP - xpGain);
    const rankUp    = !prevRank || newRank.rank > prevRank.rank;
    const nextRank  = await getNextRankInfo(category, currentXP);

    res.json({
      success: true,
      xpGain,
      currentXP,
      rank: newRank.rank,
      label: newRank.label,
      badge_url: newRank.badge_url,
      rankUp,
      next_required_xp: nextRank ? nextRank.required_xp : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------
// XP付与 (管理者操作)  /api/giveXP
// -----------------------------
app.post('/api/giveXP', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { email, category, amount = 10 } = req.body;
    if (!email || !category) {
      return res.status(400).json({ success: false, error: 'Missing email or category' });
    }
    if (!['stealth','heavy','light','party','gamble','quiz'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }
    const targetUser = await findUserByEmail(email);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found' });
    }

    // XP 加算
    const updated = await gainCategoryXP(targetUser.id, category, amount);
    // 合計XP更新
    await pool.query(
      'UPDATE users SET xp_total = xp_total + $1 WHERE id = $2',
      [amount, targetUser.id]
    );
    const currentXP = Object.values(updated)[0];
    const rankInfo  = await getRankInfo(category, currentXP);
    const nextRank  = await getNextRankInfo(category, currentXP);

    res.json({
      success: true,
      email,
      category,
      amount,
      currentXP,
      rank: rankInfo.rank,
      label: rankInfo.label,
      next_required_xp: nextRank ? nextRank.required_xp : null
    });
    return; // giveXP 正常終了
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------
// ハイタッチ: 1日1回 / ペア
// -----------------------------
app.post('/api/highfive', authenticateToken, async (req, res) => {
  try {
    const fromId = req.user.id;
    const toId   = parseInt(req.body.target_id, 10);
    if (!toId || fromId === toId) {
      return res.status(400).json({ success:false, error:'Invalid target' });
    }

    // 重複チェック: 当日既にハイタッチ済み？
    const sqlInsert = `
      INSERT INTO highfives (user_from, user_to, date)
      VALUES ($1, $2, CURRENT_DATE)
      ON CONFLICT (user_from, user_to, date) DO NOTHING
      RETURNING id
    `;
    const ins = await pool.query(sqlInsert, [fromId, toId]);
    if (ins.rowCount === 0) {
      return res.status(429).json({ success:false, error:'今日のハイタッチは完了しています' });
    }

    // friendship power ++
    const [low, high] = sortPair(fromId, toId);
    const sqlFr = `
      INSERT INTO friendship (user_low, user_high, power)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_low, user_high)
      DO UPDATE SET power = friendship.power + 1
      RETURNING power
    `;
    const fr = await pool.query(sqlFr, [low, high]);
    res.json({ success:true, power: fr.rows[0].power });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// -----------------------------
// 友情パワー取得 (当事者のみ)
// -----------------------------
app.get('/api/friendship/:id', authenticateToken, async (req, res) => {
  try {
    const selfId = req.user.id;
    const otherId = parseInt(req.params.id, 10);
    if (!otherId || selfId === otherId) {
      return res.status(400).json({ success:false, error:'Invalid id' });
    }

    const [low, high] = sortPair(selfId, otherId);
    const sql = 'SELECT power FROM friendship WHERE user_low=$1 AND user_high=$2';
    const fr = await pool.query(sql, [low, high]);
    res.json({ success:true, power: fr.rows[0]?.power || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// -----------------------------
// Leaderboard 公開ユーザー一覧
// -----------------------------
app.get('/api/users', async (req, res) => {
  try {
    const sort  = req.query.sort || 'total';
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const order = leaderboardOrder(sort);

    const sql = `
      SELECT id, name, avatar_url,
             xp_total, xp_stealth, xp_heavy, xp_light,
             xp_party, xp_gamble, xp_quiz
        FROM users
       WHERE is_public IS NOT FALSE
    ORDER BY ${order}
       LIMIT $1
    `;
    const result = await pool.query(sql, [limit]);
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// -----------------------------
// 公開プロフィール (read-only)
// -----------------------------
app.get('/api/profile/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success:false, error:'Invalid id' });
    }
    const sql = `
      SELECT id, name, avatar_url, bio,
             xp_total, xp_stealth, xp_heavy, xp_light,
             xp_party, xp_gamble, xp_quiz,
             is_public
        FROM users
       WHERE id = $1
    `;
    const result = await pool.query(sql, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success:false, error:'User not found' });
    }
    const profile = result.rows[0];

    // private profile guard
    if (profile.is_public === false) {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(403).json({ success:false, error:'Profile is private' });
      }
      let decoded;
      try { decoded = jwt.verify(token, JWT_SECRET); }
      catch { return res.status(403).json({ success:false, error:'Invalid token'}); }
      if (decoded.id !== userId) {
        return res.status(403).json({ success:false, error:'Profile is private' });
      }
    }

    delete profile.is_public;
    res.json({ success:true, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// -----------------------------
// Achievements (総合ランク + XP)
// -----------------------------
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const rankSql = `
      SELECT rank, label, badge_url
        FROM xp_total_ranks
       WHERE required_xp <= $1
    ORDER BY rank DESC
       LIMIT 1
    `;
    const rankRes = await pool.query(rankSql, [userRow.xp_total]);
    const totalRank = rankRes.rows[0];

    res.json({
      success: true,
      xp_total: userRow.xp_total,
      totalRank,
      user: userRow
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------
// プロフィール取得・更新
// -----------------------------

// GET /api/profile  (JWT 必須)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const userRow = await findUserByEmail(email);
    if (!userRow) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: userRow.id,
      name: userRow.name,
      avatar_url: userRow.avatar_url,
      bio: userRow.bio
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profile  (avatar_url, bio の任意更新)
app.patch('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { avatar_url, bio } = req.body;
    if (!avatar_url && bio === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const email = req.user.email;
    const fields = [];
    const values = [];
    if (avatar_url !== undefined) { fields.push('avatar_url'); values.push(avatar_url); }
    if (bio !== undefined)        { fields.push('bio');        values.push(bio); }

    const setClause = fields.map((f, i) => `${f} = $${i+1}`).join(', ');
    const sql = `UPDATE users SET ${setClause} WHERE email = $${fields.length+1} RETURNING avatar_url, bio`;
    values.push(email);
    const result = await pool.query(sql, values);
    res.json({ success: true, ...result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// アバター画像アップロード (multipart/form-data)
// -----------------------------
app.post('/api/upload-avatar',
  authenticateToken,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      // 保存先 URL を作成 (例: /uploads/filename.png)
      const publicUrl = `/uploads/${req.file.filename}`;

      // DB の avatar_url を更新
      const sql = `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url`;
      const result = await pool.query(sql, [publicUrl, req.user.id]);

      res.json({ success: true, avatar_url: result.rows[0].avatar_url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
});

// -----------------------------
// イベント (Calendar usage)
// -----------------------------

// 取得 (制限なし)
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

// 作成 (要admin)
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

// 更新 (要admin)
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

// 削除 (要admin)
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
// 予約機能 (要: reservationsテーブル)
// -----------------------------

// 作成 (ユーザー→DB保存)
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

// 予約一覧 (管理者用)
app.get('/api/reservations', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const sql = 'SELECT * FROM reservations ORDER BY date_time ASC';
    const result = await pool.query(sql);
    res.json(result.rows); // [{ id, name, phone, date_time, people, note, ... }, ...]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 予約削除 (管理者用)
app.delete('/api/reservations/:id', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM reservations WHERE id=$1 RETURNING id';
    const result = await pool.query(sql, [id]);
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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