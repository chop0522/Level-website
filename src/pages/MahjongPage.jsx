// src/pages/MahjongPage.jsx
import { useState, useEffect } from 'react';
import { Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import apiFetch from '../api';

export default function MahjongPage() {
  const [tab, setTab] = useState(0);           // 0=今月, 1=先月
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const month = tab === 0
      ? undefined
      : dayjs().subtract(1, 'month').format('YYYY-MM');
    apiFetch(`/api/mahjong/monthly${month ? `?month=${month}` : ''}`)
      .then(r => setRows(r.ranking))
      .catch(console.error);
  }, [tab]);

  return (
    <>
      <Tabs value={tab} onChange={(_e,v)=>setTab(v)}>
        <Tab label="今月" />
        <Tab label="先月" />
      </Tabs>
      <Table sx={{ mt:2 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell><TableCell>名前</TableCell><TableCell>ポイント</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r,i)=>(
            <TableRow key={r.id}>
              <TableCell>{i+1}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.monthly_pt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}