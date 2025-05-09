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
const jwt    = require('jsonwebtoken');
const QR_SECRET = process.env.QR_SECRET || 'qr_secret_change_me';
const fs     = require('fs');
const path   = require('path');

// BASE_URL の末尾は「?」で終わらせ、後続で t=<JWT> を付与
const BASE_URL = process.env.QR_BASE_URL || 'https://gamecafe-level.com/qr?';
const OUT_DIR  = path.join(__dirname, '..', 'qr');  // プロジェクト直下 ./qr
const CATS = ['stealth', 'heavy', 'light', 'party', 'gamble', 'quiz'];
const SIZE = 300; // png width(px)

// ===== 準備 =====
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ===== 生成 =====
(async () => {
  for (const cat of CATS) {
    const payload = { cat };                         // 署名対象: カテゴリ
    const token   = jwt.sign(payload, QR_SECRET);    // exp を付けない固定トークン
    const url     = `${BASE_URL}t=${token}`;
    const file    = path.join(OUT_DIR, `${cat}.png`);
    try {
      await QRCode.toFile(file, url, { width: SIZE, margin: 2 });
      console.log(`✅  generated: ${file}`);
    } catch (err) {
      console.error(`❌  failed: ${cat}`, err);
    }
  }
})();
