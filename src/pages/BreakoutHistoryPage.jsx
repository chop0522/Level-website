import React, { useEffect, useState } from 'react'
import { Container, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { getMyBreakoutHistory } from '../services/api'

export default function BreakoutHistoryPage() {
  const [best, setBest] = useState(null)
  const [runs, setRuns] = useState([])

  useEffect(() => {
    const load = async () => {
      const res = await getMyBreakoutHistory(30)
      setBest(res?.best || null)
      setRuns(res?.runs || [])
    }
    load()
  }, [])

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>ブロック崩し戦績</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Typography variant="h4" component="h1" gutterBottom>
        ブロック崩し戦績
      </Typography>
      {best && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          ベスト: スコア {best.bestScore} / 到達 {best.bestStageReached} / クリア {best.bestStageCleared}
        </Typography>
      )}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>日時</TableCell>
              <TableCell align="right">スコア</TableCell>
              <TableCell align="right">到達</TableCell>
              <TableCell align="right">クリア</TableCell>
              <TableCell align="right">時間(ms)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>データがありません</TableCell>
              </TableRow>
            ) : (
              runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.started_at}</TableCell>
                  <TableCell align="right">{r.score}</TableCell>
                  <TableCell align="right">{r.stage_reached}</TableCell>
                  <TableCell align="right">{r.stage_cleared}</TableCell>
                  <TableCell align="right">{r.duration_ms}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  )
}
