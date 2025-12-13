const express = require('express')

function createEventsRouter({ pool, authenticateToken, authenticateAdmin }) {
  const router = express.Router()

  router.get('/events', async (_req, res) => {
    const safeEmpty = () => res.status(200).json([])
    try {
      if (!pool) return safeEmpty()
      const sql = 'SELECT id, title, start, "end", all_day FROM events ORDER BY start ASC'
      const result = await pool.query(sql)
      res.json(result.rows)
    } catch (err) {
      console.error('GET /events failed:', err?.message || err)
      safeEmpty()
    }
  })

  router.post('/events', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { title, start, end, allDay } = req.body
      if (!title || !start || !end) {
        return res.status(400).json({ error: 'Missing fields' })
      }
      const sql = `
        INSERT INTO events (title, start, "end", all_day)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, start, "end", all_day
      `
      const values = [title, start, end, allDay || false]
      const result = await pool.query(sql, values)
      res.json(result.rows[0])
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/events/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params
      const { title, start, end, allDay } = req.body
      if (!title || !start || !end) {
        return res.status(400).json({ error: 'Missing fields' })
      }
      const sql = `
        UPDATE events
           SET title=$1, start=$2, "end"=$3, all_day=$4
         WHERE id=$5
         RETURNING id, title, start, "end", all_day
      `
      const values = [title, start, end, allDay || false, id]
      const result = await pool.query(sql, values)
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' })
      }
      res.json(result.rows[0])
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  router.delete('/events/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params
      const sql = 'DELETE FROM events WHERE id=$1 RETURNING id'
      const result = await pool.query(sql, [id])
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' })
      }
      res.json({ success: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

module.exports = createEventsRouter
