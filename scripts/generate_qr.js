/**
 * QR コード一括生成スクリプト
 * ---------------------------------------------
 * `node scripts/generate_qr.js` で
 *   qr/stealth.png
 *   qr/heavy.png
 *   qr/light.png
 *   qr/party.png
 *   qr/gamble.png
 *   qr/quiz.png
 * をプロジェクトルートの ./qr フォルダへ出力します。
 *
 * 依存: npm i qrcode
 */

const QRCode = require('qrcode');
const fs     = require('fs');
const path   = require('path');

// ===== 設定 =====
const BASE_URL = process.env.QR_BASE_URL || 'https://gamecafe-level.com/qr?cat=';
const OUT_DIR  = path.join(__dirname, '..', 'qr');  // プロジェクト直下 ./qr
const CATS = ['stealth', 'heavy', 'light', 'party', 'gamble', 'quiz'];
const SIZE = 300; // png width(px)

// ===== 準備 =====
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ===== 生成 =====
(async () => {
  for (const cat of CATS) {
    const url  = `${BASE_URL}${cat}`;
    const file = path.join(OUT_DIR, `${cat}.png`);
    try {
      await QRCode.toFile(file, url, { width: SIZE, margin: 2 });
      console.log(`✅  generated: ${file}`);
    } catch (err) {
      console.error(`❌  failed: ${cat}`, err);
    }
  }
})();
