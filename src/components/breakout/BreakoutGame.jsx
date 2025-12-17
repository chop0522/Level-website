import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, LinearProgress, Typography } from '@mui/material'
import {
  BASE_CONFIG,
  COLORS,
  ITEM_TYPES,
  BALL_SPEED_BASE,
  BALL_SPEED_MAX,
  BALL_SPEED_PER_STAGE,
  FOCUS_BURST_SEC,
  FOCUS_TAP_COOLDOWN_SEC,
  FOCUS_TIMESCALE,
} from '../../games/breakout/breakoutConfig'
import { submitBreakoutRun } from '../../services/api'

const GAME_STATE = { READY: 'ready', RUNNING: 'running', OVER: 'over' }

function getBallSpeed(stage = 1) {
  const s = Math.max(1, Number(stage) || 1)
  return Math.min(BALL_SPEED_BASE + (s - 1) * BALL_SPEED_PER_STAGE, BALL_SPEED_MAX)
}

function useAnimationFrame(callback, enabled) {
  const rafRef = useRef()
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  }, [callback])
  useEffect(() => {
    if (!enabled) return undefined
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

function createBall(stage) {
  const speed = getBallSpeed(stage)
  const dir = { x: 0.45, y: -0.9 }
  const len = Math.hypot(dir.x, dir.y) || 1
  return {
    x: BASE_CONFIG.canvas.width / 2,
    y: BASE_CONFIG.canvas.height - 80,
    vx: (dir.x / len) * speed,
    vy: (dir.y / len) * speed,
  }
}

export default function BreakoutGame({ runId, stats, onEnded }) {
  const [gameState, setGameState] = useState(GAME_STATE.RUNNING)
  const [stage, setStage] = useState(1)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(stats.startLives)
  const [shadowSaves, setShadowSaves] = useState(stats.shadowSaves)
  const [focusGauge, setFocusGauge] = useState(stats.focusMax)
  const [focusBurst, setFocusBurst] = useState(0)
  const [focusCooldown, setFocusCooldown] = useState(0)
  const [focusActive, setFocusActive] = useState(false)
  const [balls, setBalls] = useState([])
  const [blocks, setBlocks] = useState([])
  const [items, setItems] = useState([])
  const [effects, setEffects] = useState({})
  const [lastTs, setLastTs] = useState(0)

  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const scaleRef = useRef(1)
  const pointerX = useRef(BASE_CONFIG.canvas.width / 2)
  const pointerActive = useRef(false)
  const catchCooldownRef = useRef(0)

  const resetStage = useCallback(
    (stageNum, keepScore = true) => {
      setStage(stageNum)
      setBlocks(createBlocks(stageNum))
      setBalls([createBall(stageNum)])
      setShadowSaves(stats.shadowSaves)
      setFocusGauge(stats.focusMax)
      setFocusBurst(0)
      setFocusCooldown(0)
      setFocusActive(false)
      catchCooldownRef.current = 0
      setEffects({})
      setItems([])
      setLastTs(0)
      if (!keepScore) setScore(0)
      setLives((prev) => (keepScore ? prev : stats.startLives))
    },
    [stats.focusMax, stats.shadowSaves, stats.startLives]
  )

  useEffect(() => {
    resetStage(1, false)
  }, [resetStage])

  useEffect(() => {
    const handleBlur = () => {
      setFocusBurst(0)
      setFocusActive(false)
      setFocusCooldown(0)
    }
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [])

  const submitResult = useCallback(
    async (finalScore, finalStage, finalCleared) => {
      if (!runId) return
      await submitBreakoutRun({
        runId,
        score: finalScore,
        stageReached: finalStage,
        stageCleared: finalCleared,
        durationMs: 0,
      })
      onEnded?.()
    },
    [onEnded, runId]
  )

  const handleGameOver = useCallback(() => {
    setGameState(GAME_STATE.OVER)
    submitResult(score, stage, stage - 1)
  }, [score, stage, submitResult])

  const loseLife = useCallback(() => {
    setLives((prev) => prev - 1)
    setBalls([createBall(stage)])
    setFocusGauge(stats.focusMax)
    setFocusBurst(0)
    setFocusCooldown(0)
    setFocusActive(false)
    catchCooldownRef.current = 0
    setEffects({})
    setItems([])
  }, [stage, stats.focusMax])

  const updateBalls = useCallback(
    (dt) => {
      let nextBalls = [...balls]
      const paddleEffectWide = effects.WIDE
      const paddleWidth = stats.paddleWidth * (paddleEffectWide ? 1.4 : 1)
      const paddleY = BASE_CONFIG.canvas.height - 40
      const maxX = BASE_CONFIG.canvas.width - paddleWidth / 2
      const minX = paddleWidth / 2
      const paddleX = Math.max(minX, Math.min(pointerX.current, maxX))
      pointerX.current = paddleX
      catchCooldownRef.current = Math.max(0, catchCooldownRef.current - dt)
      const speedScale = effects.SLOW ? 0.7 : 1
      const ballRadius = BASE_CONFIG.ballRadius
      const newItems = []
      const newBlocks = [...blocks]
      let addScore = 0
      const baseBallSpeed = getBallSpeed(stage)
      const canCatchSingle = balls.length === 1 && catchCooldownRef.current <= 0

      nextBalls = nextBalls
        .map((ball) => {
          let { x, y, vx, vy } = ball
          if (ball.attached) {
            const offsetLimit = paddleWidth / 2 - ballRadius
            const attachOffset = Math.max(-offsetLimit, Math.min(ball.attachOffset || 0, offsetLimit))
            return {
              ...ball,
              x: paddleX + attachOffset,
              y: paddleY - ballRadius - 1,
              vx: 0,
              vy: 0,
              attached: true,
              attachOffset,
            }
          }
          const speed = Math.hypot(vx, vy) || 1
          const normVx = vx / speed
          const normVy = vy / speed
          const targetSpeed = baseBallSpeed * speedScale
          vx = normVx * targetSpeed
          vy = normVy * targetSpeed

          x += vx * dt
          y += vy * dt

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

          if (
            y + ballRadius >= paddleY &&
            y + ballRadius <= paddleY + 16 &&
            x >= paddleX - paddleWidth / 2 &&
            x <= paddleX + paddleWidth / 2 &&
            vy > 0
          ) {
            const canCatch = canCatchSingle && Math.random() < (stats.catchChance || 0)
            if (canCatch) {
              const offsetLimit = paddleWidth / 2 - ballRadius
              const attachOffset = Math.max(-offsetLimit, Math.min(x - paddleX, offsetLimit))
              catchCooldownRef.current = stats.catchCooldownSec || 0
              return {
                ...ball,
                x: paddleX + attachOffset,
                y: paddleY - ballRadius - 1,
                vx: 0,
                vy: 0,
                attached: true,
                attachOffset,
              }
            }
            const rel = (x - paddleX) / (paddleWidth / 2)
            const angle =
              (Math.PI / 3) * rel + ((stats.reflectionNoiseDeg * Math.PI) / 180) * (Math.random() - 0.5)
            const speedAfter = Math.hypot(vx, vy)
            vx = Math.sin(angle) * speedAfter
            vy = -Math.abs(Math.cos(angle) * speedAfter)
            y = paddleY - ballRadius - 1
          }

          for (const block of newBlocks) {
            if (block.hp <= 0) continue
            if (
              x + ballRadius > block.x &&
              x - ballRadius < block.x + block.width &&
              y + ballRadius > block.y &&
              y - ballRadius < block.y + block.height
            ) {
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
    [balls, blocks, effects.SLOW, effects.WIDE, loseLife, shadowSaves, stage, stats]
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
            setBalls((prev) => {
              if (prev.some((b) => b.attached)) return prev
              return [
                ...prev,
                ...prev.map((b) => ({ ...b, vx: -b.vx, attached: false, attachOffset: 0 })),
              ]
            })
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
      const dtMs = ts - last
      const clampedMs = Math.min(dtMs, BASE_CONFIG.dtClampMs)
      const dtSec = clampedMs / 1000

      const nextCooldown = Math.max(0, focusCooldown - dtSec)
      let nextBurst = focusBurst
      let nextGauge = focusGauge
      let timeScale = 1
      let active = false

      if (nextBurst > 0 && nextGauge > 0) {
        const consume = Math.min(dtSec, nextBurst, nextGauge)
        nextBurst = Math.max(0, nextBurst - consume)
        nextGauge = Math.max(0, nextGauge - consume)
        timeScale = FOCUS_TIMESCALE
        active = true
      }

      const simDt = dtSec * timeScale

      updateBalls(simDt)
      updateItems(simDt)
      clearEffects()

      if (focusActive !== active) setFocusActive(active)
      if (nextGauge !== focusGauge) setFocusGauge(nextGauge)
      if (nextBurst !== focusBurst) setFocusBurst(nextBurst)
      if (nextCooldown !== focusCooldown) setFocusCooldown(nextCooldown)

      setLastTs(ts)

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
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const scale = Math.min(rect.width / BASE_CONFIG.canvas.width, rect.height / BASE_CONFIG.canvas.height)
      scaleRef.current = scale
      canvas.style.width = `${BASE_CONFIG.canvas.width * scale}px`
      canvas.style.height = `${BASE_CONFIG.canvas.height * scale}px`
      canvas.style.transform = `translate(-50%, -50%)`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = BASE_CONFIG.canvas.width * dpr
    canvas.height = BASE_CONFIG.canvas.height * dpr
    ctx.scale(dpr, dpr)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, BASE_CONFIG.canvas.width, BASE_CONFIG.canvas.height)

    const paddleEffectWide = effects.WIDE
    const paddleWidth = stats.paddleWidth * (paddleEffectWide ? 1.4 : 1)
    const rawPaddleX = pointerX.current
    const paddleX = Math.max(paddleWidth / 2, Math.min(rawPaddleX, BASE_CONFIG.canvas.width - paddleWidth / 2))
    const paddleY = BASE_CONFIG.canvas.height - 40
    ctx.fillStyle = COLORS.paddle
    ctx.fillRect(paddleX - paddleWidth / 2, paddleY, paddleWidth, 14)

    ctx.fillStyle = COLORS.ball
    balls.forEach((b) => {
      ctx.beginPath()
      ctx.arc(b.x, b.y, BASE_CONFIG.ballRadius, 0, Math.PI * 2)
      ctx.fill()
    })

    blocks.forEach((block) => {
      if (block.hp <= 0) return
      ctx.fillStyle = block.indestructible
        ? COLORS.blockIndestructible
        : COLORS.blockHp[Math.min(block.baseHp - 1, COLORS.blockHp.length - 1)]
      ctx.fillRect(block.x, block.y, block.width, block.height)
    })

    items.forEach((item) => {
      ctx.fillStyle = COLORS.item[item.type] || '#fff'
      ctx.beginPath()
      ctx.arc(item.x, item.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.font = '10px sans-serif'
      ctx.fillText(item.type[0], item.x - 4, item.y + 4)
    })

    ctx.fillStyle = COLORS.text
    ctx.font = '14px sans-serif'
    ctx.fillText(`Stage ${stage}`, 20, 24)
    ctx.fillText(`Score ${score}`, 20, 44)
    ctx.fillText(`Lives ${lives} (Shadow ${shadowSaves})`, 20, 64)
    ctx.fillText(`Focus ${focusGauge.toFixed(1)}s`, 20, 84)
  }, [balls, blocks, effects.WIDE, focusGauge, items, lives, score, shadowSaves, stage, stats.paddleWidth])

  const triggerFocusBurst = useCallback(() => {
    if (focusCooldown > 0) return
    if (focusGauge <= 0) return
    const use = Math.min(FOCUS_BURST_SEC, focusGauge)
    setFocusBurst((prev) => Math.max(prev, use))
    setFocusCooldown(FOCUS_TAP_COOLDOWN_SEC)
  }, [focusCooldown, focusGauge])

  const handleLaunch = useCallback(() => {
    const paddleEffectWide = effects.WIDE
    const paddleWidth = stats.paddleWidth * (paddleEffectWide ? 1.4 : 1)
    const maxX = BASE_CONFIG.canvas.width - paddleWidth / 2
    const minX = paddleWidth / 2
    const paddleX = Math.max(minX, Math.min(pointerX.current, maxX))
    const speed = getBallSpeed(stage)
    const launchY = BASE_CONFIG.canvas.height - 40 - BASE_CONFIG.ballRadius - 1

    setBalls((prev) => {
      const hasAttached = prev.some((b) => b.attached)
      if (hasAttached) {
        return prev.map((b) => {
          if (!b.attached) return b
          const offset = b.attachOffset ?? b.x - paddleX
          const t = Math.max(-1, Math.min(1, offset / (paddleWidth / 2)))
          const vx = t * 0.7 * speed
          const vy = -Math.sqrt(Math.max(speed * speed - vx * vx, 0))
          return {
            x: paddleX + offset,
            y: launchY,
            vx,
            vy,
            attached: false,
            attachOffset: 0,
          }
        })
      }
      if (prev.length === 0) {
        return [createBall(stage)]
      }
      return prev
    })
  }, [effects.WIDE, stage, stats.paddleWidth])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (e.type === 'keydown') {
          triggerFocusBurst()
        }
      }
      if (e.code === 'Space' && e.type === 'keydown') {
        handleLaunch()
      }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        if (e.type === 'keydown') pointerActive.current = true
        if (e.type === 'keyup') {
          pointerActive.current = false
          return
        }
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
        if (e.type === 'keyup') {
          pointerActive.current = false
          return
        }
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
  }, [handleLaunch, stage, stats.paddleSpeed, stats.paddleWidth, triggerFocusBurst])

  useEffect(() => {
    if (gameState === GAME_STATE.RUNNING && lives <= 0) {
      handleGameOver()
    }
  }, [gameState, handleGameOver, lives])

  const handlePointer = useCallback(
    (clientX) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = ((clientX - rect.left) * BASE_CONFIG.canvas.width) / rect.width
      pointerX.current = x
    },
    []
  )

  const onPointerDown = (e) => {
    e.preventDefault()
    handlePointer(e.clientX)
  }

  const onPointerMove = (e) => {
    handlePointer(e.clientX)
  }

  const onPointerUp = () => {}

  const onTouchStart = (e) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    handlePointer(t.clientX)
  }

  const onTouchMove = (e) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    handlePointer(t.clientX)
  }

  const onTouchEnd = () => {}

  const onCanvasClick = () => {
    if (gameState !== GAME_STATE.RUNNING) return
    handleLaunch()
  }

  const hasAttached = balls.some((b) => b.attached)

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100vw',
        height: '100dvh',
        maxHeight: '100dvh',
        p: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        bgcolor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'none',
        overscrollBehavior: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={BASE_CONFIG.canvas.width}
        height={BASE_CONFIG.canvas.height}
        style={{
          display: 'block',
          position: 'absolute',
          top: '50%',
          left: '50%',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onCanvasClick}
        aria-label="Breakout game canvas"
      />
      {hasAttached && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 2,
            py: 0.75,
            bgcolor: 'rgba(0,0,0,0.6)',
            borderRadius: 1,
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <Typography variant="body2" color="common.white">
            タップ / Space で発射
          </Typography>
        </Box>
      )}
      <Box sx={{ position: 'absolute', right: 12, bottom: 12 }}>
        <Button
          size="small"
          variant={focusActive ? 'contained' : 'outlined'}
          onPointerDown={(e) => {
            e.preventDefault()
            triggerFocusBurst()
          }}
          onClick={(e) => {
            e.preventDefault()
            triggerFocusBurst()
          }}
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
  )
}
