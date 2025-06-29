/**
 * ポイントから段位を返す
 * @param {number} pt 月間ポイント
 * @returns {{ rank: number, sub: number, label: string, color: string, icon: string }}
 */
export function getRankFromPoint(pt = 0) {
  const table = [
    { min: 3100, rank: 5, sub: 3, label: '雀聖 III', color: 'gold',   icon: 'EmojiEvents' },
    { min: 2700, rank: 5, sub: 2, label: '雀聖 II',  color: 'gold',   icon: 'EmojiEvents' },
    { min: 2300, rank: 5, sub: 1, label: '雀聖 I',  color: 'gold',   icon: 'EmojiEvents' },
    { min: 2000, rank: 4, sub: 3, label: '牌王 III', color: 'purple', icon: 'MilitaryTech' },
    { min: 1700, rank: 4, sub: 2, label: '牌王 II',  color: 'purple', icon: 'MilitaryTech' },
    { min: 1400, rank: 4, sub: 1, label: '牌王 I',  color: 'purple', icon: 'MilitaryTech' },
    { min: 1200, rank: 3, sub: 3, label: '闘雀 III', color: 'green',  icon: 'Star' },
    { min: 1000, rank: 3, sub: 2, label: '闘雀 II', color: 'green',  icon: 'Star' },
    { min:  800, rank: 3, sub: 1, label: '闘雀 I',  color: 'green',  icon: 'Star' },
    { min:  650, rank: 2, sub: 3, label: '雀士 III', color: 'blue',   icon: 'StarOutline' },
    { min:  500, rank: 2, sub: 2, label: '雀士 II',  color: 'blue',   icon: 'StarOutline' },
    { min:  350, rank: 2, sub: 1, label: '雀士 I',  color: 'blue',   icon: 'StarOutline' },
    { min:  200, rank: 1, sub: 3, label: '初段 III', color: 'grey',   icon: 'LooksOne' },
    { min:  100, rank: 1, sub: 2, label: '初段 II',  color: 'grey',   icon: 'LooksOne' },
    { min:    0, rank: 1, sub: 1, label: '初段 I',  color: 'grey',   icon: 'LooksOne' },
  ];
  return table.find(t => pt >= t.min) || table[table.length - 1];
}