/**
 * ポイントから段位を返す
 * @param {number} pt 月間ポイント
 * @returns {{ rank: number, sub: number, label: string, color: string }}
 */
export function getRankFromPoint(pt = 0) {
  const table = [
    { min: 3100, rank: 5, sub: 3, label: '雀聖 III', color: 'gold' },
    { min: 2700, rank: 5, sub: 2, label: '雀聖 II',  color: 'gold' },
    { min: 2300, rank: 5, sub: 1, label: '雀聖 I',  color: 'gold' },
    { min: 2000, rank: 4, sub: 3, label: '牌王 III', color: 'purple' },
    { min: 1700, rank: 4, sub: 2, label: '牌王 II',  color: 'purple' },
    { min: 1400, rank: 4, sub: 1, label: '牌王 I',  color: 'purple' },
    { min: 1200, rank: 3, sub: 3, label: '闘雀 III', color: 'green' },
    { min: 1000, rank: 3, sub: 2, label: '闘雀 II', color: 'green' },
    { min:  800, rank: 3, sub: 1, label: '闘雀 I',  color: 'green' },
    { min:  650, rank: 2, sub: 3, label: '雀士 III', color: 'blue' },
    { min:  500, rank: 2, sub: 2, label: '雀士 II',  color: 'blue' },
    { min:  350, rank: 2, sub: 1, label: '雀士 I',  color: 'blue' },
    { min:  200, rank: 1, sub: 3, label: '初段 III', color: 'grey' },
    { min:  100, rank: 1, sub: 2, label: '初段 II',  color: 'grey' },
    { min:    0, rank: 1, sub: 1, label: '初段 I',  color: 'grey' },
  ];
  return table.find(t => pt >= t.min) || table[table.length - 1];
}