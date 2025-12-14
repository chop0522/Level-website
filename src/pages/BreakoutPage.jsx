import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Alert,
  Grid,
  LinearProgress,
  Divider,
} from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { useContext } from 'react'
import { AuthContext } from '../contexts/TokenContext'
import { getBreakoutStatus, startBreakoutRun, submitBreakoutRun } from '../services/api'
import { BASE_CONFIG, COLORS, ITEM_TYPES } from '../games/breakout/breakoutConfig'
import { computeBreakoutStats } from '../games/breakout/computeBreakoutStats'

const GAME_STATE = {
  READY: 'ready',
  RUNNING: 'running',
  OVER: 'over',
}

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

function useAnimationFrame(callback, enabled) {
  const rafRef = useRef()
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return
    const loop = (ts) => {
      cbRef.current?.(ts)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [enabled])
}

function createBlocks(stage) {
  const blocks = []
  const rows = BASE_CONFIG.block.baseRows + Math.floor((stage - 1) / 2)
  const cols = BASE_CONFIG.block.baseCols
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hp = Math.min(BASE_CONFIG.block.hpRange[1], BASE_CONFIG.block.hpRange[0] + Math.floor(stage / 2))
      const baseHp = Math.max(BASE_CONFIG.block.hpRange[0], Math.min(hp, BASE_CONFIG.block.hpRange[1]))
      const isIndestructible = stage >= BASE_CONFIG.block.indestructibleFromStage && Math.random() < 0.08
      blocks.push({
        x: BASE_CONFIG.block.offsetLeft + c * (BASE_CONFIG.block.width + BASE_CONFIG.block.padding),
        y: BASE_CONFIG.block.offsetTop + r * (BASE_CONFIG.block.height + BASE_CONFIG.block.padding),
        width: BASE_CONFIG.block.width,
        height: BASE_CONFIG.block.height,
        hp: isIndestructible ? Infinity : Math.max(1, Math.min(3, baseHp)),
        baseHp: isIndestructible ? Infinity : Math.max(1, Math.min(3, baseHp)),
        indestructible: isIndestructible,
      })
    }
  }
  return blocks
}

function pickItem(weights) {
  const entries = ITEM_TYPES.map((k) => [k, weights[k] || 1])
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [k, w] of entries) {
    if ((r -= w) <= 0) return k
  }
  return entries[0][0]
}

