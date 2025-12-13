// src/pages/Signup.jsx
import React, { useState } from 'react'
import { TextField, Button, Container, Typography, Alert } from '@mui/material'
import { registerUser } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/TokenContext'
import { useContext } from 'react'
import { Helmet } from 'react-helmet-async'

export default function Signup() {
  const navigate = useNavigate()
  const { setToken } = useContext(AuthContext)

  // form state
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    const { name, email, password, confirm } = form
    if (!name || !email || !password) {
      return setError('全フィールド必須です')
    }
    if (password !== confirm) {
      return setError('パスワードが一致しません')
    }
    try {
      setLoading(true)
      const res = await registerUser({ name, email, password })
      if (res.success) {
        localStorage.setItem('token', res.token)
        setToken(res.token)
        navigate('/mypage', { replace: true })
      } else {
        setError(res.error || '登録に失敗しました')
      }
    } catch (err) {
      setError('サーバーエラーが発生しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>新規登録</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="ゲームカフェ.Levelの会員登録ページ。お名前とメールアドレスでアカウントを作成し、ランキングやマイページ機能を利用できます。"
        />
      </Helmet>
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{ fontFamily: '"Press Start 2P", monospace', textAlign: 'center' }}
        >
          Sign&nbsp;Up
        </Typography>

        {/* フォーム */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Name"
          name="name"
          fullWidth
          margin="normal"
          value={form.name}
          onChange={handleChange}
        />
        <TextField
          label="Email"
          name="email"
          fullWidth
          margin="normal"
          value={form.email}
          onChange={handleChange}
        />
        <TextField
          label="Password"
          name="password"
          fullWidth
          margin="normal"
          type="password"
          value={form.password}
          onChange={handleChange}
        />
        <TextField
          label="Confirm"
          name="confirm"
          fullWidth
          margin="normal"
          type="password"
          value={form.confirm}
          onChange={handleChange}
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
          onClick={handleSubmit}
        >
          Create&nbsp;Account
        </Button>
      </Container>
    </>
  )
}
