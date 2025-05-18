import React from 'react';
import { Card, Avatar, Box, Typography, LinearProgress, Stack, alpha } from '@mui/material';
import { keyframes } from '@mui/system';

// glow + shake animation
const rankUpAnim = (color) => keyframes`
  0%   { filter: drop-shadow(0 0 0 ${color}); transform: translateY(0); }
  25%  { filter: drop-shadow(0 0 6px ${color}); transform: translateY(-2px); }
  50%  { filter: drop-shadow(0 0 10px ${color}); transform: translateY(2px); }
  75%  { filter: drop-shadow(0 0 6px ${color}); transform: translateY(-2px); }
  100% { filter: drop-shadow(0 0 0 ${color}); transform: translateY(0); }
`;

/**
 * XP カード
 * @param {object} props
 *  - category (jaLabel, e.g. 'ステルス')
 *  - color       カテゴリ基調色 (e.g. '#3f51b5')
 *  - currentXP
 *  - rankLabel  ('Rookie' | 'Bronze' | ...)
 *  - badgeUrl
 *  - nextXP     次ランク閾値 (null の場合は MAX)
 */
export default function XPCard({ category, currentXP, rankLabel, badgeUrl, nextXP, color = '#1976d2', animate = false }) {
  const percent = nextXP ? (currentXP / nextXP) * 100 : 100;

  return (
    <Card
      sx={(theme) => ({
        p: 2,
        backgroundColor: alpha(
          color,
          theme.palette.mode === 'dark' ? 0.10 : 0.12
        ),
        transition: '0.3s',
        boxShadow: theme.palette.mode === 'dark' ? 1 : 2,
        animation: animate
          ? `${rankUpAnim(color)} 1.2s ease-in-out`
          : 'none',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' ? 2 : 4
        }
      })}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={badgeUrl} />
        <Box flexGrow={1}>
          <Typography fontWeight="bold">{category}</Typography>
          <Typography variant="body2" color="text.secondary">
            {rankLabel} {nextXP && `(${currentXP} / ${nextXP} XP)`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              mt: 1,
              '& .MuiLinearProgress-bar': { backgroundColor: color }
            }}
          />
        </Box>
      </Stack>
    </Card>
  );
}