// src/services/api.js

// FAQ問い合わせ投稿
export async function postFaqQuestion(question) {
    const res = await fetch('/api/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    return await res.json();
  }
  
  // 予約作成
  export async function createReservation({ dateTime, people }) {
    const res = await fetch('/api/reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateTime, people, userId: "TEST_USER_ID" })
    });
    return await res.json();
  }
  
  // 自分のスコア取得
  export async function getMyScores() {
    // 仮に userId: "TEST_USER_ID" で問い合わせ
    const res = await fetch('/api/scores?userId=TEST_USER_ID');
    return await res.json();
  }
  
  // スコア追加
  export async function addScore({ gameName, score }) {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: "TEST_USER_ID",
        gameName,
        score
      })
    });
    return await res.json();
  }