const express = require('express')

const MAX_PLAYS_PER_DAY = 3
const JST_OFFSET_MS = 9 * 60 * 60 * 1000

function getJstNow() {
  return new Date(Date.now() + JST_OFFSET_MS)
}

function formatDateParts(num) {
  return String(num).padStart(2, '0')
}

function getJstDateString() {
  const jst = getJstNow()
  const y = jst.getUTCFullYear()
  const m = formatDateParts(jst.getUTCMonth() + 1)
  const d = formatDateParts(jst.getUTCDate())
  return `${y}-${m}-${d}`
}

function getNextJstMidnightIso() {
  const jst = getJstNow()
  // JSTの翌日0:00はUTCで前日15:00なので hour=-9 でUTCを求める
  const utcTs = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate() + 1, -9, 0, 0)
  const jstDate = new Date(utcTs + JST_OFFSET_MS)
  const y = jstDate.getUTCFullYear()
  const m = formatDateParts(jstDate.getUTCMonth() + 1)
  const d = formatDateParts(jstDate.getUTCDate())
  const hh = formatDateParts(jstDate.getUTCHours())
  const mm = formatDateParts(jstDate.getUTCMinutes())
  const ss = formatDateParts(jstDate.getUTCSeconds())
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}+09:00`
}

function computeTotalXp(userRow) {
  if (!userRow) return 0
  if (Number.isFinite(userRow.xp_total)) return Number(userRow.xp_total)
  const keys = ['xp_stealth', 'xp_heavy', 'xp_light', 'xp_party', 'xp_gamble', 'xp_quiz']
  return keys.reduce((sum, key) => sum + (Number(userRow[key]) || 0), 0)
}

function computePlaysPerDay(totalXp) {
  let plays = 1
  if (totalXp >= 1000) plays = 3
  else if (totalXp >= 500) plays = 2
  return Math.min(plays, MAX_PLAYS_PER_DAY)
}

async function fetchUserRow(pool, userId) {
  if (!pool) return null
  const sql =
    'SELECT id, name, xp_total, xp_stealth, xp_heavy, xp_light, xp_party, xp_gamble, xp_quiz FROM users WHERE id = $1'
  const { rows } = await pool.query(sql, [userId])
  return rows[0] || null
}

function createBreakoutRouter({ pool, authenticateToken }) {
  const router = express.Router()

  router.get('/status', authenticateToken, async (req, res) => {
    const resetAt = getNextJstMidnightIso()
    const today = getJstDateString()

    try {
      const user = await fetchUserRow(pool, req.user.id)
      const totalXp = computeTotalXp(user)
      const playsPerDay = computePlaysPerDay(totalXp)

      let playsUsed = 0
      if (pool) {
        const { rows } = await pool.query(
          'SELECT COUNT(*) AS cnt FROM breakout_runs WHERE user_id = $1 AND play_date_jst = $2',
          [req.user.id, today]
        )
        playsUsed = Number(rows[0]?.cnt || 0)
      }

      const playsRemaining = Math.max(playsPerDay - playsUsed, 0)

      let best = {
        bestScore: 0,
        bestStageReached: 1,
        bestStageCleared: 0,
        updatedAt: null,
      }

      if (pool) {
        const { rows } = await pool.query(
          'SELECT best_score, best_stage_reached, best_stage_cleared, updated_at FROM breakout_best WHERE user_id = $1',
          [req.user.id]
        )
        if (rows[0]) {
          best = {
            bestScore: Number(rows[0].best_score || 0),
            bestStageReached: Number(rows[0].best_stage_reached || 1),
            bestStageCleared: Number(rows[0].best_stage_cleared || 0),
            updatedAt: rows[0].updated_at,
          }
        }
      }

      return res.json({
        playsPerDay,
        playsUsedToday: playsUsed,
        playsRemaining,
        resetAt,
        best,
      })
    } catch (err) {
      console.error('breakout status error:', err)
      // DBが無くても最低限の情報を返す
      return res.json({
        playsPerDay: 1,
        playsUsedToday: 0,
        playsRemaining: 1,
        resetAt,
        best: {
          bestScore: 0,
          bestStageReached: 1,
          bestStageCleared: 0,
          updatedAt: null,
        },
      })
    }
  })

  router.post('/start', authenticateToken, async (req, res) => {
    const resetAt = getNextJstMidnightIso()
    const today = getJstDateString()

    if (!pool) {
      return res.status(503).json({ error: 'breakout storage unavailable', resetAt })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const user = await fetchUserRow(pool, req.user.id)
      const totalXp = computeTotalXp(user)
      const playsPerDay = computePlaysPerDay(totalXp)

      // ロックを取りつつ件数確認（集約ではなく行ロックで回数競合を防ぐ）
      const { rows: runRows } = await client.query(
        'SELECT id FROM breakout_runs WHERE user_id = $1 AND play_date_jst = $2 FOR UPDATE',
        [req.user.id, today]
      )
      const playsUsed = runRows.length
      const playsRemaining = playsPerDay - playsUsed

      if (playsRemaining <= 0) {
        await client.query('ROLLBACK')
        return res.status(429).json({ error: 'daily limit reached', resetAt, playsRemaining: 0 })
      }

      const insert = await client.query(
        `INSERT INTO breakout_runs (user_id, play_date_jst, started_at)
         VALUES ($1, $2, NOW())
         RETURNING id, started_at`,
        [req.user.id, today]
      )

      await client.query('COMMIT')
      return res.json({
        runId: insert.rows[0].id,
        playsRemaining: playsRemaining - 1,
        startedAt: insert.rows[0].started_at,
        resetAt,
      })
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('breakout start error:', err)
      return res.status(500).json({ error: 'failed to start breakout run' })
    } finally {
      client.release()
    }
  })

  router.post('/submit', authenticateToken, async (req, res) => {
    const { runId, score = 0, stageReached = 1, stageCleared = 0, durationMs = 0, clientVersion = null } =
      req.body || {}

    if (!pool) {
      return res.status(503).json({ error: 'breakout storage unavailable' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const update = await client.query(
        `UPDATE breakout_runs
            SET score = $1,
                stage_reached = $2,
                stage_cleared = $3,
                duration_ms = $4,
                client_version = $5,
                ended_at = NOW()
          WHERE id = $6
            AND user_id = $7
            AND ended_at IS NULL
        RETURNING score, stage_reached, stage_cleared`,
        [Number(score) || 0, Number(stageReached) || 0, Number(stageCleared) || 0, Number(durationMs) || 0, clientVersion, runId, req.user.id]
      )

      if (update.rowCount === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ error: 'run not found or already submitted' })
      }

      const { score: finalScore, stage_reached: finalStage, stage_cleared: finalClear } = update.rows[0]

      const best = await client.query(
        `INSERT INTO breakout_best (user_id, best_score, best_stage_reached, best_stage_cleared, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           best_score = GREATEST(breakout_best.best_score, EXCLUDED.best_score),
           best_stage_reached = GREATEST(breakout_best.best_stage_reached, EXCLUDED.best_stage_reached),
           best_stage_cleared = GREATEST(breakout_best.best_stage_cleared, EXCLUDED.best_stage_cleared),
           updated_at = NOW()
         RETURNING best_score, best_stage_reached, best_stage_cleared`,
        [req.user.id, finalScore, finalStage, finalClear]
      )

      await client.query('COMMIT')

      const bestUpdated =
        best.rows[0].best_score === Number(finalScore) ||
        best.rows[0].best_stage_reached === Number(finalStage) ||
        best.rows[0].best_stage_cleared === Number(finalClear)

      return res.json({ ok: true, bestUpdated })
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('breakout submit error:', err)
      return res.status(500).json({ error: 'failed to submit breakout run' })
    } finally {
      client.release()
    }
  })

  router.get('/leaderboard', authenticateToken, async (req, res) => {
    const scope = req.query.scope === 'daily' ? 'daily' : 'all'
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
    const today = getJstDateString()

    if (!pool) {
      return res.json({ items: [], scope, limit })
    }

    try {
      if (scope === 'daily') {
        const sql = `
          WITH daily AS (
            SELECT DISTINCT ON (user_id)
              user_id,
              score,
              stage_reached,
              stage_cleared
            FROM breakout_runs
            WHERE play_date_jst = $1
            ORDER BY user_id, score DESC, stage_reached DESC, stage_cleared DESC, id DESC
          )
          SELECT
            ROW_NUMBER() OVER (ORDER BY d.score DESC, d.stage_reached DESC, d.stage_cleared DESC) AS rank,
            d.user_id,
            u.name AS display_name,
            d.score,
            d.stage_reached,
            d.stage_cleared
          FROM daily d
          JOIN users u ON u.id = d.user_id
          ORDER BY rank
          LIMIT $2
        `
        const { rows } = await pool.query(sql, [today, limit])
        return res.json({ items: rows, scope, limit })
      } else {
        const sql = `
          SELECT
            ROW_NUMBER() OVER (ORDER BY b.best_score DESC, b.best_stage_reached DESC, b.best_stage_cleared DESC) AS rank,
            b.user_id,
            u.name AS display_name,
            b.best_score AS score,
            b.best_stage_reached AS stage_reached,
            b.best_stage_cleared AS stage_cleared
          FROM breakout_best b
          JOIN users u ON u.id = b.user_id
          ORDER BY rank
          LIMIT $1
        `
        const { rows } = await pool.query(sql, [limit])
        return res.json({ items: rows, scope, limit })
      }
    } catch (err) {
      console.error('breakout leaderboard error:', err)
      return res.status(500).json({ error: 'failed to load leaderboard' })
    }
  })

  router.get('/me', authenticateToken, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100)
    const today = getJstDateString()

    if (!pool) {
      return res.json({
        best: {
          bestScore: 0,
          bestStageReached: 1,
          bestStageCleared: 0,
          updatedAt: null,
        },
        runs: [],
        playsRemaining: 1,
      })
    }

    try {
      const bestSql =
        'SELECT best_score, best_stage_reached, best_stage_cleared, updated_at FROM breakout_best WHERE user_id = $1'
      const bestRes = await pool.query(bestSql, [req.user.id])
      const bestRow = bestRes.rows[0]
      const best = bestRow
        ? {
            bestScore: Number(bestRow.best_score || 0),
            bestStageReached: Number(bestRow.best_stage_reached || 1),
            bestStageCleared: Number(bestRow.best_stage_cleared || 0),
            updatedAt: bestRow.updated_at,
          }
        : {
            bestScore: 0,
            bestStageReached: 1,
            bestStageCleared: 0,
            updatedAt: null,
          }

      const runSql = `
        SELECT id, play_date_jst, started_at, ended_at, score, stage_reached, stage_cleared, duration_ms
          FROM breakout_runs
         WHERE user_id = $1
         ORDER BY started_at DESC
         LIMIT $2
      `
      const runRes = await pool.query(runSql, [req.user.id, limit])

      const user = await fetchUserRow(pool, req.user.id)
      const totalXp = computeTotalXp(user)
      const playsPerDay = computePlaysPerDay(totalXp)
      const { rows: countRows } = await pool.query(
        'SELECT COUNT(*) AS cnt FROM breakout_runs WHERE user_id = $1 AND play_date_jst = $2',
        [req.user.id, today]
      )
      const playsUsedToday = Number(countRows[0]?.cnt || 0)

      return res.json({
        best,
        runs: runRes.rows,
        playsRemaining: Math.max(playsPerDay - playsUsedToday, 0),
      })
    } catch (err) {
      console.error('breakout me error:', err)
      return res.status(500).json({ error: 'failed to load breakout history' })
    }
  })

  return router
}

module.exports = createBreakoutRouter