export default function BreakoutPage() {
  const { userInfo } = useContext(AuthContext)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [runId, setRunId] = useState(null)
  const [gameState, setGameState] = useState(GAME_STATE.READY)
  const [stage, setStage] = useState(1)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [shadowSaves, setShadowSaves] = useState(0)
  const [focusGauge, setFocusGauge] = useState(0)
  const [focusActive, setFocusActive] = useState(false)
  const [balls, setBalls] = useState([])
  const [blocks, setBlocks] = useState([])
  const [items, setItems] = useState([])
  const [effects, setEffects] = useState({})
  const [lastTs, setLastTs] = useState(0)
  const canvasRef = useRef(null)
  const pointerActive = useRef(false)
  const pointerX = useRef(0)

  const stats = useMemo(() => computeBreakoutStats(userInfo || {}), [userInfo])

  const resetStage = useCallback(
    (stageNum, keepScore = true) => {
      const startLives = stats.startLives
      setStage(stageNum)
      setBlocks(createBlocks(stageNum))
      setBalls([{ x: BASE_CONFIG.canvas.width / 2, y: BASE_CONFIG.canvas.height - 80, vx: 180, vy: -220 }])
      setShadowSaves(stats.shadowSaves)
      setFocusGauge(stats.focusMax)
      setEffects({})
      setItems([])
      setLastTs(0)
      if (!keepScore) setScore(0)
      setLives((prev) => (keepScore ? prev : startLives))
    },
    [stats]
  )

  const loadStatus = useCallback(async () => {
    const s = await getBreakoutStatus()
    setStatus(s)
  }, [])

  useEffect(() => {
    resetStage(1, false)
    loadStatus()
  }, [loadStatus, resetStage])

  const handleStart = async () => {
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await startBreakoutRun()
      if (res?.error) {
        setError(res.error)
      } else {
        setRunId(res.runId)
        setMessage(`プレイ開始 (残り ${res.playsRemaining} 回)`)
        setGameState(GAME_STATE.RUNNING)
        resetStage(1, false)
      }
    } catch (e) {
      setError(e.message || '開始に失敗しました')
    } finally {
      setLoading(false)
      loadStatus()
    }
  }

  const endRun = useCallback(
    async (finalScore, finalStage, finalCleared) => {
      if (!runId) return
      try {
        await submitBreakoutRun({
          runId,
          score: finalScore,
          stageReached: finalStage,
          stageCleared: finalCleared,
          durationMs: 0,
        })
      } catch (e) {
        console.error(e)
      } finally {
        setRunId(null)
        setGameState(GAME_STATE.OVER)
        loadStatus()
      }
    },
    [runId, loadStatus]
  )

  const loseLife = useCallback(() => {
    setLives((prev) => prev - 1)
    setBalls([{ x: BASE_CONFIG.canvas.width / 2, y: BASE_CONFIG.canvas.height - 80, vx: 180, vy: -220 }])
    setFocusGauge(stats.focusMax)
    setEffects({})
    setItems([])
  }, [stats.focusMax])

  const handleCanvasClick = useCallback(() => {
    if (gameState !== GAME_STATE.RUNNING) return
    if (balls.length === 0) {
      setBalls([{ x: BASE_CONFIG.canvas.width / 2, y: BASE_CONFIG.canvas.height - 80, vx: 180, vy: -220 }])
    }
  }, [balls.length, gameState])

  const updateBalls = useCallback(
    (dt) => {
      let nextBalls = [...balls]
      const paddleEffectWide = effects.WIDE
      const paddleWidth = stats.paddleWidth * (paddleEffectWide ? 1.4 : 1)
      const paddleY = BASE_CONFIG.canvas.height - 40
      const paddleX = Math.max(
        paddleWidth / 2,
        Math.min(pointerX.current, BASE_CONFIG.canvas.width - paddleWidth / 2)
      )
      const speedScale = effects.SLOW ? 0.7 : 1
      const ballRadius = BASE_CONFIG.ballRadius
      const newItems = []
      const newBlocks = [...blocks]
      let addScore = 0

      nextBalls = nextBalls
        .map((ball) => {
          let { x, y, vx, vy } = ball
          const speed = Math.hypot(vx, vy) || 1
          const normVx = vx / speed
          const normVy = vy / speed
          const targetSpeed = BASE_CONFIG.ballSpeed * speedScale
          vx = normVx * targetSpeed
          vy = normVy * targetSpeed

          x += vx * dt
          y += vy * dt

          // walls
          if (x < ballRadius) {
            x = ballRadius
            vx = Math.abs(vx)
          } else if (x > BASE_CONFIG.canvas.width - ballRadius) {
            x = BASE_CONFIG.canvas.width - ballRadius
            vx = -Math.abs(vx)
          }
          if (y < ballRadius) {
            y = ballRadius
            vy = Math.abs(vy)
          }

          // paddle collision
          if (
            y + ballRadius >= paddleY &&
            y + ballRadius <= paddleY + 16 &&
            x >= paddleX - paddleWidth / 2 &&
            x <= paddleX + paddleWidth / 2 &&
            vy > 0
          ) {
            const rel = (x - paddleX) / (paddleWidth / 2)
            const angle = (Math.PI / 3) * rel + (stats.reflectionNoiseDeg * Math.PI) / 180 * (Math.random() - 0.5)
            const speedAfter = Math.hypot(vx, vy)
            vx = Math.sin(angle) * speedAfter
            vy = -Math.abs(Math.cos(angle) * speedAfter)
            y = paddleY - ballRadius - 1
          }

          // block collision (simple AABB)
          for (const block of newBlocks) {
            if (block.hp <= 0) continue
            if (
              x + ballRadius > block.x &&
              x - ballRadius < block.x + block.width &&
              y + ballRadius > block.y &&
              y - ballRadius < block.y + block.height
            ) {
              // reflect
              const overlapLeft = x + ballRadius - block.x
              const overlapRight = block.x + block.width - (x - ballRadius)
              const overlapTop = y + ballRadius - block.y
              const overlapBottom = block.y + block.height - (y - ballRadius)
              const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
              if (minOverlap === overlapLeft) {
                x = block.x - ballRadius
                vx = -Math.abs(vx)
              } else if (minOverlap === overlapRight) {
                x = block.x + block.width + ballRadius
                vx = Math.abs(vx)
              } else if (minOverlap === overlapTop) {
                y = block.y - ballRadius
                vy = -Math.abs(vy)
              } else {
                y = block.y + block.height + ballRadius
                vy = Math.abs(vy)
              }

              if (!block.indestructible) {
                const isCrit = Math.random() < stats.critChance
                const dmg = isCrit ? 2 : 1
                block.hp -= dmg
                if (block.hp <= 0) {
                  addScore += BASE_CONFIG.score.destroy * block.baseHp
                  if (Math.random() < stats.dropChance) {
                    newItems.push({
                      type: pickItem(stats.itemWeights),
                      x: block.x + block.width / 2,
                      y: block.y,
                      vy: 120,
                    })
                  }
                }
              }
              break
            }
          }

          return { x, y, vx, vy }
        })
        .filter((ball) => {
          if (ball.y - ballRadius > BASE_CONFIG.canvas.height) {
            return false
          }
          return true
        })

      // handle balls out
      if (nextBalls.length === 0) {
        if (shadowSaves > 0) {
          setShadowSaves((s) => s - 1)
          nextBalls = [{ x: BASE_CONFIG.canvas.width / 2, y: BASE_CONFIG.canvas.height - 80, vx: 180, vy: -220 }]
        } else {
          loseLife()
        }
      }

      if (addScore) setScore((prev) => prev + addScore)
      if (newItems.length) setItems((prev) => [...prev, ...newItems])
      setBlocks(newBlocks)
      setBalls(nextBalls)
    },
    [balls, blocks, effects.SLOW, effects.WIDE, loseLife, shadowSaves, stats]
  )

  const updateItems = useCallback(
    (dt) => {
      if (!items.length) return
      const paddleEffectWide = effects.WIDE
      const paddleWidth = stats.paddleWidth * (paddleEffectWide ? 1.4 : 1)
      const paddleY = BASE_CONFIG.canvas.height - 40
      const paddleX = Math.max(
        paddleWidth / 2,
        Math.min(pointerX.current, BASE_CONFIG.canvas.width - paddleWidth / 2)
      )

      const next = []
      items.forEach((item) => {
        const y = item.y + item.vy * dt
        if (y > BASE_CONFIG.canvas.height) return
        const x = item.x
        const caught =
          y >= paddleY - 10 &&
          y <= paddleY + 10 &&
          x >= paddleX - paddleWidth / 2 &&
          x <= paddleX + paddleWidth / 2
        if (caught) {
          const now = performance.now()
          setEffects((prev) => ({
            ...prev,
            [item.type]: now + BASE_CONFIG.drop.durationMs,
          }))
          if (item.type === 'MULTI') {
            setBalls((prev) => [...prev, ...prev.map((b) => ({ ...b, vx: -b.vx }))])
          }
          if (item.type === 'LIFE') {
            setLives((l) => l + 1)
          }
          return
        }
        next.push({ ...item, y })
      })
      setItems(next)
    },
    [effects.WIDE, items, stats.paddleWidth]
  )

  const clearEffects = useCallback(() => {
    const now = performance.now()
    const next = {}
    let changed = false
    for (const key of Object.keys(effects)) {
      if (effects[key] > now) {
        next[key] = effects[key]
      } else {
        changed = true
      }
    }
    if (changed) setEffects(next)
  }, [effects])

  useAnimationFrame(
    (ts) => {
      if (gameState !== GAME_STATE.RUNNING) return
      const last = lastTs || ts
      let dt = (ts - last) / 1000
      if (dt > BASE_CONFIG.dtClampMs / 1000) dt = BASE_CONFIG.dtClampMs / 1000

      const timeScale = focusActive ? stats.focusTimeScale : 1
      const scaledDt = dt * timeScale

      updateBalls(scaledDt)
      updateItems(scaledDt)
      clearEffects()

      // focus gauge
      setFocusGauge((prev) => {
        if (focusActive) return Math.max(0, prev - dt)
        return Math.min(stats.focusMax, prev + dt * 0.5)
      })

      setLastTs(ts)

      // stage clear check
      const aliveBlocks = blocks.filter((b) => b.hp > 0 && !b.indestructible)
      const totalBlocks = blocks.filter((b) => b.hp > 0)
      if (totalBlocks.length === 0 || aliveBlocks.length === 0) {
        const bonus = stage * BASE_CONFIG.score.clearStage + lives * BASE_CONFIG.score.lifeBonus
        setScore((prev) => prev + bonus)
        resetStage(stage + 1, true)
      }
    },
    gameState === GAME_STATE.RUNNING
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = BASE_CONFIG.canvas.width * dpr
    canvas.height = BASE_CONFIG.canvas.height * dpr
    canvas.style.width = `${BASE_CONFIG.canvas.width}px`
    canvas.style.height = `${BASE_CONFIG.canvas.height}px`
    ctx.scale(dpr, dpr)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, BASE_CONFIG.canvas.width, BASE_CONFIG.canvas.height)

    // paddle
    const paddleEffectWide = effects.WIDE
    const paddleWidth = stats.paddleWidth * (paddleEffectWide ? 1.4 : 1)
    const paddleX = Math.max(
      paddleWidth / 2,
      Math.min(pointerX.current, BASE_CONFIG.canvas.width - paddleWidth / 2)
    )
    const paddleY = BASE_CONFIG.canvas.height - 40
    ctx.fillStyle = COLORS.paddle
    ctx.fillRect(paddleX - paddleWidth / 2, paddleY, paddleWidth, 14)

    // balls
    ctx.fillStyle = COLORS.ball
    balls.forEach((b) => {
      ctx.beginPath()
      ctx.arc(b.x, b.y, BASE_CONFIG.ballRadius, 0, Math.PI * 2)
      ctx.fill()
    })

    // blocks
    blocks.forEach((block) => {
      if (block.hp <= 0) return
      ctx.fillStyle = block.indestructible
        ? COLORS.blockIndestructible
        : COLORS.blockHp[Math.min(block.baseHp - 1, COLORS.blockHp.length - 1)]
      ctx.fillRect(block.x, block.y, block.width, block.height)
    })

    // items
    items.forEach((item) => {
      ctx.fillStyle = COLORS.item[item.type] || '#fff'
      ctx.beginPath()
      ctx.arc(item.x, item.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.font = '10px sans-serif'
      ctx.fillText(item.type[0], item.x - 4, item.y + 4)
    })

    // HUD
    ctx.fillStyle = COLORS.text
    ctx.font = '14px sans-serif'
    ctx.fillText(`Stage ${stage}`, 20, 24)
    ctx.fillText(`Score ${score}`, 20, 44)
    ctx.fillText(`Lives ${lives} (Shadow ${shadowSaves})`, 20, 64)
    ctx.fillText(`Focus ${focusGauge.toFixed(1)}s`, 20, 84)
  }, [balls, blocks, effects.WIDE, focusGauge, items, lives, score, shadowSaves, stage, stats.paddleWidth])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setFocusActive(e.type === 'keydown' && focusGauge > 0)
      }
      if (e.code === 'Space' && e.type === 'keydown') {
        handleCanvasClick()
      }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        if (e.type === 'keydown') pointerActive.current = true
        const dir = e.type === 'keydown' ? -1 : 0
        const move = () => {
          if (dir === 0) return
          pointerX.current = Math.max(
            stats.paddleWidth / 2,
            Math.min(
              pointerX.current + dir * stats.paddleSpeed * 0.016,
              BASE_CONFIG.canvas.width - stats.paddleWidth / 2
            )
          )
          if (pointerActive.current) requestAnimationFrame(move)
        }
        move()
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        if (e.type === 'keydown') pointerActive.current = true
        const dir = e.type === 'keydown' ? 1 : 0
        const move = () => {
          if (dir === 0) return
          pointerX.current = Math.max(
            stats.paddleWidth / 2,
            Math.min(
              pointerX.current + dir * stats.paddleSpeed * 0.016,
              BASE_CONFIG.canvas.width - stats.paddleWidth / 2
            )
          )
          if (pointerActive.current) requestAnimationFrame(move)
        }
        move()
      }
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('keyup', handleKey)
    }
  }, [focusGauge, handleCanvasClick, stats.paddleSpeed, stats.paddleWidth])

  const handlePointer = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    pointerX.current = x
  }

  const handleFocusToggle = useCallback(
    (active) => {
      if (focusGauge <= 0) {
        setFocusActive(false)
        return
      }
      setFocusActive(active)
    },
    [focusGauge]
  )

  const handleGameOver = useCallback(() => {
    setGameState(GAME_STATE.OVER)
    endRun(score, stage, stage - 1)
  }, [endRun, score, stage])

  useEffect(() => {
    if (gameState === GAME_STATE.RUNNING && lives <= 0) {
      handleGameOver()
    }
  }, [gameState, handleGameOver, lives])

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
      </Typography>

      {(message || error) && (
        <Alert severity={error ? 'error' : 'info'} sx={{ mb: 2 }} onClose={() => (error ? setError('') : setMessage(''))}>
          {error || message}
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
                <StatRow label="パドル速度 (light)" value={`${Math.round(stats.paddleSpeed)} px/s`} />
                <StatRow label="パドル幅 (party)" value={`${Math.round(stats.paddleWidth)} px`} />
                <StatRow label="初期ライフ (party)" value={stats.startLives} />
                <StatRow label="クリティカル (heavy)" value={`${Math.round(stats.critChance * 100)}%`} />
                <StatRow label="ドロップ率 (gamble)" value={`${Math.round(stats.dropChance * 100)}%`} />
                <StatRow label="フォーカス秒 (quiz)" value={`${stats.focusMax.toFixed(1)}s`} />
                <StatRow label="反射ノイズ (quiz)" value={`${stats.reflectionNoiseDeg.toFixed(1)}°`} />
                <StatRow label="シャドーセーブ (hidden)" value={stats.shadowSaves} />
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={handleStart} disabled={loading || gameState === GAME_STATE.RUNNING}>
              プレイ開始
            </Button>
            <Button variant="outlined" onClick={() => resetStage(1, false)} disabled={loading}>
              リセット
            </Button>
          </Stack>
          <Typography variant="body2">
            操作: ← → / A D で移動、Spaceで発射、Shiftでフォーカス。モバイルはドラッグで移動、タップで発射、右下ボタンでフォーカス。
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              width={BASE_CONFIG.canvas.width}
              height={BASE_CONFIG.canvas.height}
              style={{ border: '1px solid #333', background: COLORS.bg, width: '100%', maxWidth: '900px' }}
              onPointerMove={handlePointer}
              onClick={handleCanvasClick}
              aria-label="Breakout game canvas"
            />
            <Box sx={{ position: 'absolute', right: 8, bottom: 8 }}>
              <Button
                size="small"
                variant={focusActive ? 'contained' : 'outlined'}
                onMouseDown={() => handleFocusToggle(true)}
                onMouseUp={() => handleFocusToggle(false)}
                onTouchStart={() => handleFocusToggle(true)}
                onTouchEnd={() => handleFocusToggle(false)}
                disabled={focusGauge <= 0 || gameState !== GAME_STATE.RUNNING}
              >
                FOCUS
              </Button>
            </Box>
            <Box sx={{ position: 'absolute', left: 12, bottom: 12, right: 80 }}>
              <Typography variant="caption" color="common.white">
                フォーカスゲージ
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(focusGauge / stats.focusMax) * 100}
                sx={{ height: 8, bgcolor: '#263238', '& .MuiLinearProgress-bar': { bgcolor: '#81c784' } }}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      {gameState === GAME_STATE.OVER && (
        <Alert severity="info" sx={{ mb: 2 }}>
          ゲーム終了。結果は送信されました。
        </Alert>
      )}
    </Box>
  )
}
