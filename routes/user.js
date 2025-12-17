const express = require('express')

function leaderboardOrder(sortKey) {
  switch (sortKey) {
    case 'stealth':
      return 'xp_stealth DESC'
    case 'heavy':
      return 'xp_heavy DESC'
    case 'light':
      return 'xp_light DESC'
    case 'party':
      return 'xp_party DESC'
    case 'gamble':
      return 'xp_gamble DESC'
    case 'quiz':
      return 'xp_quiz DESC'
    default:
      return 'xp_total DESC'
  }
}

function createUserRouter({
  pool,
  jwt,
  jwtSecret,
  bcrypt,
  authenticateToken,
  authenticateAdmin,
  upload,
  findUserByEmail,
}) {
  const router = express.Router()

  // ユーザー情報 (要JWT)
  router.get('/userinfo', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id
      let userRow = null

      const byId = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
      if (byId.rows.length > 0) {
        userRow = byId.rows[0]
      } else {
        const { email } = req.user
        userRow = await findUserByEmail(email)
      }

      if (!userRow) {
        return res.status(404).json({ error: 'User not found' })
      }

      const userData = {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: userRow.role,
        xp_stealth: userRow.xp_stealth,
        xp_heavy: userRow.xp_heavy,
        xp_light: userRow.xp_light,
        xp_party: userRow.xp_party,
        xp_gamble: userRow.xp_gamble,
        xp_quiz: userRow.xp_quiz,
        xp_total: userRow.xp_total,
        total_pt: userRow.total_pt,
        monthly_pt: userRow.monthly_pt,
        mahjong_rank: userRow.mahjong_rank,
        mahjong_subrank: userRow.mahjong_subrank,
      }

      try {
        const {
          rows: [mjStats],
        } = await pool.query(
          `SELECT 
              COALESCE(MAX(final_score), 0) AS highest_score,
              COALESCE(AVG(final_score), 0) AS average_score,
              COALESCE(AVG(rank), 0) AS average_rank,
              COALESCE(COUNT(*) FILTER (WHERE rank = 1), 0) AS rank1_count,
              COALESCE(COUNT(*) FILTER (WHERE rank = 2), 0) AS rank2_count,
              COALESCE(COUNT(*) FILTER (WHERE rank = 3), 0) AS rank3_count,
              COALESCE(COUNT(*) FILTER (WHERE rank = 4), 0) AS rank4_count,
              COALESCE(COUNT(*), 0) AS game_count
           FROM public.mahjong_games
           WHERE user_id = $1 AND (is_test IS NOT TRUE)`,
          [userId]
        )
        userData.highest_score = Number(mjStats?.highest_score ?? 0)
        userData.average_score = Number(mjStats?.average_score ?? 0)
        userData.average_rank = Number(mjStats?.average_rank ?? 0)
        userData.rank1_count = Number(mjStats?.rank1_count ?? 0)
        userData.rank2_count = Number(mjStats?.rank2_count ?? 0)
        userData.rank3_count = Number(mjStats?.rank3_count ?? 0)
        userData.rank4_count = Number(mjStats?.rank4_count ?? 0)
        userData.game_count = Number(mjStats?.game_count ?? 0)
      } catch (e) {
        console.warn('failed to fetch mahjong stats for userinfo:', e?.message || e)
        userData.highest_score = 0
        userData.average_score = 0
        userData.average_rank = 0
        userData.rank1_count = 0
        userData.rank2_count = 0
        userData.rank3_count = 0
        userData.rank4_count = 0
        userData.game_count = 0
      }
      return res.json(userData)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // アバター画像アップロード
  router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const sql = `
        UPDATE users
           SET avatar = $1,
               avatar_mime = $2
         WHERE id = $3
         RETURNING id
      `
      await pool.query(sql, [req.file.buffer, req.file.mimetype, req.user.id])

      res.json({ success: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // アバター画像取得
  router.get('/users/:id/avatar', async (req, res) => {
    const userId = parseInt(req.params.id, 10)
    if (isNaN(userId)) return res.status(400).end()

    const { rows } = await pool.query('SELECT avatar, avatar_mime FROM users WHERE id = $1', [
      userId,
    ])
    if (rows.length === 0 || !rows[0].avatar) return res.status(404).end()

    res.set('Content-Type', rows[0].avatar_mime)
    res.send(rows[0].avatar)
  })

  // 公開ユーザー一覧（Leaderboard）
  router.get('/users', async (req, res) => {
    try {
      const sort = req.query.sort || 'total'
      const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
      const order = leaderboardOrder(sort)

      const sql = `
        SELECT id, name,
               xp_total, xp_stealth, xp_heavy, xp_light,
               xp_party, xp_gamble, xp_quiz
          FROM users
         WHERE is_public IS NOT FALSE
           AND role <> 'admin'
      ORDER BY ${order}
         LIMIT $1
      `
      const result = await pool.query(sql, [limit])
      res.json({ success: true, users: result.rows })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 公開プロフィール
  router.get('/profile/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10)
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid id' })
      }
      const sql = `
        SELECT id, name, avatar_url, bio,
               xp_total, xp_stealth, xp_heavy, xp_light,
               xp_party, xp_gamble, xp_quiz,
               total_pt, monthly_pt,
               is_public
          FROM users
         WHERE id = $1
      `
      const result = await pool.query(sql, [userId])
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' })
      }
      const profile = result.rows[0]

      if (profile.is_public === false) {
        const authHeader = req.headers['authorization'] || ''
        const token = authHeader.split(' ')[1]
        if (!token) {
          return res.status(403).json({ success: false, error: 'Profile is private' })
        }
        let decoded
        try {
          decoded = jwt.verify(token, jwtSecret)
        } catch {
          return res.status(403).json({ success: false, error: 'Invalid token' })
        }
        if (decoded.id !== userId) {
          return res.status(403).json({ success: false, error: 'Profile is private' })
        }
      }

      delete profile.is_public

      try {
        const {
          rows: [mjStats],
        } = await pool.query(
          `SELECT 
              COALESCE(MAX(final_score), 0) AS highest_score,
              COALESCE(AVG(final_score), 0) AS average_score,
              COALESCE(AVG(rank), 0) AS average_rank,
              COALESCE(COUNT(*) FILTER (WHERE rank = 1), 0) AS rank1_count,
              COALESCE(COUNT(*) FILTER (WHERE rank = 2), 0) AS rank2_count,
              COALESCE(COUNT(*) FILTER (WHERE rank = 3), 0) AS rank3_count,
              COALESCE(COUNT(*) FILTER (WHERE rank = 4), 0) AS rank4_count,
              COALESCE(COUNT(*), 0) AS game_count
           FROM public.mahjong_games
           WHERE user_id = $1 AND (is_test IS NOT TRUE)`,
          [userId]
        )
        profile.highest_score = Number(mjStats?.highest_score ?? 0)
        profile.average_score = Number(mjStats?.average_score ?? 0)
        profile.average_rank = Number(mjStats?.average_rank ?? 0)
        profile.rank1_count = Number(mjStats?.rank1_count ?? 0)
        profile.rank2_count = Number(mjStats?.rank2_count ?? 0)
        profile.rank3_count = Number(mjStats?.rank3_count ?? 0)
        profile.rank4_count = Number(mjStats?.rank4_count ?? 0)
        profile.game_count = Number(mjStats?.game_count ?? 0)
      } catch (e) {
        console.warn('failed to fetch mahjong stats for public profile:', e?.message || e)
        profile.highest_score = 0
        profile.average_score = 0
        profile.average_rank = 0
        profile.rank1_count = 0
        profile.rank2_count = 0
        profile.rank3_count = 0
        profile.rank4_count = 0
        profile.game_count = 0
      }

      res.json({ success: true, profile })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // プロフィール取得
  router.get('/profile', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id
      const { rows } = await pool.query(
        'SELECT id, name, avatar_url, bio FROM users WHERE id = $1',
        [userId]
      )
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
      const userRow = rows[0]
      res.json({
        id: userRow.id,
        name: userRow.name,
        avatar_url: userRow.avatar_url,
        bio: userRow.bio,
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // プロフィール更新
  router.patch('/profile', authenticateToken, async (req, res) => {
    try {
      const { name, avatar_url, bio } = req.body
      if (name === undefined && avatar_url === undefined && bio === undefined) {
        return res.status(400).json({ error: 'No fields to update' })
      }
      const userId = req.user.id
      const fields = []
      const values = []
      if (name !== undefined) {
        fields.push('name')
        values.push(name)
      }
      if (avatar_url !== undefined) {
        fields.push('avatar_url')
        values.push(avatar_url)
      }
      if (bio !== undefined) {
        fields.push('bio')
        values.push(bio)
      }

      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
      const sql = `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING id, name, avatar_url, bio`
      values.push(userId)
      const result = await pool.query(sql, values)
      res.json({ success: true, user: result.rows[0] })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // Display name change
  router.put('/users/me/name', authenticateToken, async (req, res) => {
    try {
      const { name } = req.body
      if (!name) {
        return res.status(400).json({ error: 'Name required' })
      }

      const sql = 'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name'
      const { rows } = await pool.query(sql, [name, req.user.id])

      res.json({ success: true, user: rows[0] })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // Password change
  router.put('/users/me/password', authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password required' })
      }

      const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [
        req.user.id,
      ])
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const valid = await bcrypt.compare(currentPassword, rows[0].password_hash)
      if (!valid) {
        return res.status(403).json({ error: 'Wrong current password' })
      }

      const newHash = await bcrypt.hash(newPassword, 10)
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id])

      res.json({ success: true, message: 'Password updated' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // メール変更
  router.patch('/me/email', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ error: 'unauthorized' })

      const email = (req.body?.email || '').trim()
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      if (!emailOk) return res.status(400).json({ error: '不正なメール形式です' })

      const dup = await pool.query(
        'SELECT 1 FROM public.users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1',
        [email, userId]
      )
      if (dup.rows.length > 0) return res.status(409).json({ error: 'このメールアドレスは既に使われています' })

      await pool.query('UPDATE public.users SET email = $1 WHERE id = $2', [email, userId])
      return res.json({ success: true })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: err.message })
    }
  })

  // 管理者: ユーザー簡易リスト
  router.get('/admin/users/list', authenticateToken, authenticateAdmin, async (_req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, name FROM users ORDER BY name')
      res.json(rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

module.exports = createUserRouter
