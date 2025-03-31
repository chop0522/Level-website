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
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await loginUser(email, password);
      if (res.success) {
        // ログイン成功 → トークンを保存＆App.jsxに反映
        localStorage.setItem('token', res.token);
        setToken(res.token);
        alert('ログインに成功しました！');
        // ログイン後にマイページへ
        navigate('/mypage');
      } else {
        // ログイン失敗時
        alert(res.error || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('ログイン時にエラーが発生しました');
    }
  };

  return (
    <>
      {/*
        // Header, Footerを使う場合はコメントアウト解除
        // ただしApp.jsxで表示しているなら二重表示を防ぐためにコメントアウトのまま
        // <Header />
      */}

      <Container sx={{ mt: 4, mb: 4, maxWidth: 'sm' }}>
        <Typography variant="h5" gutterBottom>
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
              color: '#000000'            // 黒文字
            },
            '& .MuiFormLabel-root': {
              color: '#000000'            // ラベルも黒に
            }
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
              color: '#000000'
            },
            '& .MuiFormLabel-root': {
              color: '#000000'
            }
          }}
        />

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleLogin}>
            Login
          </Button>

          {/* 新規登録への導線 */}
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
        // <Footer />
      */}
    </>
  );
}

export default Login;