// src/pages/Login.jsx
import React, { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import { loginUser } from '../services/api';

function Login({ token, setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await loginUser(email, password);
      if (res.success) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
        alert('Login success!');
      } else {
        alert(res.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login error');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Login</Typography>
      <TextField
        label="Email"
        fullWidth
        margin="normal"
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
      <Button variant="contained" onClick={handleLogin} sx={{ mt: 2 }}>
        Login
      </Button>
    </Container>
  );
}

export default Login;