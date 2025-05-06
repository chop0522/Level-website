import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Card, Typography, Button, Alert } from '@mui/material';
import { gainXP } from '../services/api';
import { AuthContext } from '../contexts/TokenContext';

export default function QRPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [state, setState] = useState({ status:'loading', msg:'' });

  useEffect(() => {
    const cat = params.get('cat');
    if (!token) {
      setState({ status:'error', msg:'ログインしてください' });
      return;
    }
    if (!cat) {
      setState({ status:'error', msg:'カテゴリが指定されていません' });
      return;
    }
    (async () => {
      const res = await gainXP(token, cat);
      if (res.success) {
        setState({
          status: res.rankUp ? 'rankup' : 'success',
          msg: res.rankUp
            ? `${res.label} にランクアップ！`
            : `+${res.xpGain} XP`
        });
      } else {
        setState({ status:'error', msg: res.error || '本日は取得済みです' });
      }
    })();
  }, []);

  const goHome = () => navigate('/mypage');

  return (
    <Container sx={{ mt: 8 }}>
      <Card sx={{ p:4, textAlign:'center' }}>
        {state.status === 'loading' && <Typography>読み込み中…</Typography>}
        {state.status === 'success' && (
          <>
            <Typography variant="h4" color="primary">+10 XP!</Typography>
            <Typography sx={{ mt:1 }}>{state.msg}</Typography>
            <Button onClick={goHome} sx={{ mt:2 }}>MyPage へ戻る</Button>
          </>
        )}
        {state.status === 'rankup' && (
          <>
            <Typography variant="h4" color="secondary">🎉 ランクアップ！</Typography>
            <Typography sx={{ mt:1 }}>{state.msg}</Typography>
            <Button onClick={goHome} sx={{ mt:2 }}>MyPage へ戻る</Button>
          </>
        )}
        {state.status === 'error' && (
          <Alert severity="error">{state.msg}</Alert>
        )}
      </Card>
    </Container>
  );
}