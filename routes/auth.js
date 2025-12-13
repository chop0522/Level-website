const express = require('express')

function createAuthRouter({ jwt, bcrypt, jwtSecret, jwtExpires, findUserByEmail, createUserInDB }) {
  const router = express.Router()

  // 新規登録
  router.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing fields' })
      }
      const existingUser = await findUserByEmail(email)
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' })
      }

      const saltRounds = 10
      const hashed = await bcrypt.hash(password, saltRounds)
      const newUser = await createUserInDB(name, email, hashed)

      const token = jwt.sign({ id: newUser.id, email, role: newUser.role }, jwtSecret, {
        expiresIn: jwtExpires,
      })
      return res.json({ success: true, token, user: newUser })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // ログイン
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' })
      }
      const userRow = await findUserByEmail(email)
      if (!userRow) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }
      const match = await bcrypt.compare(password, userRow.password_hash)
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = jwt.sign(
        { id: userRow.id, email: userRow.email, role: userRow.role },
        jwtSecret,
        { expiresIn: jwtExpires }
      )
      const userData = {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: userRow.role,
      }
      res.json({ success: true, token, user: userData })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

module.exports = createAuthRouter
