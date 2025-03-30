// src/pages/Login.jsx
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Typography,
  Box 
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { loginUser } from '../services/api';

// もし Header, Footer を使うなら import
import Header from '../components/Header';
import Footer from '../components/Footer';

function Login({ token, setToken }) {
  const navigate = useNavigate(); // ページ遷移に使う
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await loginUser(email, password);
      if (res.success) {
        // ログイン成功
        localStorage.setItem('token', res.token);
        setToken(res.token);
        alert('Login success!');
        // ログイン後にマイページへ
        navigate('/mypage');
      } else {
        // ログイン失敗時
        alert(res.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login error');
    }
  };

  return (
    <>
      {/*
        // ★ Headerをコメントアウトして二重表示を防ぐ
        // <Header />
      */}

      <Container sx={{ mt: 4, mb: 4, maxWidth: 'sm' }}>
        <Typography variant="h5" gutterBottom>
          ログイン
        </Typography>

        {/* Email */}
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <TextField
          label="Password"
          fullWidth
          margin="normal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleLogin}>
            Login
          </Button>

          {/* Registerへの導線 */}
          <Button
            variant="outlined"
            component={RouterLink}
            to="/register"
          >
            Register
          </Button>
        </Box>
      </Container>

      {/*
        // ★ Footerもコメントアウトして二重表示を防ぐ
        // <Footer />
      */}
    </>
  );
}

export default Login;