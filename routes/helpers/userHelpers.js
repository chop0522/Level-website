function createUserHelpers(pool) {
  const findUserByEmail = async (email) => {
    const sql = 'SELECT * FROM users WHERE email = $1'
    const res = await pool.query(sql, [email])
    if (res.rows.length > 0) {
      // { id, name, email, password_hash, role, xp_stealth, xp_heavy, ... }
      return res.rows[0]
    }
    return null
  }

  const findUserByName = async (name) => {
    const res = await pool.query('SELECT * FROM users WHERE name = $1', [name])
    return res.rows[0] || null
  }

  const createUserInDB = async (name, email, passwordHash) => {
    const sql = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, name, email, role
    `
    const values = [name, email, passwordHash]
    const res = await pool.query(sql, values)
    return res.rows[0]
  }

  return { findUserByEmail, findUserByName, createUserInDB }
}

module.exports = { createUserHelpers }
