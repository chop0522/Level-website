const express = require('express')

function sortPair(a, b) {
  return a < b ? [a, b] : [b, a]
}

function createSocialRouter({ pool, authenticateToken }) {
  const router = express.Router()

  // ハイタッチ: 1日1回 / ペア
  router.post('/highfive', authenticateToken, async (req, res) => {
    try {
      const fromId = req.user.id
      const toId = parseInt(req.body.target_id, 10)
      if (!toId || fromId === toId) {
        return res.status(400).json({ success: false, error: 'Invalid target' })
      }

      const sqlInsert = `
        INSERT INTO highfives (user_from, user_to, date)
        VALUES ($1, $2, CURRENT_DATE)
        ON CONFLICT (user_from, user_to, date) DO NOTHING
        RETURNING id
      `
      const ins = await pool.query(sqlInsert, [fromId, toId])
      if (ins.rowCount === 0) {
        return res.status(429).json({ success: false, error: '今日のハイタッチは完了しています' })
      }

      const [low, high] = sortPair(fromId, toId)
      const sqlFr = `
        INSERT INTO friendship (user_low, user_high, power)
        VALUES ($1, $2, 1)
        ON CONFLICT (user_low, user_high)
        DO UPDATE SET power = friendship.power + 1
        RETURNING power
      `
      const fr = await pool.query(sqlFr, [low, high])
      res.json({ success: true, power: fr.rows[0].power })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 友情パワー取得
  router.get('/friendship/:id', authenticateToken, async (req, res) => {
    try {
      const selfId = req.user.id
      const otherId = parseInt(req.params.id, 10)
      if (!otherId || selfId === otherId) {
        return res.status(400).json({ success: false, error: 'Invalid id' })
      }

      const [low, high] = sortPair(selfId, otherId)
      const sql = 'SELECT power FROM friendship WHERE user_low=$1 AND user_high=$2'
      const fr = await pool.query(sql, [low, high])
      res.json({ success: true, power: fr.rows[0]?.power || 0 })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 未読ハイタッチ一覧
  router.get('/highfives/unread', authenticateToken, async (req, res) => {
    try {
      const selfId = req.user.id
      const limit = Math.min(parseInt(req.query.limit || '20', 10), 50)

      const sqlUnread = `
        SELECT user_from AS from_id, date
          FROM highfives
         WHERE user_to = $1
           AND date > (
             SELECT COALESCE(last_seen_highfive, '1970-01-01') FROM users WHERE id=$1
           )
      ORDER BY date DESC
         LIMIT $2
      `
      const { rows } = await pool.query(sqlUnread, [selfId, limit])

      await pool.query('UPDATE users SET last_seen_highfive = now() WHERE id = $1', [selfId])

      res.json({ success: true, unread: rows })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: err.message })
    }
  })

  return router
}

module.exports = createSocialRouter
