// src/pages/MyPage.jsx
import React, { useEffect, useState } from 'react';
import { getMyScores, addScore } from '../services/api';

function MyPage() {
  const [scores, setScores] = useState([]);
  const [gameName, setGameName] = useState('Mahjong');
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    const data = await getMyScores();
    setScores(data);
  };

  const handleAddScore = async () => {
    if (!gameName) return;
    const res = await addScore({ gameName, score: Number(score) });
    if (res.success) {
      alert('スコアを登録しました！');
      fetchScores();
    } else {
      alert('登録に失敗しました...');
    }
  };

  return (
    <div className="main-content">
      <h2>マイページ</h2>
      <p>あなたのハイスコア一覧</p>
      <ul>
        {scores.map((s) => (
          <li key={s.id}>
            <strong>{s.gameName}</strong> : {s.score} ({s.date})
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '20px' }}>
        <h3>スコアを追加</h3>
        <label>
          ゲーム名:
          <select value={gameName} onChange={(e) => setGameName(e.target.value)}>
            <option value="Mahjong">Mahjong</option>
            <option value="Catan">Catan</option>
            <option value="Dominion">Dominion</option>
          </select>
        </label>
        <br />
        <label>
          スコア:
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </label>
        <br />
        <button onClick={handleAddScore} className="button-retro">
          登録
        </button>
      </div>
    </div>
  );
}

export default MyPage;