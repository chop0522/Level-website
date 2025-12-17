import { BASE_CONFIG } from './breakoutConfig'

const XP_CAP = 1000
const XP_CURVE = 0.65

function norm(xp = 0) {
  const v = Number(xp) || 0
  const t = Math.min(Math.max(v, 0), XP_CAP) / XP_CAP
  return Math.pow(t, XP_CURVE)
}

export function computeBreakoutStats(userInfo = {}) {
  const xp = {
    hidden: userInfo.xp_stealth || 0,
    heavy: userInfo.xp_heavy || 0,
    light: userInfo.xp_light || 0,
    party: userInfo.xp_party || 0,
    gamble: userInfo.xp_gamble || 0,
    quiz: userInfo.xp_quiz || 0,
  }

  const pHidden = norm(xp.hidden)
  const pHeavy = norm(xp.heavy)
  const pLight = norm(xp.light)
  const pParty = norm(xp.party)
  const pGamble = norm(xp.gamble)
  const pQuiz = norm(xp.quiz)

  const paddleSpeed = 520 + 220 * pLight
  const paddleWidth = 120 + 80 * pParty
  const startLives = 3 + (pParty >= 0.55 ? 1 : 0) + (pParty >= 0.85 ? 1 : 0)

  const catchChance = 0.03 + 0.12 * pLight
  const catchCooldownSec = 2.5 - 1.5 * pLight

  const critChance = 0.05 + 0.15 * pHeavy
  const dropChance = 0.03 + 0.09 * pGamble
  const focusMax = 2 + 6 * pQuiz
  const focusTimeScale = BASE_CONFIG.focus.timeScale
  const reflectionNoiseDeg = 6 * (1 - pQuiz)
  const shadowSaves = 1 + (pHidden >= 0.6 ? 1 : 0) + (pHidden >= 0.85 ? 1 : 0)

  // アイテム重み（ギャンブルでMULTI/LIFEを厚めに）
  const baseWeights = { WIDE: 1, SLOW: 1, MULTI: 1, LIFE: 1 }
  baseWeights.MULTI += 1.5 * pGamble
  baseWeights.LIFE += 1.2 * pGamble

  return {
    xp,
    powers: { hidden: pHidden, heavy: pHeavy, light: pLight, party: pParty, gamble: pGamble, quiz: pQuiz },
    paddleSpeed,
    paddleWidth,
    startLives,
    catchChance,
    catchCooldownSec,
    critChance,
    dropChance,
    focusMax,
    focusTimeScale,
    reflectionNoiseDeg,
    shadowSaves,
    itemWeights: baseWeights,
  }
}
