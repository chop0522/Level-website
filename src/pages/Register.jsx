// src/pages/Register.jsx
import React, { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import { registerUser } from '../services/api';

function Register({ token, setToken }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const res = await registerUser(name, email, password);
      if (res.success) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
        alert('Register success!');
      } else {
        alert(res.error || 'Register failed');
      }
    } catch (err) {
      console.error(err);
      alert('Register error');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Register</Typography>
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
      <Button variant="contained" onClick={handleRegister} sx={{ mt: 2 }}>
        Register
      </Button>
    </Container>
  );
}

export default Register;