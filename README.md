## Overview

Level-website is a Create React App frontend served by an Express API. The server handles auth, XP/achievement tracking, mahjong rankings, events, and static asset delivery for the built React app.

The public site now uses an Express-rendered HTML shell for key routes such as `/`, `/menu/`, `/access/`, and `/faq/`. This keeps the existing SPA behavior while ensuring Google can read the store name, address, official links, and JSON-LD from the initial HTML response.

## Requirements

- Node.js 18+ (Node 20 recommended)
- PostgreSQL database reachable via `DATABASE_URL`
- npm 9+

### Environment variables (.env)

- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – secret for issuing/validating auth tokens
- `JWT_EXPIRES` – JWT lifetime (default: `30d`)
- `QR_SECRET` – secret for signed QR claims (default: `qr_secret_change_me`)
- `PORT` – server port (default: `3001`)
- `GOOGLE_SITE_VERIFICATION` – optional Search Console verification token for the `<meta name="google-site-verification">` tag

## Setup

```bash
npm ci
```

## Development

- API/server with live reload: `npm run dev` (nodemon)
- React app (CRA dev server): `npx react-scripts start` in another terminal if you need hot reload while editing the UI.

The production server (`npm start`) serves the built assets from `build/`, so run a build first if you are only using that entrypoint.

## Quality checks

```bash
npm run lint
npm run build
```

The `build` command also regenerates `public/robots.txt` and `public/sitemap.xml` from the current SEO configuration before bundling the app, then writes prerendered HTML files for the public routes under `build/`.

## XP/ランク関連（フロント実装の参照先）

- 定義ファイル: `src/utils/rankConfig.js`
  - `XP_CATEGORIES`: カテゴリキー・表示名・カラー
  - `XP_RANKS`: ランクキー・表示名・必要XP
  - `getRankByXP(xp)`: 現在/次ランクを返す純関数
  - `getBadgeAsset(categoryKey, rankKey)`, `getBadgeByXP(categoryKey, xp)`: バッジ画像パスを組み立て

### XP系APIの主なレスポンス

- `POST /api/gameCategory` または `POST /api/qr/claim`
  - `success`, `xpGain`, `currentXP`, `label`(rank名), `badge_url`, `rankUp`, `next_required_xp`
- `GET /api/achievements`
  - `xp_total`, `totalRank: { rank, label, badge_url }`, `user`（各カテゴリXP含む）

## Running locally

```bash
# build frontend assets
npm run build
# start API + static server on PORT (default 3001)
npm start
```

### SEO checks

After starting the server, confirm the prerendered HTML contains the store information:

```bash
curl -s http://localhost:3001/ | rg "ゲームカフェ.Level|千葉県市川市湊新田2-1-18|/menu"
curl -s http://localhost:3001/ | rg "application/ld\\+json|localbusiness|organization|website" -i
curl -s http://localhost:3001/menu/ | head -n 40
curl -s http://localhost:3001/access/ | head -n 40
curl -s http://localhost:3001/faq/ | head -n 40
curl -s http://localhost:3001/robots.txt
curl -s http://localhost:3001/sitemap.xml
```

You can also run the automated verifier:

```bash
npm run verify:seo
```

To check the production site with the same assertions:

```bash
npm run verify:seo -- https://gamecafe-level.com
```

## Search Console setup

1. Google Search Console で `https://gamecafe-level.com/` をプロパティ追加します。
2. HTML タグ方式の verification token を取得します。
3. 本番環境変数 `GOOGLE_SITE_VERIFICATION` に token を設定します。
4. 再デプロイ後、ページソースに `<meta name="google-site-verification">` が入っていることを確認します。
5. Search Console から `https://gamecafe-level.com/sitemap.xml` を送信します。
6. URL Inspection で `/`, `/menu/`, `/access/` を順に確認し、`Request Indexing` を実行します。

If Google requests a verification file instead of a meta tag, place the provided file directly under `public/` and rebuild.

## Deployment

Deploy as a Node/Express app (e.g., Render/Heroku/Fly). Ensure the build step (`npm run build`) runs before `npm start`, and set the environment variables above in your platform settings.
