

// src/pages/LeaderboardPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Paper
} from '@mui/material';
import { getUsers } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SORT_KEYS = [
  { key: 'total', label: '総合' },
  { key: 'stealth', label: '正体隠匿' },
  { key: 'heavy', label: '重量級' },
  { key: 'light', label: '軽量級' },
  { key: 'party', label: 'パーティ' },
  { key: 'gamble', label: 'ギャンブル' },
  { key: 'quiz', label: 'クイズ' }
];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const sortKey = params.get('tab') || 'total';

  // fetch users whenever sortKey changes
  useEffect(() => {
    setLoading(true);
    (async () => {
      const res = await getUsers(sortKey, 50);
      if (res.success) setUsers(res.users);
      setLoading(false);
    })();
  }, [sortKey]);

  const handleTabChange = (_, newValue) => {
    setParams({ tab: newValue });
  };

  const handleRowClick = (id) => {
    navigate(`/profile/${id}`);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>

      {/* Sort Tabs */}
      <Tabs
        value={sortKey}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {SORT_KEYS.map(({ key, label }) => (
          <Tab key={key} value={key} label={label} />
        ))}
      </Tabs>

      {/* Table */}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>ユーザー</TableCell>
              <TableCell align="right">XP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3}>Loading…</TableCell>
              </TableRow>
            ) : (
              users.map((u, idx) => (
                <TableRow
                  key={u.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(u.id)}
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Avatar
                      src={u.avatar_url}
                      sx={{ width: 28, height: 28, mr: 1, display: 'inline-flex' }}
                    />
                    {u.name || `User${u.id}`}
                  </TableCell>
                  <TableCell align="right">
                    {sortKey === 'total' ? u.xp_total : u[`xp_${sortKey}`]}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}