// XPカテゴリとランク定義の共通設定（未来のゲーム実装もここを参照）
export const XP_CATEGORIES = [
  { key: 'stealth', label: '正体隠匿', color: '#3f51b5' },
  { key: 'heavy', label: '重量級', color: '#795548' },
  { key: 'light', label: '軽量級', color: '#009688' },
  { key: 'party', label: 'パーティ', color: '#ff9800' },
  { key: 'gamble', label: 'ギャンブル', color: '#9c27b0' },
  { key: 'quiz', label: 'クイズ', color: '#e91e63' },
]

export const XP_RANKS = [
  { key: 'rookie', label: 'Rookie', minXp: 0 },
  { key: 'bronze', label: 'Bronze', minXp: 50 },
  { key: 'silver', label: 'Silver', minXp: 150 },
  { key: 'gold', label: 'Gold', minXp: 400 },
  { key: 'diamond', label: 'Diamond', minXp: 800 },
]

export function getCategoryByKey(key) {
  return XP_CATEGORIES.find((c) => c.key === key) || null
}

/**
 * XPから現在/次のランクを取得（純関数）
 * @param {number} xp
 * @returns {{ current: typeof XP_RANKS[number], next: typeof XP_RANKS[number] | null }}
 */
export function getRankByXP(xp = 0) {
  const current = [...XP_RANKS].reverse().find((rank) => xp >= rank.minXp) || XP_RANKS[0]
  const next = XP_RANKS.find((rank) => rank.minXp > xp) || null
  return { current, next }
}

// 既存呼び出しとの互換用エイリアス
export const getXpRank = getRankByXP

export function getBadgeAsset(categoryKey, rankKey) {
  return `/badges/${categoryKey}_${rankKey}.png`
}

export function getBadgeByXP(categoryKey, xp = 0) {
  const { current, next } = getRankByXP(xp)
  return {
    current,
    next,
    badgeUrl: getBadgeAsset(categoryKey, current.key),
  }
}

// 後方互換用
export const buildBadgePath = getBadgeAsset
