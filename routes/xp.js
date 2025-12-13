const express = require('express')

function createXpRouter({ pool, jwt, qrSecret, authenticateToken }) {
  const router = express.Router()

  async function checkDailyCategory(userId, category) {
    const sql = `
      SELECT 1 FROM daily_category
       WHERE user_id = $1
         AND category = $2
         AND date = CURRENT_DATE
    `
    const res = await pool.query(sql, [userId, category])
    return res.rows.length > 0
  }

  async function insertDailyRecord(userId, category) {
    const sql = `
      INSERT INTO daily_category (user_id, category)
      VALUES ($1, $2)
    `
    await pool.query(sql, [userId, category])
  }

  async function gainCategoryXP(userId, category, xpGained) {
    let sql
    if (category === 'stealth') {
      sql = 'UPDATE users SET xp_stealth = xp_stealth + $1 WHERE id=$2 RETURNING xp_stealth'
    } else if (category === 'heavy') {
      sql = 'UPDATE users SET xp_heavy = xp_heavy + $1 WHERE id=$2 RETURNING xp_heavy'
    } else if (category === 'light') {
      sql = 'UPDATE users SET xp_light = xp_light + $1 WHERE id=$2 RETURNING xp_light'
    } else if (category === 'party') {
      sql = 'UPDATE users SET xp_party = xp_party + $1 WHERE id=$2 RETURNING xp_party'
    } else if (category === 'gamble') {
      sql = 'UPDATE users SET xp_gamble = xp_gamble + $1 WHERE id=$2 RETURNING xp_gamble'
    } else if (category === 'quiz') {
      sql = 'UPDATE users SET xp_quiz = xp_quiz + $1 WHERE id=$2 RETURNING xp_quiz'
    } else {
      throw new Error('Unknown category: ' + category)
    }
    const res = await pool.query(sql, [xpGained, userId])
    return res.rows[0]
  }

  async function getRankInfo(category, currentXP) {
    const sql = `
      SELECT rank, label, badge_url
        FROM xp_ranks
       WHERE category = $1
         AND required_xp <= $2
    ORDER BY rank DESC
       LIMIT 1
    `
    const res = await pool.query(sql, [category, currentXP])
    return res.rows[0] || null
  }

  async function getNextRankInfo(category, currentXP) {
    const sql = `
      SELECT rank, required_xp
        FROM xp_ranks
       WHERE category = $1
         AND required_xp > $2
    ORDER BY required_xp ASC
       LIMIT 1
    `
    const res = await pool.query(sql, [category, currentXP])
    return res.rows[0] || null
  }

  // カテゴリXP加算
  router.post('/gameCategory', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id
      const { category } = req.body
      if (!category) {
        return res.status(400).json({ error: 'Missing category' })
      }

      const { rows: [userRow] } = await pool.query('SELECT id, xp_total FROM users WHERE id = $1', [
        userId,
      ])
      if (!userRow) {
        return res.status(404).json({ error: 'User not found' })
      }

      const alreadyGot = await checkDailyCategory(userId, category)
      if (alreadyGot) {
        return res.json({ success: false, msg: 'You already got XP for this category today.' })
      }

      const xpGain = 10
      const updatedVal = await gainCategoryXP(userId, category, xpGain)
      await insertDailyRecord(userId, category)
      await pool.query('UPDATE users SET xp_total = xp_total + $1 WHERE id = $2', [xpGain, userId])

      const currentXP = Object.values(updatedVal)[0]
      const newRank = await getRankInfo(category, currentXP)
      const prevRank = await getRankInfo(category, currentXP - xpGain)
      const rankUp = !prevRank || newRank.rank > prevRank.rank
      const nextRank = await getNextRankInfo(category, currentXP)

      res.json({
        success: true,
        xpGain,
        currentXP,
        rank: newRank.rank,
        label: newRank.label,
        badge_url: newRank.badge_url,
        rankUp,
        next_required_xp: nextRank ? nextRank.required_xp : null,
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // QRコード用 XP クレーム
  router.post('/qr/claim', authenticateToken, async (req, res) => {
    try {
      const { token } = req.body
      if (!token) {
        return res.status(400).json({ success: false, error: 'Missing QR token' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, qrSecret) // { cat }
      } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired QR token' })
      }
      const category = decoded.cat
      if (!['stealth', 'heavy', 'light', 'party', 'gamble', 'quiz'].includes(category)) {
        return res.status(400).json({ success: false, error: 'Invalid category' })
      }

      const userId = req.user.id
      const {
        rows: [userRow],
      } = await pool.query('SELECT id FROM users WHERE id = $1', [userId])
      if (!userRow) return res.status(404).json({ success: false, error: 'User not found' })

      const already = await checkDailyCategory(userId, category)
      if (already) {
        return res.json({ success: false, error: 'Already claimed today' })
      }

      const xpGain = 10
      const updatedVal = await gainCategoryXP(userId, category, xpGain)
      await insertDailyRecord(userId, category)
      await pool.query('UPDATE users SET xp_total = xp_total + $1 WHERE id = $2', [xpGain, userId])

      const currentXP = Object.values(updatedVal)[0]
      const newRank = await getRankInfo(category, currentXP)
      const prevRank = await getRankInfo(category, currentXP - xpGain)
      const rankUp = !prevRank || newRank.rank > prevRank.rank
      const nextRank = await getNextRankInfo(category, currentXP)

      res.json({
        success: true,
        xpGain,
        currentXP,
        rank: newRank.rank,
        label: newRank.label,
        badge_url: newRank.badge_url,
        rankUp,
        next_required_xp: nextRank ? nextRank.required_xp : null,
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // Achievements
  router.get('/achievements', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id
      const {
        rows: [userRow],
      } = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
      if (!userRow) {
        return res.status(404).json({ success: false, error: 'User not found' })
      }

      const rankSql = `
        SELECT rank, label, badge_url
          FROM xp_total_ranks
         WHERE required_xp <= $1
      ORDER BY rank DESC
         LIMIT 1
      `
      const rankRes = await pool.query(rankSql, [userRow.xp_total])
      const totalRank = rankRes.rows[0]

      res.json({
        success: true,
        xp_total: userRow.xp_total,
        totalRank,
        user: userRow,
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // XP付与 (管理者操作) [DEPRECATED]
  router.post('/giveXP', authenticateToken, (_req, res) => {
    return res.status(410).json({
      success: false,
      error: '廃止されたエンドポイントです。XP は通常の記録フローで自動加算されます。',
    })
  })

  return router
}

module.exports = createXpRouter
