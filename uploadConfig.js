/****
 * Multer configuration for avatar image uploads.
 * Stores files in memory so we can write the buffer directly
 * to the PostgreSQL BYTEA column (`users.avatar`).
 */
const multer = require('multer');

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 }, // 200 KB per image
  fileFilter: (_req, file, cb) => {
    // Accept only PNG, JPEG, or WEBP images
    if (/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPEG, and WEBP images are allowed'));
  }
});
