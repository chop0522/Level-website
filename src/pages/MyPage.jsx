// src/pages/MyPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Button } from '@mui/material';
import { getUserInfo } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Radar chart related imports
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register radar components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function MyPage({ token }) {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!token) {
      alert('ログインしてください');
      navigate('/login');
      return;
    }
    fetchUserInfo();
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const data = await getUserInfo(token);
      if (data.error) {
        alert('ユーザー情報の取得に失敗しました');
      } else {
        setUserInfo(data);
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    }
  };

  // レーダーチャート用データを生成
  // カラム順：heavy, light, quiz, party, stealth, gamble
  const createRadarData = () => {
    if (!userInfo) return null;

    const {
      xp_heavy = 0,
      xp_light = 0,
      xp_quiz = 0,
      xp_party = 0,
      xp_stealth = 0,
      xp_gamble = 0
    } = userInfo;

    return {
      labels: [
        '重量級',   // xp_heavy
        '軽量級',   // xp_light
        'クイズ',   // xp_quiz
        'パーティ', // xp_party
        '正体隠匿', // xp_stealth
        'ギャンブル' // xp_gamble
      ],
      datasets: [
        {
          label: 'カテゴリ別XP',
          data: [
            xp_heavy,
            xp_light,
            xp_quiz,
            xp_party,
            xp_stealth,
            xp_gamble
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  // レーダーチャートオプション
  const radarOptions = {
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>My Page</Typography>
      {userInfo ? (
        <>
          <Typography>ようこそ, {userInfo.name}さん</Typography>
          <Typography>登録メール: {userInfo.email}</Typography>
          {/* ここで麻雀の役リストやスコアを表示する機能を実装可能 */}

          {/* レーダーチャート: カテゴリ別XP */}
          <div style={{ marginTop: '30px', maxWidth: '600px' }}>
            <Typography variant="h6" gutterBottom>
              カテゴリ別XPレーダーチャート
            </Typography>
            {createRadarData() && (
              <Radar 
                data={createRadarData()} 
                options={radarOptions}
              />
            )}
          </div>
        </>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </Container>
  );
}

export default MyPage;