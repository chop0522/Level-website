// src/pages/Register.jsx
import React, { useState } from 'react'
import { TextField, Button, Container, Typography } from '@mui/material'
import { registerUser } from '../services/api'
import { useNavigate } from 'react-router-dom'

function Register({ setToken }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async () => {
    // simple client‑side validation
    if (!name || !email || !password) {
      return setError('全フィールド必須です')
    }
    if (password !== confirm) {
      return setError('パスワードが一致しません')
    }
    try {
      const res = await registerUser({ name, email, password })
      if (res.success) {
        localStorage.setItem('token', res.token)
        setToken(res.token)
        navigate('/mypage')
      } else {
        setError(res.error || 'Register failed')
      }
    } catch (err) {
      console.error(err)
      setError('Register error')
    }
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Register
      </Typography>
      <TextField
        label="Name"
        fullWidth
        margin="normal"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        fullWidth
        margin="normal"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        fullWidth
        margin="normal"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        label="Confirm Password"
        fullWidth
        margin="normal"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      <Button variant="contained" onClick={handleRegister} sx={{ mt: 2 }}>
        Register
      </Button>
    </Container>
  )
}

export default Register
