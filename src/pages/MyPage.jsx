// src/pages/MyPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Button } from '@mui/material';
import { getUserInfo } from '../services/api';
import { useNavigate } from 'react-router-dom';

function MyPage({ token }) {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!token) {
      alert('ログインしてください');
      navigate('/login');
      return;
    }
    fetchUserInfo();
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const data = await getUserInfo(token);
      if (data.error) {
        alert('ユーザー情報の取得に失敗しました');
      } else {
        setUserInfo(data);
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>My Page</Typography>
      {userInfo ? (
        <>
          <Typography>ようこそ, {userInfo.name}さん</Typography>
          <Typography>登録メール: {userInfo.email}</Typography>
          {/* ここで麻雀の役リストやスコアを表示する機能を実装可能 */}
        </>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </Container>
  );
}

export default MyPage;