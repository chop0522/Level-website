// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Button
} from '@mui/material';

// ▼ 変更点: getAllReservations, deleteReservation に tokenを渡す
import { getAllReservations, deleteReservation } from '../services/api';

function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ★ ローカルストレージからtoken取得 (またはApp.jsxからprops受け取り)
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      // tokenを渡す
      const data = await getAllReservations(token);
      if (data.error) {
        setError(data.error);
      } else {
        // dataが予約一覧配列を想定
        setReservations(data);
      }
    } catch (err) {
      console.error(err);
      setError('予約一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('本当に削除しますか？')) return;

    try {
      // tokenを渡す
      const res = await deleteReservation(id, token);
      if (res.success) {
        // 削除成功→ローカルstateから削除
        setReservations(prev => prev.filter(r => r.id !== id));
      } else {
        alert(res.error || '削除に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('削除中にエラーが発生しました');
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          管理者用ダッシュボード
        </Typography>

        {loading && <Typography>読み込み中...</Typography>}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && (
          reservations.length === 0 ? (
            <Typography>現在、予約はありません。</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>お名前</TableCell>
                  <TableCell>電話番号</TableCell>
                  <TableCell>日時</TableCell>
                  <TableCell>人数</TableCell>
                  <TableCell>備考</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.map(resv => (
                  <TableRow key={resv.id}>
                    <TableCell>{resv.id}</TableCell>
                    <TableCell>{resv.name}</TableCell>
                    <TableCell>{resv.phone}</TableCell>
                    <TableCell>{resv.date_time}</TableCell>
                    <TableCell>{resv.people}</TableCell>
                    <TableCell>{resv.note}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleDelete(resv.id)}
                      >
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </Paper>
    </Container>
  );
}

export default AdminDashboard;