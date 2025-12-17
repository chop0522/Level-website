let ctx = null
let master = null
let enabled = false
let lastAt = {}

export function getSfxEnabled() {
  return enabled
}

export function setSfxEnabled(v) {
  enabled = !!v
}

export async function initSfx() {
  if (typeof window === 'undefined') return
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return

  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.12
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

function canPlay(key, minMs) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const prev = lastAt[key] || 0
  if (now - prev < minMs) return false
  lastAt[key] = now
  return true
}

function tone(freq, durSec, type = 'square', gain = 1) {
  if (!enabled || !ctx || !master) return
  const t0 = ctx.currentTime

  const osc = ctx.createOscillator()
  const g = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)

  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.7 * gain, t0 + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.02, durSec))

  osc.connect(g)
  g.connect(master)

  osc.start(t0)
  osc.stop(t0 + durSec)
}

export function playSfx(name) {
  if (!enabled) return
  switch (name) {
    case 'paddle':
      if (!canPlay('paddle', 40)) return
      return tone(220, 0.05, 'square', 0.9)

    case 'wall':
      if (!canPlay('wall', 35)) return
      return tone(330, 0.04, 'square', 0.6)

    case 'brick':
      if (!canPlay('brick', 25)) return
      return tone(660, 0.045, 'square', 0.9)

    case 'brickHard':
      if (!canPlay('brickHard', 25)) return
      return tone(520, 0.06, 'square', 0.9)

    case 'itemDrop':
      if (!canPlay('itemDrop', 80)) return
      return tone(880, 0.05, 'triangle', 0.8)

    case 'itemGet':
      if (!canPlay('itemGet', 80)) return
      return tone(980, 0.06, 'triangle', 0.9)

    case 'lifeLost':
      if (!canPlay('lifeLost', 200)) return
      return tone(140, 0.12, 'sawtooth', 0.9)

    case 'stageClear':
      if (!canPlay('stageClear', 500)) return
      tone(660, 0.06, 'triangle', 0.7)
      setTimeout(() => tone(990, 0.08, 'triangle', 0.8), 70)
      return

    case 'focus':
      if (!canPlay('focus', 80)) return
      return tone(1200, 0.03, 'triangle', 0.6)

    case 'catch':
      if (!canPlay('catch', 80)) return
      return tone(740, 0.05, 'triangle', 0.7)

    default:
      return
  }
}
