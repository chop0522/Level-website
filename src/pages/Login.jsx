// src/pages/Login.jsx
import React, { useState } from 'react'
import { TextField, Button, Container, Typography, Box } from '@mui/material'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { loginUser } from '../services/api'
import { Helmet } from 'react-helmet-async'

function Login({ setToken }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      return setError('メールとパスワードを入力してください')
    }
    try {
      setLoading(true)
      const res = await loginUser(email, password)
      if (res.success) {
        localStorage.setItem('token', res.token)
        setToken(res.token)
        navigate('/mypage')
      } else {
        setError(res.error || 'ログインに失敗しました')
      }
    } catch (err) {
      console.error(err)
      setError('サーバーエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>ログイン</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="ゲームカフェ.Levelの会員向けログインページです。登録済みメールアドレスとパスワードでサインインしてください。"
        />
      </Helmet>
      {/*
        // Header, Footerを使う場合はコメントアウト解除
        // ただしApp.jsxで表示しているなら二重表示を防ぐためにコメントアウトのまま
        // <Header />
      */}

      <Container sx={{ mt: 4, mb: 4, maxWidth: 'sm' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          ログイン
        </Typography>

        {/* メールアドレス入力 (白背景＋黒文字) */}
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff', // 白背景
              color: '#000000', // 黒文字
            },
            '& .MuiFormLabel-root': {
              color: '#000000', // ラベルも黒に
            },
          }}
        />

        {/* パスワード入力 (白背景＋黒文字) */}
        <TextField
          label="Password"
          fullWidth
          margin="normal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              color: '#000000',
            },
            '& .MuiFormLabel-root': {
              color: '#000000',
            },
          }}
        />

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleLogin} disabled={loading}>
            Login
          </Button>

          {/* 新規登録への導線 */}
          <Button variant="outlined" component={RouterLink} to="/signup">
            Register
          </Button>
        </Box>
      </Container>
    </>
  )
}

export default Login
