const express = require('express')
const path = require('path')
const fs = require('fs')
const dayjs = require('dayjs')

function createMahjongRouter({
  pool,
  authenticateToken,
  authenticateAdmin,
  calcMahjongPoint,
  findUserByName,
}) {
  const router = express.Router()

  async function ensureIsTestColumn() {
    await pool.query(`ALTER TABLE public.mahjong_games
      ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false`)
  }

  // 対局登録
  router.post('/mahjong/games', authenticateToken, async (req, res) => {
    try {
      const { rank, finalScore, username, user_id, test } = req.body
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' })
      }
      if (![1, 2, 3, 4].includes(rank) || !Number.isInteger(finalScore)) {
        return res.status(400).json({ error: 'rank(1-4) と整数 finalScore が必要' })
      }

      let targetId = user_id || null
      if (!targetId) {
        const target = await findUserByName(username)
        if (!target) {
          return res.status(404).json({ error: 'User not found' })
        }
        targetId = target.id
      }

      const point = calcMahjongPoint(rank, finalScore)

      const isTest = !!test
      if (isTest) {
        await ensureIsTestColumn()
        await pool.query(
          `INSERT INTO mahjong_games (user_id, rank, final_score, point, is_test)
           VALUES ($1, $2, $3, $4, true)`,
          [targetId, rank, finalScore, point]
        )
        return res.json({ success: true, point, test: true })
      }

      await pool.query(
        `INSERT INTO mahjong_games (user_id, rank, final_score, point)
         VALUES ($1, $2, $3, $4)`,
        [targetId, rank, finalScore, point]
      )

      await pool.query('UPDATE users SET total_pt = total_pt + $1 WHERE id = $2', [
        point,
        targetId,
      ])

      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly')

      res.json({ success: true, point, test: false })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // 4人分一括登録
  router.post('/mahjong/matches', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { results = [], test } = req.body || {}
      if (!Array.isArray(results) || results.length !== 4) {
        return res.status(400).json({ error: 'results は4件の配列で送ってください' })
      }

      const ranks = results.map((r) => r.rank)
      const rankSet = new Set(ranks)
      if (!(rankSet.size === 4 && [1, 2, 3, 4].every((n) => rankSet.has(n)))) {
        return res.status(400).json({ error: 'rank は 1,2,3,4 を各1回ずつにしてください' })
      }

      const TOTAL = 100000
      let missingIndex = -1
      let sumKnown = 0

      const normalized = results.map((r, i) => {
        const v = r.finalScore
        if (v === undefined || v === null || v === '' || Number.isNaN(Number(v))) {
          if (missingIndex >= 0) {
            throw new Error(
              'finalScore は3名分を数値で、残り1名のみ未指定にしてください（合計100,000で自動計算）'
            )
          }
          missingIndex = i
          return { ...r, finalScore: null }
        }
        const n = Number(v)
        sumKnown += n
        return { ...r, finalScore: n }
      })

      if (missingIndex >= 0) {
        normalized[missingIndex].finalScore = TOTAL - sumKnown
        sumKnown = TOTAL
      } else {
        if (sumKnown !== TOTAL) {
          return res.status(400).json({ error: `4人の合計が100,000ではありません（現在: ${sumKnown}）` })
        }
      }

      const anyTest = !!test || normalized.some((r) => !!r.test)
      if (anyTest) {
        await ensureIsTestColumn()
      }

      let updatedRealTotals = false

      await pool.query('BEGIN')
      try {
        for (const r of normalized) {
          if (![1, 2, 3, 4].includes(r.rank) || !Number.isFinite(Number(r.finalScore))) {
            throw new Error('rank(1-4) と数値 finalScore が必要です')
          }
          let userId = r.user_id || null
          if (!userId && r.username) {
            const target = await findUserByName(r.username)
            if (!target) throw new Error(`User not found: ${r.username}`)
            userId = target.id
          }
          if (!userId) throw new Error('user_id か username のいずれかを指定してください')

          const point = calcMahjongPoint(r.rank, Number(r.finalScore))
          const rowIsTest = r.test !== undefined ? !!r.test : !!test

          if (rowIsTest) {
            await pool.query(
              `INSERT INTO mahjong_games (user_id, rank, final_score, point, is_test)
               VALUES ($1, $2, $3, $4, true)`,
              [userId, r.rank, Number(r.finalScore), point]
            )
          } else {
            await pool.query(
              `INSERT INTO mahjong_games (user_id, rank, final_score, point)
               VALUES ($1, $2, $3, $4)`,
              [userId, r.rank, Number(r.finalScore), point]
            )
            await pool.query('UPDATE users SET total_pt = total_pt + $1 WHERE id = $2', [
              point,
              userId,
            ])
            updatedRealTotals = true
          }
        }
        await pool.query('COMMIT')
      } catch (e) {
        await pool.query('ROLLBACK')
        throw e
      }

      if (updatedRealTotals) {
        await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly')
      }

      res.json({ success: true, testMode: anyTest && !updatedRealTotals })
    } catch (err) {
      console.error(err)
      res.status(400).json({ error: err.message })
    }
  })

  // 既存対局の修正
  router.patch('/mahjong/games/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id)
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' })

      await ensureIsTestColumn()

      const {
        rows: [orig],
      } = await pool.query(
        'SELECT id, user_id, rank, final_score, point, is_test, played_at FROM public.mahjong_games WHERE id = $1',
        [id]
      )
      if (!orig) return res.status(404).json({ error: 'game not found' })

      const nextRank = req.body.rank ?? orig.rank
      const nextFinal =
        req.body.finalScore !== undefined ? Number(req.body.finalScore) : orig.final_score
      if (![1, 2, 3, 4].includes(nextRank) || !Number.isFinite(nextFinal)) {
        return res.status(400).json({ error: 'rank(1-4) と数値 finalScore が必要' })
      }

      let nextUserId = req.body.user_id || orig.user_id
      if (!nextUserId && req.body.username) {
        const target = await findUserByName(req.body.username)
        if (!target) return res.status(404).json({ error: 'User not found' })
        nextUserId = target.id
      }

      const hasIsTest = Object.prototype.hasOwnProperty.call(req.body, 'is_test')
      const nextIsTest = hasIsTest
        ? req.body.is_test === true ||
          req.body.is_test === 'true' ||
          req.body.is_test === 1 ||
          req.body.is_test === '1'
        : !!orig.is_test

      const newPoint = calcMahjongPoint(nextRank, nextFinal)
      const oldPoint = orig.point

      let touchedReal = false

      await pool.query('BEGIN')
      try {
        await pool.query(
          `UPDATE public.mahjong_games
             SET user_id = $1, rank = $2, final_score = $3, point = $4, is_test = $5
           WHERE id = $6`,
          [nextUserId, nextRank, nextFinal, newPoint, nextIsTest, id]
        )

        if (!orig.is_test && !nextIsTest) {
          if (nextUserId !== orig.user_id) {
            await pool.query('UPDATE public.users SET total_pt = total_pt - $1 WHERE id = $2', [
              oldPoint,
              orig.user_id,
            ])
            await pool.query('UPDATE public.users SET total_pt = total_pt + $1 WHERE id = $2', [
              newPoint,
              nextUserId,
            ])
            touchedReal = true
          } else {
            const delta = newPoint - oldPoint
            if (delta !== 0) {
              await pool.query('UPDATE public.users SET total_pt = total_pt + $1 WHERE id = $2', [
                delta,
                orig.user_id,
              ])
              touchedReal = true
            }
          }
        } else if (!orig.is_test && nextIsTest) {
          await pool.query('UPDATE public.users SET total_pt = total_pt - $1 WHERE id = $2', [
            oldPoint,
            orig.user_id,
          ])
          touchedReal = true
        } else if (orig.is_test && !nextIsTest) {
          await pool.query('UPDATE public.users SET total_pt = total_pt + $1 WHERE id = $2', [
            newPoint,
            nextUserId,
          ])
          touchedReal = true
        }

        await pool.query('COMMIT')
      } catch (e) {
        await pool.query('ROLLBACK')
        throw e
      }

      if (touchedReal) {
        await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly')
      }

      res.json({ success: true, id, is_test: nextIsTest })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // 既存対局の削除
  router.delete('/mahjong/games/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id)
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' })

      await ensureIsTestColumn()

      const { rows } = await pool.query(
        'SELECT id, user_id, point, is_test FROM public.mahjong_games WHERE id = $1',
        [id]
      )
      if (rows.length === 0) return res.status(404).json({ error: 'game not found' })
      const orig = rows[0]

      await pool.query('BEGIN')
      try {
        await pool.query('DELETE FROM public.mahjong_games WHERE id = $1', [id])
        if (!orig.is_test) {
          await pool.query('UPDATE public.users SET total_pt = total_pt - $1 WHERE id = $2', [
            orig.point,
            orig.user_id,
          ])
        }
        await pool.query('COMMIT')
      } catch (e) {
        await pool.query('ROLLBACK')
        throw e
      }

      if (!orig.is_test) {
        await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly')
      }

      res.json({ success: true, id })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // 対局一覧（管理者）
  router.get('/mahjong/games', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { month, test, limit = 50 } = req.query

      await ensureIsTestColumn()

      const params = []
      let where = 'WHERE 1=1'

      if (month) {
        where += ` AND date_trunc('month', (g.played_at AT TIME ZONE 'Asia/Tokyo'))::date = $${params.length + 1}::date`
        params.push(`${month}-01`)
      }

      if (test === 'true') {
        where += ' AND g.is_test = true'
      } else if (test === 'false') {
        where += ' AND g.is_test = false'
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
      `
      params.push(Math.max(1, Math.min(parseInt(limit, 10) || 50, 500)))

      const { rows } = await pool.query(sql, params)
      res.json({ success: true, rows })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // 月間ランキング取得
  router.get('/mahjong/monthly', async (req, res) => {
    try {
      const month = req.query.month || null
      const responseMonth = req.query.month || dayjs().startOf('month').format('YYYY-MM')
      const sql = `
        SELECT
          u.id,
          u.name,
          m.total_points AS monthly_pt,
          m.games AS monthly_games,
          COALESCE(u.total_pt, 0) AS total_pt
        FROM public.mahjong_monthly m
        JOIN public.users u ON u.id = m.user_id
        WHERE m.month = COALESCE(
          $1::date,
          date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo'))::date
        )
        ORDER BY m.total_points DESC
        LIMIT 100
      `
      const { rows } = await pool.query(sql, [month ? `${month}-01` : null])
      res.json({ success: true, month: responseMonth, ranking: rows })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // 通算ランキング
  router.get('/mahjong/lifetime', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '100', 10), 200)
      const sql = `
        SELECT u.id, u.name, COALESCE(u.total_pt, 0) AS total_pt,
               (
                 SELECT COUNT(*) FROM public.mahjong_games g
                  WHERE g.user_id = u.id AND (g.is_test IS NOT TRUE)
               ) AS game_count
          FROM public.users u
         WHERE u.role <> 'admin'
           AND EXISTS (
                 SELECT 1 FROM public.mahjong_games g
                  WHERE g.user_id = u.id
                    AND (g.is_test IS NOT TRUE)
               )
      ORDER BY total_pt DESC
         LIMIT $1
      `
      const { rows } = await pool.query(sql, [limit])
      res.json({ success: true, ranking: rows })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // 管理者: 月次ランキング再構築
  router.post(
    '/admin/mahjong/rebuild-monthly',
    authenticateToken,
    authenticateAdmin,
    async (_req, res) => {
      try {
        const sqlPath = path.join(__dirname, '..', 'scripts', 'refresh_mahjong.sql')
        const sqlText = fs.readFileSync(sqlPath, 'utf8')
        await pool.query(sqlText)
        res.json({ success: true, message: 'mahjong_monthly rebuilt' })
      } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, error: err.message })
      }
    }
  )

  // [DEPRECATED] 月間ポイント調整
  router.post('/admin/monthlyPt', authenticateToken, authenticateAdmin, (_req, res) => {
    return res.status(410).json({
      success: false,
      error:
        '廃止されたエンドポイントです。対局編集（/api/mahjong/games）とランキング再構築（/api/admin/mahjong/rebuild-monthly）を使用してください。',
    })
  })

  return router
}

module.exports = createMahjongRouter
