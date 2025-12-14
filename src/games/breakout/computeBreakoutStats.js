import { BASE_CONFIG } from './breakoutConfig'

function xpToPower(xp = 0) {
  const p = 1 - Math.exp(-xp / 400)
  return Math.max(0, Math.min(1, p))
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

  const pHidden = xpToPower(xp.hidden)
  const pHeavy = xpToPower(xp.heavy)
  const pLight = xpToPower(xp.light)
  const pParty = xpToPower(xp.party)
  const pGamble = xpToPower(xp.gamble)
  const pQuiz = xpToPower(xp.quiz)

  const paddleSpeed = BASE_CONFIG.paddle.baseSpeed + 300 * pLight
  const paddleWidth = BASE_CONFIG.paddle.baseWidth + 60 * pParty
  const startLives = BASE_CONFIG.lives + (pParty >= 0.55 ? 1 : 0) + (pParty >= 0.85 ? 1 : 0)

  const critChance = BASE_CONFIG.crit.baseChance + BASE_CONFIG.crit.bonus * pHeavy
  const dropChance = BASE_CONFIG.drop.baseChance + BASE_CONFIG.drop.bonus * pGamble
  const focusMax = BASE_CONFIG.focus.baseMax + 6 * pQuiz
  const focusTimeScale = BASE_CONFIG.focus.timeScale
  const reflectionNoiseDeg = 6 * (1 - pQuiz)
  const shadowSaves = BASE_CONFIG.shadow.base + (pHidden >= 0.55 ? 1 : 0) + (pHidden >= 0.85 ? 1 : 0)

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
    critChance,
    dropChance,
    focusMax,
    focusTimeScale,
    reflectionNoiseDeg,
    shadowSaves,
    itemWeights: baseWeights,
  }
}
