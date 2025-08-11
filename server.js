// server.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dayjs   = require('dayjs');           // 日付ユーティリティ
// 麻雀ポイント計算ユーティリティ
const { calcMahjongPoint } = require('./utils/mahjong');
// ---------------------------------
// Express initialization (moved up so routes can be declared safely)
const app = express();
app.use(express.json());
app.use(cors());
// ---------------------------------
// -----------------------------
// 麻雀: 対局登録
// -----------------------------
app.post('/api/mahjong/games', authenticateToken, async (req, res) => {
  try {
    // rank: 1‑4, finalScore: 持ち点, (admin only) username or user_id, optional test
    const { rank, finalScore, username, user_id, test } = req.body;
    // 管理者のみ登録可能
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    // 入力バリデーション
    if (![1, 2, 3, 4].includes(rank) || !Number.isInteger(finalScore)) {
      return res.status(400).json({ error: 'rank(1-4) と整数 finalScore が必要' });
    }

    // 対象ユーザーを id 優先で特定、なければ名前検索
    let targetId = user_id || null;
    if (!targetId) {
      const target = await findUserByName(username);
      if (!target) {
        return res.status(404).json({ error: 'User not found' });
      }
      targetId = target.id;
    }

    // ポイント計算
    const point = calcMahjongPoint(rank, finalScore);

    const isTest = !!test;
    if (isTest) {
      // テストモード: 列が無くても安全に追加（冪等）
      await ensureIsTestColumn();
      await pool.query(
        `INSERT INTO mahjong_games (user_id, rank, final_score, point, is_test)
         VALUES ($1, $2, $3, $4, true)`,
        [targetId, rank, finalScore, point]
      );
      // テストは totals 更新も月次REFRESH もしない（ランキングに影響させない）
      return res.json({ success: true, point, test: true });
    }

    // 通常登録（ランキング反映）
    await pool.query(
      `INSERT INTO mahjong_games (user_id, rank, final_score, point)
       VALUES ($1, $2, $3, $4)`,
      [targetId, rank, finalScore, point]
    );

    await pool.query(
      'UPDATE users SET total_pt = total_pt + $1 WHERE id = $2',
      [point, targetId]
    );

    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly');

    res.json({ success: true, point, test: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 麻雀: 4人分を一括登録（管理者）
// POST /api/mahjong/matches
// body: { results: [{ user_id | username, rank, finalScore }, ... 4件] }
// -----------------------------
app.post('/api/mahjong/matches', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { results = [], test } = req.body || {};
    if (!Array.isArray(results) || results.length !== 4) {
      return res.status(400).json({ error: 'results は4件の配列で送ってください' });
    }

    const ranks = results.map(r => r.rank);
    const rankSet = new Set(ranks);
    if (!(rankSet.size === 4 && [1,2,3,4].every(n => rankSet.has(n)))) {
      return res.status(400).json({ error: 'rank は 1,2,3,4 を各1回ずつにしてください' });
    }

    // 合計=100,000 のサーバ検証 + 1人だけ未入力なら自動計算
    const TOTAL = 100000;
    let missingIndex = -1;
    let sumKnown = 0;

    const normalized = results.map((r, i) => {
      const v = r.finalScore;
      if (v === undefined || v === null || v === '' || Number.isNaN(Number(v))) {
        if (missingIndex >= 0) {
          throw new Error('finalScore は3名分を数値で、残り1名のみ未指定にしてください（合計100,000で自動計算）');
        }
        missingIndex = i;
        return { ...r, finalScore: null };
      }
      const n = Number(v);
      sumKnown += n;
      return { ...r, finalScore: n };
    });

    if (missingIndex >= 0) {
      normalized[missingIndex].finalScore = TOTAL - sumKnown;
      sumKnown = TOTAL;
    } else {
      if (sumKnown !== TOTAL) {
        return res.status(400).json({ error: `4人の合計が100,000ではありません（現在: ${sumKnown}）` });
      }
    }

    // 1つでもテスト行があるなら列を用意
    const anyTest = !!test || normalized.some(r => !!r.test);
    if (anyTest) {
      await ensureIsTestColumn();
    }

    let updatedRealTotals = false; // 実データで total_pt を更新したか

    await pool.query('BEGIN');
    try {
      for (const r of normalized) {
        if (![1,2,3,4].includes(r.rank) || !Number.isFinite(Number(r.finalScore))) {
          throw new Error('rank(1-4) と数値 finalScore が必要です');
        }
        let userId = r.user_id || null;
        if (!userId && r.username) {
          const target = await findUserByName(r.username);
          if (!target) throw new Error(`User not found: ${r.username}`);
          userId = target.id;
        }
        if (!userId) throw new Error('user_id か username のいずれかを指定してください');

        const point = calcMahjongPoint(r.rank, Number(r.finalScore));
        const rowIsTest = r.test !== undefined ? !!r.test : !!test;

        if (rowIsTest) {
          await pool.query(
            `INSERT INTO mahjong_games (user_id, rank, final_score, point, is_test)
             VALUES ($1, $2, $3, $4, true)`,
            [userId, r.rank, Number(r.finalScore), point]
          );
        } else {
          await pool.query(
            `INSERT INTO mahjong_games (user_id, rank, final_score, point)
             VALUES ($1, $2, $3, $4)`,
            [userId, r.rank, Number(r.finalScore), point]
          );
          await pool.query(
            'UPDATE users SET total_pt = total_pt + $1 WHERE id = $2',
            [point, userId]
          );
          updatedRealTotals = true;
        }
      }
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }

    // 実データが含まれていれば月次を更新、テストだけなら更新不要
    if (updatedRealTotals) {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly');
    }

    res.json({ success: true, testMode: anyTest && !updatedRealTotals });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});
// -----------------------------
// 麻雀: 既存対局の修正（管理者・直接点数編集）
// PATCH /api/mahjong/games/:id
// body: { finalScore?, rank?, user_id? | username? }
// ・is_test 行は totals/MV に影響させない
// ・通常行は差分で users.total_pt を調整し、MVをREFRESH
// -----------------------------
app.patch('/api/mahjong/games/:id', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });

    // 念のため is_test 列を用意（冪等）
    await ensureIsTestColumn();

    const { rows: [orig] } = await pool.query(
      'SELECT id, user_id, rank, final_score, point, is_test, played_at FROM public.mahjong_games WHERE id = $1',
      [id]
    );
    if (!orig) return res.status(404).json({ error: 'game not found' });

    // 変更後の値を決定
    const nextRank  = req.body.rank ?? orig.rank;
    const nextFinal = req.body.finalScore !== undefined ? Number(req.body.finalScore) : orig.final_score;
    if (![1,2,3,4].includes(nextRank) || !Number.isFinite(nextFinal)) {
      return res.status(400).json({ error: 'rank(1-4) と数値 finalScore が必要' });
    }

    let nextUserId = req.body.user_id || orig.user_id;
    if (!nextUserId && req.body.username) {
      const target = await findUserByName(req.body.username);
      if (!target) return res.status(404).json({ error: 'User not found' });
      nextUserId = target.id;
    }

    // is_test 切り替え（boolean / 'true' / 'false' / 1 / '1' を許容）
    const hasIsTest = Object.prototype.hasOwnProperty.call(req.body, 'is_test');
    const nextIsTest = hasIsTest
      ? (req.body.is_test === true || req.body.is_test === 'true' || req.body.is_test === 1 || req.body.is_test === '1')
      : !!orig.is_test;

    const newPoint = calcMahjongPoint(nextRank, nextFinal);
    const oldPoint = orig.point;

    let touchedReal = false; // ランキング/total_pt に影響があったか

    await pool.query('BEGIN');
    try {
      // ゲーム本体を更新
      await pool.query(
        `UPDATE public.mahjong_games
           SET user_id = $1, rank = $2, final_score = $3, point = $4, is_test = $5
         WHERE id = $6`,
        [nextUserId, nextRank, nextFinal, newPoint, nextIsTest, id]
      );

      // total_pt 調整（orig.is_test/nextIsTest と、ユーザー変更・ポイント差分を考慮）
      if (!orig.is_test && !nextIsTest) {
        // 実データ → 実データ
        if (nextUserId !== orig.user_id) {
          await pool.query('UPDATE public.users SET total_pt = total_pt - $1 WHERE id = $2', [oldPoint, orig.user_id]);
          await pool.query('UPDATE public.users SET total_pt = total_pt + $1 WHERE id = $2', [newPoint, nextUserId]);
          touchedReal = true;
        } else {
          const delta = newPoint - oldPoint;
          if (delta !== 0) {
            await pool.query('UPDATE public.users SET total_pt = total_pt + $1 WHERE id = $2', [delta, orig.user_id]);
            touchedReal = true;
          }
        }
      } else if (!orig.is_test && nextIsTest) {
        // 実データ → テスト化（ランキングから除外）
        await pool.query('UPDATE public.users SET total_pt = total_pt - $1 WHERE id = $2', [oldPoint, orig.user_id]);
        touchedReal = true;
      } else if (orig.is_test && !nextIsTest) {
        // テスト → 実データ化（ランキングに反映）
        await pool.query('UPDATE public.users SET total_pt = total_pt + $1 WHERE id = $2', [newPoint, nextUserId]);
        touchedReal = true;
      } else {
        // テスト → テスト（トータルは触らない）
      }

      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }

    if (touchedReal) {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly');
    }

    res.json({ success: true, id, is_test: nextIsTest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// -----------------------------
// 麻雀: 既存対局の削除（管理者）
// DELETE /api/mahjong/games/:id
// -----------------------------
app.delete('/api/mahjong/games/:id', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });

    await ensureIsTestColumn();

    const { rows } = await pool.query(
      'SELECT id, user_id, point, is_test FROM public.mahjong_games WHERE id = $1',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'game not found' });
    const orig = rows[0];

    await pool.query('BEGIN');
    try {
      await pool.query('DELETE FROM public.mahjong_games WHERE id = $1', [id]);
      if (!orig.is_test) {
        await pool.query('UPDATE public.users SET total_pt = total_pt - $1 WHERE id = $2', [orig.point, orig.user_id]);
      }
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }

    if (!orig.is_test) {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly');
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 麻雀: 対局一覧（管理者・編集用テーブル用）
// GET /api/mahjong/games?month=YYYY-MM&test=all|true|false&limit=50
// -----------------------------
app.get('/api/mahjong/games', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { month, test, limit = 50 } = req.query;

    // 念のため is_test 列を用意（冪等）
    await ensureIsTestColumn();

    const params = [];
    let where = 'WHERE 1=1';

    if (month) {
      where += ` AND date_trunc('month', (g.played_at AT TIME ZONE 'Asia/Tokyo'))::date = $${params.length + 1}::date`;
      params.push(`${month}-01`);
    }

    if (test === 'true') {
      where += ' AND g.is_test = true';
    } else if (test === 'false') {
      // NULL を含めないよう明示的に false 指定
      where += ' AND g.is_test = false';
    }

    const sql = `
      SELECT
        g.id,
        (g.played_at AT TIME ZONE 'Asia/Tokyo') AS played_at_jst,
        g.user_id,
        u.name,
        g.rank,
        g.final_score,
        g.point,
        COALESCE(g.is_test,false) AS is_test
      FROM public.mahjong_games g
      JOIN public.users u ON u.id = g.user_id
      ${where}
      ORDER BY g.played_at DESC
      LIMIT $${params.length + 1}
    `;
    params.push(Math.max(1, Math.min(parseInt(limit, 10) || 50, 500)));

    const { rows } = await pool.query(sql, params);
    res.json({ success: true, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 麻雀: 月間ランキング取得
// -----------------------------
app.get('/api/mahjong/monthly', async (req, res) => {
  try {
    // ?month=YYYY-MM が無ければ今月
    const month = req.query.month || null; // 'YYYY-MM' or null
    const responseMonth = (req.query.month || dayjs().startOf('month').format('YYYY-MM'));
    const sql = `
      SELECT
        u.id,
        u.name,
        m.total_points AS monthly_pt
      FROM public.mahjong_monthly m
      JOIN public.users u ON u.id = m.user_id
      WHERE m.month = COALESCE(
        $1::date,
        date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo'))::date
      )
      ORDER BY m.total_points DESC
      LIMIT 100
    `;
    const { rows } = await pool.query(sql, [month ? month + '-01' : null]); // month未指定ならJST今月
    res.json({ success: true, month: responseMonth, ranking: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 麻雀: 通算 (ライフタイム) ランキング取得
// -----------------------------
app.get('/api/mahjong/lifetime', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 200);
    const sql = `
      SELECT id, name, total_pt
        FROM users
       WHERE role <> 'admin'               -- 管理者は除外
         AND total_pt IS NOT NULL
    ORDER BY total_pt DESC
       LIMIT $1
    `;
    const { rows } = await pool.query(sql, [limit]);
    res.json({ success: true, ranking: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// [DEPRECATED] 管理者: 月間ポイント調整 (テスト用)
// 旧: POST /api/admin/monthlyPt
// 直接のポイント改変は廃止。対局編集と再構築APIをご利用ください。
// -----------------------------
app.post('/api/admin/monthlyPt', authenticateToken, authenticateAdmin, (_req, res) => {
  return res.status(410).json({
    success: false,
    error: '廃止されたエンドポイントです。対局編集（/api/mahjong/games）とランキング再構築（/api/admin/mahjong/rebuild-monthly）を使用してください。'
  });
});

// -----------------------------
// 管理者: 月次ランキング再構築（DROP→CREATE→INDEX→REFRESH→付随更新）
// POST /api/admin/mahjong/rebuild-monthly
// -----------------------------
app.post('/api/admin/mahjong/rebuild-monthly', authenticateToken, authenticateAdmin, async (_req, res) => {
  try {
    const sqlPath = path.join(__dirname, 'scripts', 'refresh_mahjong.sql');
    const sqlText = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sqlText);
    res.json({ success: true, message: 'mahjong_monthly rebuilt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// -----------------------------
// Leaderboard 公開ユーザー一覧

const { Pool } = require('pg'); // PostgreSQL

// 画像はディスクではなくメモリに保持 → 直接 BYTEA に保存
const upload = require('./uploadConfig');

// 1) Expressアプリ初期化

// 2) 環境変数の読み込み
const {
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES = '30d',           // デフォルト 30 日
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
 * Ensure mahjong_games.is_test column exists (idempotent)
 */
async function ensureIsTestColumn() {
  await pool.query(`ALTER TABLE public.mahjong_games
    ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false`);
}

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
 * ユーザーを名前で検索
 * @param {string} name
 * @returns {object|null}
 */
async function findUserByName(name) {
  const res = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
  return res.rows[0] || null;
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
 * 管理者チェック (role==='admin') - ID優先, メールはフォールバック
 */
async function authenticateAdmin(req, res, next) {
  try {
    const { id, email } = req.user;
    let userRow = null;

    // まずはIDで取得（メール変更直後の旧トークンでも動作させる）
    if (id) {
      const byId = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (byId.rows.length > 0) userRow = byId.rows[0];
    }
    // 念のためメールでも検索
    if (!userRow && email) {
      userRow = await findUserByEmail(email);
    }

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
      { expiresIn: JWT_EXPIRES }
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
      { expiresIn: JWT_EXPIRES }
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
    const userId = req.user.id;
    let userRow = null;

    // まずはIDで取得（メール変更直後でも破綻しない）
    const byId = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (byId.rows.length > 0) {
      userRow = byId.rows[0];
    } else {
      // 念のため旧トークン用にメールでも探す
      const { email } = req.user;
      userRow = await findUserByEmail(email);
    }

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
      xp_quiz:    userRow.xp_quiz,
      xp_total:   userRow.xp_total,

      // --- Mahjong cumulative & monthly ---
      total_pt:   userRow.total_pt,
      monthly_pt: userRow.monthly_pt,
      mahjong_rank:    userRow.mahjong_rank,
      mahjong_subrank: userRow.mahjong_subrank,
    };
    return res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// カテゴリXP加算 (1日1回制限) - IDベース実装
// -----------------------------
app.post('/api/gameCategory', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: "Missing category" });
    }

    // ユーザー存在確認（メール変更直後の旧トークンでもIDで安定）
    const { rows: [userRow] } = await pool.query('SELECT id, xp_total FROM users WHERE id = $1', [userId]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 今日同じカテゴリを獲得済みかチェック
    const alreadyGot = await checkDailyCategory(userId, category);
    if (alreadyGot) {
      return res.json({ success: false, msg: "You already got XP for this category today." });
    }

    // XP加算 (例: +10)
    const xpGain = 10;
    const updatedVal = await gainCategoryXP(userId, category, xpGain);
    await insertDailyRecord(userId, category);
    // 合計XPを更新
    await pool.query(
      'UPDATE users SET xp_total = xp_total + $1 WHERE id = $2',
      [xpGain, userId]
    );

    const currentXP = Object.values(updatedVal)[0];
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
// QRコード用 XP クレーム - IDベース実装
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

    const userId = req.user.id;
    const { rows: [userRow] } = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!userRow) return res.status(404).json({ success: false, error: 'User not found' });

    // Same daily check
    const already = await checkDailyCategory(userId, category);
    if (already) {
      return res.json({ success: false, error: 'Already claimed today' });
    }

    const xpGain = 10;
    const updatedVal = await gainCategoryXP(userId, category, xpGain);
    await insertDailyRecord(userId, category);
    // 合計XPを更新
    await pool.query(
      'UPDATE users SET xp_total = xp_total + $1 WHERE id = $2',
      [xpGain, userId]
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

// XP付与 (管理者操作) [DEPRECATED]
// 旧: POST /api/giveXP
// AdminXP を廃止したため、手動付与は受け付けません。
app.post('/api/giveXP', authenticateToken, authenticateAdmin, (_req, res) => {
  return res.status(410).json({
    success: false,
    error: '廃止されたエンドポイントです。XP は通常の記録フローで自動加算されます。'
  });
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
// 未読ハイタッチ一覧  (読み出したら既読扱い)
// -----------------------------
app.get('/api/highfives/unread', authenticateToken, async (req, res) => {
  try {
    const selfId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);

    // 未読を取得 (last_seen 以降)
    const sqlUnread = `
      SELECT user_from AS from_id, date
        FROM highfives
       WHERE user_to = $1
         AND date > (
           SELECT COALESCE(last_seen_highfive, '1970-01-01') FROM users WHERE id=$1
         )
    ORDER BY date DESC
       LIMIT $2
    `;
    const { rows } = await pool.query(sqlUnread, [selfId, limit]);

    // 既読にする（最新アクセス時刻を更新）
    await pool.query(
      'UPDATE users SET last_seen_highfive = now() WHERE id = $1',
      [selfId]
    );

    res.json({ success: true, unread: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});
// 管理者: ユーザー物理削除 [DEPRECATED]
// 旧: DELETE /api/admin/users/:id
// 誤操作防止のため停止します。統合作業は個別SQL/運用フローで対応。
app.delete('/api/admin/users/:id', authenticateToken, authenticateAdmin, (_req, res) => {
  return res.status(410).json({
    success: false,
    error: 'ユーザー削除APIは廃止しました（410）。必要な場合は運用手順で統合してください。'
  });
});

// -----------------------------
// 管理者: ユーザー簡易リスト (ドロップダウン用)
// GET /api/admin/users/list  -> [{ id, name }]
// -----------------------------
app.get('/api/admin/users/list', authenticateToken, authenticateAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM users ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 管理者: ユーザー検索 [DEPRECATED]
// 旧: GET /api/admin/users?query=...
// AdminXP 廃止に伴い、サーバ側の検索エンドポイントも停止。
app.get('/api/admin/users', authenticateToken, authenticateAdmin, (_req, res) => {
  return res.status(410).json({ error: '廃止されたエンドポイントです（/api/admin/users/list は存続）' });
});

// -----------------------------
// 管理者: ユーザー名リスト (ドロップダウン用)
// (DEPRECATED: use /api/admin/users/list instead)
// -----------------------------
// app.get('/api/users/list', authenticateToken, authenticateAdmin, async (_req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT name FROM users ORDER BY name');
//     res.json(rows.map(r => r.name));
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// -----------------------------
// Leaderboard 公開ユーザー一覧
// -----------------------------
app.get('/api/users', async (req, res) => {
  try {
    const sort  = req.query.sort || 'total';
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const order = leaderboardOrder(sort);

    const sql = `
      SELECT id, name,
             xp_total, xp_stealth, xp_heavy, xp_light,
             xp_party, xp_gamble, xp_quiz
        FROM users
       WHERE is_public IS NOT FALSE
         AND role <> 'admin'          -- 管理者をランキングから除外
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
// Achievements (総合ランク + XP) - IDベース実装
// -----------------------------
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows: [userRow] } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
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

// GET /api/profile  (JWT 必須) - IDベースの実装
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      'SELECT id, name, avatar_url, bio FROM users WHERE id = $1',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const userRow = rows[0];
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

// PATCH /api/profile  (avatar_url, bio の任意更新) - IDベース更新
app.patch('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar_url, bio } = req.body;
    if (name === undefined && avatar_url === undefined && bio === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const userId = req.user.id;
    const fields = [];
    const values = [];
    if (name !== undefined)       { fields.push('name');       values.push(name); }
    if (avatar_url !== undefined) { fields.push('avatar_url'); values.push(avatar_url); }
    if (bio !== undefined)        { fields.push('bio');        values.push(bio); }

    const setClause = fields.map((f, i) => `${f} = $${i+1}`).join(', ');
    const sql = `UPDATE users SET ${setClause} WHERE id = $${fields.length+1} RETURNING id, name, avatar_url, bio`;
    values.push(userId);
    const result = await pool.query(sql, values);
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// ユーザー設定 (名前変更 / パスワード変更)
// -----------------------------

// PUT /api/users/me/name  ―  Display name change (no password required)
app.put('/api/users/me/name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const sql = 'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name';
    const { rows } = await pool.query(sql, [name, req.user.id]);

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/me/password  ―  Password change (current password check)
app.put('/api/users/me/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    // fetch current hash
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // validate current password
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
      return res.status(403).json({ error: 'Wrong current password' });
    }

    // update with new hash
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, req.user.id]
    );

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 自分のログイン用メールを変更（要ログイン）
// PATCH /api/me/email  body: { email }
app.patch('/api/me/email', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const email = (req.body?.email || '').trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ error: '不正なメール形式です' });

    // すでに使用されていないか確認（大文字小文字を無視）
    const dup = await pool.query(
      'SELECT 1 FROM public.users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1',
      [email, userId]
    );
    if (dup.rows.length > 0) return res.status(409).json({ error: 'このメールアドレスは既に使われています' });

    await pool.query('UPDATE public.users SET email = $1 WHERE id = $2', [email, userId]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
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

      // DB に画像バイナリと MIME を保存
      const sql = `
        UPDATE users
           SET avatar = $1,
               avatar_mime = $2
         WHERE id = $3
         RETURNING id
      `;
      await pool.query(sql, [req.file.buffer, req.file.mimetype, req.user.id]);

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
});

// アバター画像取得
app.get('/api/users/:id/avatar', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) return res.status(400).end();

  const { rows } = await pool.query(
    'SELECT avatar, avatar_mime FROM users WHERE id = $1',
    [userId]
  );
  if (rows.length === 0 || !rows[0].avatar) return res.status(404).end();

  res.set('Content-Type', rows[0].avatar_mime);
  res.send(rows[0].avatar);
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

// 予約作成 [DEPRECATED]
// 旧: POST /api/reservations
// 現在は公式LINEで受け付けています。
app.post('/api/reservations', (_req, res) => {
  return res.status(410).json({
    success: false,
    error: '予約フォームは廃止しました。公式LINEからご予約ください。'
  });
});

// 予約一覧 (管理者) [DEPRECATED]
// 旧: GET /api/reservations
// 予約管理は公式LINE運用に移行しました。
app.get('/api/reservations', authenticateToken, authenticateAdmin, (_req, res) => {
  return res.status(410).json({ error: '予約管理は廃止しました（公式LINE運用）' });
});

// 予約削除 (管理者) [DEPRECATED]
// 旧: DELETE /api/reservations/:id
app.delete('/api/reservations/:id', authenticateToken, authenticateAdmin, (_req, res) => {
  return res.status(410).json({ success: false, error: '予約管理は廃止しました' });
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