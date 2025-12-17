import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, CardContent, Divider, Grid, Stack, Typography, Alert } from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/TokenContext'
import { computeBreakoutStats } from '../games/breakout/computeBreakoutStats'
import { getBreakoutStatus, startBreakoutRun } from '../services/api'

function StatRow({ label, value }) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" fontWeight="bold">
        {value}
      </Typography>
    </Stack>
  )
}

export default function BreakoutPage() {
  const { userInfo } = useContext(AuthContext)
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const stats = useMemo(() => computeBreakoutStats(userInfo || {}), [userInfo])

  const loadStatus = useCallback(async () => {
    try {
      const res = await getBreakoutStatus()
      setStatus(res)
    } catch (e) {
      setError('ステータスの取得に失敗しました')
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleStart = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await startBreakoutRun()
      if (!res || res.error || !res.runId) {
        setError(res?.error || 'プレイ開始に失敗しました')
      } else {
        try {
          sessionStorage.setItem('breakoutRunId', String(res.runId))
        } catch (_) {
          // ignore sessionStorage failures (Safari private mode等)
        }
        navigate('/mypage/breakout/play', { state: { runId: res.runId } })
      }
    } catch (e) {
      setError('プレイ開始に失敗しました')
    } finally {
      setLoading(false)
      loadStatus()
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Helmet>
        <title>ブロック崩し</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <Typography variant="h4" component="h1" gutterBottom>
        ブロック崩し（ベータ）
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        カテゴリXPに応じてパドル速度・幅・クリティカル・ドロップ率・フォーカス・シャドーセーブが強化されます。
        プレイ開始すると専用画面に移動します。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                ステータス
              </Typography>
              {status ? (
                <Stack spacing={1}>
                  <StatRow label="1日の上限" value={status.playsPerDay} />
                  <StatRow label="今日の使用回数" value={status.playsUsedToday} />
                  <StatRow label="残り回数" value={status.playsRemaining} />
                  <StatRow label="リセット" value={status.resetAt} />
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    ベスト
                  </Typography>
                  <StatRow label="スコア" value={status.best?.bestScore ?? 0} />
                  <StatRow label="到達" value={status.best?.bestStageReached ?? 1} />
                  <StatRow label="クリア" value={status.best?.bestStageCleared ?? 0} />
                </Stack>
              ) : (
                <Typography>読み込み中…</Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                XPによる効果
              </Typography>
              <Stack spacing={1}>
                <StatRow label="パドル幅 (party)" value={`${Math.round(stats.paddleWidth)} px`} />
                <StatRow label="初期ライフ (party)" value={stats.startLives} />
                <StatRow label="キャッチ率 (light)" value={`${Math.round((stats.catchChance || 0) * 100)}%`} />
                <StatRow label="キャッチCT (light)" value={`${(stats.catchCooldownSec || 0).toFixed(1)}s`} />
                <StatRow label="クリティカル (heavy)" value={`${Math.round(stats.critChance * 100)}%`} />
                <StatRow label="ドロップ率 (gamble)" value={`${Math.round(stats.dropChance * 100)}%`} />
                <StatRow label="フォーカス秒 (quiz)" value={`${stats.focusMax.toFixed(1)}s`} />
                <StatRow label="反射ノイズ (quiz)" value={`${stats.reflectionNoiseDeg.toFixed(1)}°`} />
                <StatRow label="シャドーセーブ (hidden)" value={stats.shadowSaves} />
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={handleStart} disabled={loading}>
              プレイ開始
            </Button>
            <Button variant="outlined" onClick={() => navigate('/mypage/breakout/leaderboard')}>
              ランキング
            </Button>
            <Button variant="outlined" onClick={() => navigate('/mypage/breakout/history')}>
              戦績
            </Button>
          </Stack>
          <Typography variant="body2">
            操作: ← → / A D で移動、Spaceで発射、Shift/FOCUSボタンで「短時間スロー（ゲージ消費）」。モバイルはドラッグで移動、タップで発射、右下FOCUSをタップで短時間スロー。
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                プレイの流れ
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                1. 「プレイ開始」ボタンで1回分を消費し、ゲーム専用画面に移動します。
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                2. スコア送信後はロビーに戻り、ベストや残り回数が更新されます。
              </Typography>
              <Typography variant="body2">
                3. ランキング・戦績は各ボタンから確認できます。
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                モバイルではゲーム中ヘッダー/フッターを非表示にし、画面スクロールを停止してCanvasを全画面に表示します。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
