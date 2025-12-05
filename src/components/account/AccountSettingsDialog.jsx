// src/components/account/AccountSettingsDialog.jsx
import React, { useEffect, useMemo, useState, useContext } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
  InputAdornment,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  Box,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { changePassword, deleteAccount, updateProfile } from '../../services/api'
import { AuthContext } from '../../contexts/TokenContext'

/**
 * アカウント設定ダイアログ（改良版）
 * - 表示名（公開名）の変更
 * - パスワード変更（強度表示・一致チェック・表示切替）
 * - 退会（確認画面）
 */
export default function AccountSettingsDialog({ open, onClose, onLogout }) {
  const { token, setUserInfo, userInfo } = useContext(AuthContext)

  const [mode, setMode] = useState('settings') // settings | confirmDelete
  const [newName, setNewName] = useState('')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConf, setShowConf] = useState(false)

  const [error, setError] = useState('')
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  const normalizeName = (s) => (s || '').replace(/\s+/g, ' ').trim()
  const originalName = userInfo?.name || ''
  const originalEmail = userInfo?.email || ''

  useEffect(() => {
    if (open) {
      setMode('settings')
      setNewName(originalName)
      setNewEmail(originalEmail)
      setOldPw('')
      setNewPw('')
      setConfirmPw('')
      setError('')
      setSnack({ open: false, message: '', severity: 'success' })
    }
  }, [open, originalName, originalEmail])

  const cleanName = normalizeName(newName)
  const canSaveName = !!cleanName && cleanName !== originalName && cleanName.length <= 32
  const cleanEmail = (newEmail || '').trim()
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  const canSaveEmail =
    emailValid && cleanEmail.toLowerCase() !== (originalEmail || '').toLowerCase()

  const pwMatch = newPw === confirmPw
  const pwScore = useMemo(() => {
    const p = newPw || ''
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[a-z]/.test(p)) s++
    if (/\d/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    const label = s >= 4 ? '強い' : s >= 3 ? '普通' : '弱い'
    const color = s >= 4 ? 'success.main' : s >= 3 ? 'warning.main' : 'error.main'
    return { s, label, color }
  }, [newPw])
  const canSavePw =
    !!oldPw && !!newPw && !!confirmPw && pwMatch && newPw.length >= 8 && newPw !== oldPw

  const openSnack = (message, severity = 'success') => setSnack({ open: true, message, severity })
  const closeSnack = () => setSnack((v) => ({ ...v, open: false }))

  const handleClose = () => {
    setMode('settings')
    onClose()
  }

  // ユーザー名変更
  const handleChangeName = async () => {
    setError('')
    if (!canSaveName) return
    try {
      const res = await updateProfile(token, { name: cleanName })
      if (res.success) {
        if (setUserInfo) setUserInfo((prev) => ({ ...prev, name: cleanName }))
        openSnack('表示名を変更しました', 'success')
        handleClose()
      } else {
        const msg = res.error || '変更に失敗しました'
        setError(msg)
        openSnack(msg, 'error')
      }
    } catch (e) {
      const msg = e.message || '変更に失敗しました'
      setError(msg)
      openSnack(msg, 'error')
    }
  }

  // メールアドレス変更（トークンのみで認証・重複チェックあり）
  const handleChangeEmail = async () => {
    setError('')
    if (!canSaveEmail) return
    try {
      const res = await fetch('/api/me/email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: cleanEmail }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.error) throw new Error(data?.error || '変更に失敗しました')
      if (setUserInfo) setUserInfo((prev) => ({ ...prev, email: cleanEmail }))
      openSnack('メールアドレスを変更しました', 'success')
    } catch (e) {
      const msg = e.message || '変更に失敗しました'
      setError(msg)
      openSnack(msg, 'error')
    }
  }

  // パスワード変更
  const handleChangePw = async () => {
    setError('')
    if (!canSavePw) return
    try {
      const res = await changePassword(oldPw, newPw, token)
      if (res.success) {
        setOldPw('')
        setNewPw('')
        setConfirmPw('')
        openSnack('パスワードを変更しました', 'success')
      } else {
        const msg = res.error || '変更に失敗しました'
        setError(msg)
        openSnack(msg, 'error')
      }
    } catch (e) {
      const msg = e.message || '変更に失敗しました'
      setError(msg)
      openSnack(msg, 'error')
    }
  }

  // 退会
  const handleDelete = async () => {
    try {
      const res = await deleteAccount(token)
      if (res.success) {
        onLogout()
      } else {
        const msg = res.error || '退会に失敗しました'
        setError(msg)
        openSnack(msg, 'error')
      }
    } catch (e) {
      const msg = e.message || '退会に失敗しました'
      setError(msg)
      openSnack(msg, 'error')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      scroll="paper"
      sx={{ zIndex: 13000 }}
      PaperProps={{ sx: { my: { xs: 2, sm: 4 } } }}
    >
      {mode === 'settings' ? (
        <>
          <DialogTitle>アカウント設定</DialogTitle>
          <DialogContent dividers>
            {error && (
              <Typography color="error" sx={{ mb: 1 }}>
                {error}
              </Typography>
            )}

            {/* プロフィール */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                プロフィール（表示名）
              </Typography>
              <TextField
                label="表示名（公開）"
                fullWidth
                margin="dense"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSaveName) handleChangeName()
                }}
                helperText={`${cleanName.length}/32  — スペースは1つに整形されます`}
                inputProps={{ maxLength: 64 }}
              />
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {/* セキュリティ */}
            <Box>
              <TextField
                label="ログイン用メール"
                type="email"
                fullWidth
                margin="dense"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                helperText={emailValid ? '有効なメール形式です' : '例: user@example.com'}
                error={!!newEmail && !emailValid}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSaveEmail) handleChangeEmail()
                }}
              />
              <TextField
                label="現在のパスワード"
                type={showOld ? 'text' : 'password'}
                fullWidth
                margin="dense"
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowOld((v) => !v)}
                        edge="end"
                        aria-label="toggle current password"
                      >
                        {showOld ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="新しいパスワード"
                type={showNew ? 'text' : 'password'}
                fullWidth
                margin="dense"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                helperText={
                  <span
                    style={{
                      color: `var(--mui-palette-${pwScore.s >= 4 ? 'success' : pwScore.s >= 3 ? 'warning' : 'error'}-main, ${pwScore.color})`,
                    }}
                  >
                    強度: {pwScore.label}
                  </span>
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNew((v) => !v)}
                        edge="end"
                        aria-label="toggle new password"
                      >
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="新しいパスワード（確認）"
                type={showConf ? 'text' : 'password'}
                fullWidth
                margin="dense"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                error={!!confirmPw && !pwMatch}
                helperText={
                  confirmPw && !pwMatch
                    ? 'パスワードが一致しません'
                    : '8文字以上推奨／英大小・数字・記号の組み合わせが強力です'
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSavePw) handleChangePw()
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConf((v) => !v)}
                        edge="end"
                        aria-label="toggle confirm password"
                      >
                        {showConf ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button color="error" onClick={() => setMode('confirmDelete')}>
              退会する
            </Button>
            <Button variant="outlined" onClick={handleChangeName} disabled={!canSaveName}>
              名前を変更
            </Button>
            <Button variant="outlined" onClick={handleChangeEmail} disabled={!canSaveEmail}>
              メールを変更
            </Button>
            <Button onClick={handleClose}>閉じる</Button>
            <Button variant="contained" onClick={handleChangePw} disabled={!canSavePw}>
              パスワード変更
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle>本当に退会しますか？</DialogTitle>
          <DialogContent dividers>
            <Typography>この操作は取り消せません。データは削除されます。</Typography>
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMode('settings')}>キャンセル</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>
              退会する
            </Button>
          </DialogActions>
        </>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Dialog>
  )
}
