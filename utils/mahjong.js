// NOTE: This is the SOURCE OF TRUTH for Mahjong point calculation.
// It is auto-copied to src/utils/mahjong.js via NPM scripts (see package.json: copy:mahjong).
/**
 * 麻雀ポイント計算
 * @param {1|2|3|4} rank        終局順位
 * @param {number}  finalScore  終局点 (例: 32400)
 * @returns {number}            最終ポイント (整数)
 */
function calcMahjongPoint(rank, finalScore) {
  const rankPts = { 1: 25, 2: 10, 3: -5, 4: -15 };
  const delta   = Math.floor((finalScore - 25000) / 1000);
  return delta + (rankPts[rank] ?? 0);
}

const ranks = [1, 2, 3, 4];

module.exports = { calcMahjongPoint, ranks };
