

// src/components/MyPageNav.jsx
import React, { useContext, useMemo } from 'react';
import { Stack, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/TokenContext';

/**
 * 共通ナビゲーションバー
 * MyPage / Achievements / Leaderboard / 公開プロフィール へのリンクをまとめて表示
 * ※ユーザー情報取得前は何もレンダリングしない
 */
export default function MyPageNav() {
  const { token } = useContext(AuthContext);

  // JWT から userId を抽出
  const userId = useMemo(() => {
    try {
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || '';
    } catch {
      return '';
    }
  }, [token]);

  // 未ログインまたはトークン未取得時はナビを表示しない
  if (!token) return null;

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ mb: 2, flexWrap: 'wrap' }}
    >
      {/* MyPage */}
      <Button
        component={Link}
        to="/mypage"
        variant="outlined"
        size="small"
      >
        MyPage
      </Button>

      {/* Achievements */}
      <Button
        component={Link}
        to="/achievements"
        variant="outlined"
        size="small"
      >
        実績
      </Button>

      {/* Leaderboard */}
      <Button
        component={Link}
        to="/leaderboard"
        variant="outlined"
        size="small"
      >
        ランキング
      </Button>

      {/* 公開プロフィール (自分) */}
      {userId && (
        <Button
          component={Link}
          to={`/profile/${userId}`}
          variant="outlined"
          size="small"
        >
          公開プロフィール
        </Button>
      )}
    </Stack>
  );
}