export const BASE_CONFIG = {
  canvas: { width: 900, height: 600 },
  ballSpeed: 380,
  ballRadius: 8,
  paddle: { baseWidth: 120, baseSpeed: 900 },
  lives: 3,
  block: {
    baseRows: 4,
    baseCols: 10,
    width: 70,
    height: 20,
    padding: 8,
    offsetTop: 80,
    offsetLeft: 40,
    hpRange: [1, 3],
    indestructibleFromStage: 5,
  },
  focus: {
    baseMax: 2,
    timeScale: 0.6,
  },
  shadow: {
    base: 1,
  },
  score: {
    destroy: 10,
    clearStage: 200,
    lifeBonus: 50,
  },
  crit: {
    baseChance: 0.05,
    bonus: 0.15,
    damage: 2,
  },
  drop: {
    baseChance: 0.03,
    bonus: 0.09,
    durationMs: 10000,
  },
  dtClampMs: 33,
}

export const ITEM_TYPES = ['WIDE', 'SLOW', 'MULTI', 'LIFE']

export const COLORS = {
  bg: '#0b1021',
  paddle: '#4fc3f7',
  ball: '#fff',
  blockHp: ['#81d4fa', '#4dd0e1', '#00acc1'],
  blockIndestructible: '#616161',
  text: '#e0f2f1',
  item: {
    WIDE: '#ffd54f',
    SLOW: '#ce93d8',
    MULTI: '#ff8a65',
    LIFE: '#81c784',
  },
}

export const BALL_SPEED_BASE = 380
export const BALL_SPEED_PER_STAGE = 18
export const BALL_SPEED_MAX = 620

export const FOCUS_TIMESCALE = 0.6
export const FOCUS_BURST_SEC = 0.8
export const FOCUS_TAP_COOLDOWN_SEC = 0.15

export const TOUCH_SENSITIVITY = 0.75
export const TOUCH_SPEED_MULT = 0.85
