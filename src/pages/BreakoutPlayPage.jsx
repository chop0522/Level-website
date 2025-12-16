import React, { useEffect, useMemo } from 'react'
import { Box, Button } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import BreakoutGame from '../components/breakout/BreakoutGame'
import { AuthContext } from '../contexts/TokenContext'
import { useContext } from 'react'
import { computeBreakoutStats } from '../games/breakout/computeBreakoutStats'

export default function BreakoutPlayPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo } = useContext(AuthContext)
  const runId = location.state?.runId || (() => {
    try {
      return sessionStorage.getItem('breakoutRunId')
    } catch (_) {
      return null
    }
  })()

  useEffect(() => {
    if (!runId) return
    try {
      sessionStorage.setItem('breakoutRunId', String(runId))
    } catch (_) {
      // ignore
    }
  }, [runId])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const stats = useMemo(() => computeBreakoutStats(userInfo || {}), [userInfo])

  const handleEnd = () => {
    try {
      sessionStorage.removeItem('breakoutRunId')
    } catch (_) {
      // ignore
    }
    navigate('/mypage/breakout', { replace: true })
  }

  if (!runId) {
    return (
      <>
        <Helmet>
          <title>ブロック崩し プレイ中</title>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            bgcolor: '#000',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box>プレイを開始できませんでした。ロビーに戻ります。</Box>
          <Button variant="contained" size="small" onClick={() => navigate('/mypage/breakout', { replace: true })}>
            戻る
          </Button>
        </Box>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>ブロック崩し プレイ中</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 5000,
          bgcolor: '#000',
        }}
      >
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
          <Button variant="contained" size="small" onClick={() => navigate('/mypage/breakout')}>
            戻る
          </Button>
        </Box>
        <BreakoutGame runId={runId} stats={stats} onEnded={handleEnd} />
      </Box>
    </>
  )
}
