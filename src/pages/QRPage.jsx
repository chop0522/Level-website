import React, { useEffect, useState, useContext } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Container, Card, Typography, Button, Alert } from '@mui/material'
import { claimQR } from '../services/api'
import { AuthContext } from '../contexts/TokenContext'
import Confetti from 'react-confetti'
import { Helmet } from 'react-helmet-async'

export default function QRPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useContext(AuthContext)
  const [state, setState] = useState({ status: 'loading', msg: '' })

  useEffect(() => {
    const qrToken = params.get('t') // 署名付きトークン
    if (!token) {
      setState({ status: 'error', msg: 'ログインしてください' })
      return
    }
    if (!qrToken) {
      setState({ status: 'error', msg: 'QRが無効です' })
      return
    }
    ;(async () => {
      const res = await claimQR(token, qrToken)
      if (res.success) {
        setState({
          status: res.rankUp ? 'rankup' : 'success',
          msg: res.rankUp ? `${res.label} にランクアップ！` : `+${res.xpGain} XP`,
        })
      } else {
        setState({ status: 'error', msg: res.error || '本日は取得済みです' })
      }
    })()
  }, [])

  // 画面サイズを取得（SSR 安全ガード）
  const width = typeof window !== 'undefined' ? window.innerWidth : 0
  const height = typeof window !== 'undefined' ? window.innerHeight : 0

  const goHome = () => navigate('/mypage')

  return (
    <Container sx={{ mt: 8 }}>
      <Helmet>
        <title>QRボーナス取得</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="QRコードを読み取ってXPボーナスを受け取るログインユーザー向けページです。"
        />
      </Helmet>
      <Card sx={{ p: 4, textAlign: 'center' }}>
        {state.status === 'loading' && <Typography>読み込み中…</Typography>}
        {state.status === 'success' && (
          <>
            <Typography variant="h4" color="primary">
              +10 XP!
            </Typography>
            <Typography sx={{ mt: 1 }}>{state.msg}</Typography>
            <Button onClick={goHome} sx={{ mt: 2 }}>
              MyPage へ戻る
            </Button>
          </>
        )}
        {state.status === 'rankup' && (
          <>
            <Confetti width={width} height={height} recycle={false} />
            <Typography variant="h4" color="secondary">
              🎉 ランクアップ！
            </Typography>
            <Typography sx={{ mt: 1 }}>{state.msg}</Typography>
            <Button onClick={goHome} sx={{ mt: 2 }}>
              MyPage へ戻る
            </Button>
          </>
        )}
        {state.status === 'error' && <Alert severity="error">{state.msg}</Alert>}
      </Card>
    </Container>
  )
}
