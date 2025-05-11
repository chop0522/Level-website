import React from 'react';
import { Card, Avatar, Box, Typography, LinearProgress, Stack } from '@mui/material';

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
export default function XPCard({ category, currentXP, rankLabel, badgeUrl, nextXP, color = '#1976d2' }) {
  const percent = nextXP ? (currentXP / nextXP) * 100 : 100;

  return (
    <Card sx={{ p: 2, backgroundColor: `${color}22` }}>
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