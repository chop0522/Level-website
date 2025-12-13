const express = require('express')

function createDeprecatedRouter({ authenticateToken, authenticateAdmin }) {
  const router = express.Router()

  router.post('/reservations', (_req, res) => {
    return res.status(410).json({
      success: false,
      error: '予約フォームは廃止しました。公式LINEからご予約ください。',
    })
  })

  router.get('/reservations', authenticateToken, authenticateAdmin, (_req, res) => {
    return res.status(410).json({ error: '予約管理は廃止しました（公式LINE運用）' })
  })

  router.delete('/reservations/:id', authenticateToken, authenticateAdmin, (_req, res) => {
    return res.status(410).json({ success: false, error: '予約管理は廃止しました' })
  })

  router.delete('/admin/users/:id', authenticateToken, authenticateAdmin, (_req, res) => {
    return res.status(410).json({
      success: false,
      error:
        'ユーザー削除APIは廃止しました（410）。必要な場合は運用手順で統合してください。',
    })
  })

  router.get('/admin/users', authenticateToken, authenticateAdmin, (_req, res) => {
    return res.status(410).json({ error: '廃止されたエンドポイントです（/api/admin/users/list は存続）' })
  })

  return router
}

module.exports = createDeprecatedRouter
