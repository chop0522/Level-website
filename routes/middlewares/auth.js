function createAuthMiddleware({ jwt, jwtSecret, pool, findUserByEmail }) {
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }
    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Token missing' })
    }
    jwt.verify(token, jwtSecret, (err, userData) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' })
      }
      req.user = userData // { email }
      next()
    })
  }

  const authenticateAdmin = async (req, res, next) => {
    try {
      const { id, email } = req.user
      let userRow = null

      if (id) {
        const byId = await pool.query('SELECT * FROM users WHERE id = $1', [id])
        if (byId.rows.length > 0) userRow = byId.rows[0]
      }
      if (!userRow && email) {
        userRow = await findUserByEmail(email)
      }

      if (!userRow) {
        return res.status(404).json({ error: 'User not found' })
      }
      if (userRow.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' })
      }
      next()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  }

  return { authenticateToken, authenticateAdmin }
}

module.exports = { createAuthMiddleware }
