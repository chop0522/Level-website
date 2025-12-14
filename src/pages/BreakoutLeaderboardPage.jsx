import React, { useEffect, useState } from 'react'
import { Container, Typography, ToggleButton, ToggleButtonGroup, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { getBreakoutLeaderboard } from '../services/api'

export default function BreakoutLeaderboardPage() {
  const [scope, setScope] = useState('all')
  const [rows, setRows] = useState([])

  useEffect(() => {
    const load = async () => {
      const res = await getBreakoutLeaderboard(scope, 50)
      setRows(res?.items || [])
    }
    load()
  }, [scope])

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>ブロック崩しランキング</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Typography variant="h4" component="h1" gutterBottom>
        ブロック崩しランキング
      </Typography>
      <ToggleButtonGroup
        color="primary"
        value={scope}
        exclusive
        onChange={(_, val) => val && setScope(val)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all">総合</ToggleButton>
        <ToggleButton value="daily">今日</ToggleButton>
      </ToggleButtonGroup>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>名前</TableCell>
              <TableCell align="right">スコア</TableCell>
              <TableCell align="right">到達</TableCell>
              <TableCell align="right">クリア</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>データがありません</TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={`${scope}-${r.user_id}-${r.rank}`}>
                  <TableCell>{r.rank}</TableCell>
                  <TableCell>{r.display_name || `User${r.user_id}`}</TableCell>
                  <TableCell align="right">{r.score}</TableCell>
                  <TableCell align="right">{r.stage_reached}</TableCell>
                  <TableCell align="right">{r.stage_cleared}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  )
}
