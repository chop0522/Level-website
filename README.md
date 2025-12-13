## Overview

Level-website is a Create React App frontend served by an Express API. The server handles auth, XP/achievement tracking, mahjong rankings, events, and static asset delivery for the built React app.

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

## Deployment

Deploy as a Node/Express app (e.g., Render/Heroku/Fly). Ensure the build step (`npm run build`) runs before `npm start`, and set the environment variables above in your platform settings.
