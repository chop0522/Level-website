import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
} from '@mui/material'
import apiFetch from '../../services/api'

/**
 * 管理者専用: 指定ユーザーの月間ポイントを調整するダイアログ
 *
 * Props:
 *   open         boolean
 *   onClose      () => void
 *   onSuccess    () => void   (成功後に呼ばれるコールバック)
 */
export default function AdminMonthlyPtDialog({ open, onClose, onSuccess }) {
  const [users, setUsers] = useState([])
  const [userId, setUserId] = useState('')
  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [pt, setPt] = useState(0)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // ユーザー一覧を取得
  useEffect(() => {
    if (!open) return
    apiFetch('/api/admin/users/list')
      .then((list) => {
        // list = [{ id, name }]
        setUsers(list)
        if (!userId && list.length) setUserId(list[0].id)
      })
      .catch(() => setUsers([]))
  }, [open])

  const handleSubmit = async () => {
    if (!userId || !yearMonth) {
      setErr('ユーザーと年月を選択してください')
      return
    }
    try {
      setLoading(true)
      await apiFetch('/api/admin/monthlyPt', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          year_month: yearMonth,
          pt: Number(pt),
        }),
      })
      onSuccess?.()
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>月間ポイントを調整</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          <TextField
            select
            label="ユーザー"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            fullWidth
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="対象年月 (YYYY-MM)"
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            fullWidth
          />

          <TextField
            label="ポイント (整数, ±OK)"
            type="number"
            value={pt}
            onChange={(e) => setPt(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" disabled={loading} onClick={handleSubmit}>
          反映
        </Button>
      </DialogActions>
    </Dialog>
  )
}
