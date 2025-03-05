// server.js
require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

// 1) Expressアプリ作成
const app = express();
app.use(express.json());
app.use(cors()); // 開発時のみ許可。本番では設定調整

// 2) 環境変数の読み込み
const {
  NOTION_API_KEY,
  NOTION_DB_ID_USER,
  JWT_SECRET,
  PORT
} = process.env;

// 3) Notionクライアント初期化
const notion = new Client({ auth: NOTION_API_KEY });

// -----------------------------
// ユーザーデータのヘルパー関数
// -----------------------------

// 3-1) Notion内でEmailが一致するユーザーを検索
async function findUserByEmail(email) {
  // DB queryでEmailプロパティが一致するページを探す
  const response = await notion.databases.query({
    database_id: NOTION_DB_ID_USER,
    filter: {
      property: "Email",
      email: {
        equals: email
      }
    }
  });
  if (response.results.length > 0) {
    return response.results[0]; // 該当ユーザー(page)を返す
  }
  return null;
}

// 3-2) NotionのUser DBに新規ユーザーを作成
async function createUserInNotion(name, email, passwordHash) {
  const newPage = await notion.pages.create({
    parent: { database_id: NOTION_DB_ID_USER },
    properties: {
      "Name": {
        title: [{ text: { content: name } }]
      },
      "Email": {
        email: email
      },
      "PasswordHash": {
        rich_text: [{ text: { content: passwordHash } }]
      }
    }
  });
  return newPage;
}

// 3-3) Notionのユーザーページから必要な情報を抽出
function extractUserProps(page) {
  // page.properties から Name, Email, PasswordHash を取得
  const { Name, Email, PasswordHash } = page.properties;
  return {
    id: page.id,
    name: Name.title?.[0]?.plain_text || "",
    email: Email.email || "",
    passwordHash: PasswordHash.rich_text?.[0]?.plain_text || ""
  };
}

// -----------------------------
// JWT関連のミドルウェア
// -----------------------------

// JWTトークンを検証するミドルウェア
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }
  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }
  // 検証
  jwt.verify(token, JWT_SECRET, (err, userData) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    // デコードされたペイロードをreq.userに格納
    req.user = userData;
    next();
  });
}

// -----------------------------
// 認証系エンドポイント
// -----------------------------

// 新規登録
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }
    // 1) 既に同じメールのユーザーが存在するか確認
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    // 2) パスワードをハッシュ化
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    // 3) Notion DBに登録
    const newPage = await createUserInNotion(name, email, passwordHash);
    // 4) JWTトークンを発行し、ユーザー情報を返す
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ログイン
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }
    // 1) ユーザー検索
    const userPage = await findUserByEmail(email);
    if (!userPage) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // 2) パスワードチェック
    const userProps = extractUserProps(userPage);
    const match = await bcrypt.compare(password, userProps.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // 3) JWT発行
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// ユーザー情報API (要JWT)
// -----------------------------
app.get('/api/userinfo', authenticateToken, async (req, res) => {
  try {
    const { email } = req.user; // JWTに埋め込んだemail
    const userPage = await findUserByEmail(email);
    if (!userPage) {
      return res.status(404).json({ error: "User not found" });
    }
    const userProps = extractUserProps(userPage);
    // パスワードハッシュは返さない
    delete userProps.passwordHash;
    return res.json(userProps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// フロントエンドのビルド成果物を返す(本番用)
// -----------------------------
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// -----------------------------
// サーバー起動
// -----------------------------
const port = PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});