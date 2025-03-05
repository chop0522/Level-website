// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const { Client } = require('@notionhq/client');

const app = express();
app.use(express.json());

// Notion APIクライアントの初期化
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// DB IDを環境変数から取得
const DB_FAQ = process.env.NOTION_DB_ID_FAQ;
const DB_RESERVATION = process.env.NOTION_DB_ID_RESERVATION;
const DB_SCORE = process.env.NOTION_DB_ID_SCORE;

// ▼ FAQ問い合わせのPOST
app.post('/api/faq', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ success: false, error: 'No question provided' });

  try {
    await notion.pages.create({
      parent: { database_id: DB_FAQ },
      properties: {
        "Question": { title: [{ text: { content: question } }] },
        "Status": { select: { name: '未回答' } }
      }
    });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ▼ 予約作成
app.post('/api/reservation', async (req, res) => {
  const { dateTime, people, userId } = req.body;
  if (!dateTime || !people) {
    return res.status(400).json({ success: false, error: 'Invalid data' });
  }
  try {
    await notion.pages.create({
      parent: { database_id: DB_RESERVATION },
      properties: {
        "DateTime": { date: { start: dateTime } },
        "NumberOfPeople": { number: people },
        "Status": { select: { name: '予約受付済' } },
        // RelationでユーザーIDに紐づける例 (DB側にRelationプロパティが必要)
        "User": userId ? { relation: [{ id: userId }] } : undefined
      }
    });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ▼ スコア一覧取得
app.get('/api/scores', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  try {
    const response = await notion.databases.query({
      database_id: DB_SCORE,
      filter: {
        property: 'User',
        relation: {
          contains: userId
        }
      }
    });
    const scores = response.results.map(page => {
      const props = page.properties;
      const gameName = props['GameName']?.select?.name || '';
      const scoreVal = props['Score']?.number || 0;
      const dateVal = props['Date']?.date?.start || '';
      return {
        id: page.id,
        gameName,
        score: scoreVal,
        date: dateVal
      };
    });
    return res.json(scores);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ▼ スコア追加
app.post('/api/scores', async (req, res) => {
  const { userId, gameName, score } = req.body;
  if (!userId || !gameName) {
    return res.status(400).json({ success: false, error: 'Missing userId or gameName' });
  }
  try {
    const newPage = await notion.pages.create({
      parent: { database_id: DB_SCORE },
      properties: {
        "User": { relation: [{ id: userId }] },
        "GameName": { select: { name: gameName } },
        "Score": { number: score },
        "Date": { date: { start: new Date().toISOString() } }
      }
    });
    return res.json({ success: true, id: newPage.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ▼ フロントエンドのビルド結果を配信 (本番用)
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ▼ サーバー起動
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});