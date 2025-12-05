import React from 'react'
import { Stack, Chip, Tooltip } from '@mui/material'

/**
 * @param {{ stats?: { highest_score?: number, rank1_count?: number, rank2_count?: number, rank3_count?: number, rank4_count?: number } }} props
 */
export default function MahjongStatsChips({ stats }) {
  if (!stats) return null
  const {
    highest_score = 0,
    rank1_count = 0,
    rank2_count = 0,
    rank3_count = 0,
    rank4_count = 0,
  } = stats

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }} aria-label="麻雀成績">
      <Tooltip title="これまでの最終持ち点の最高値">
        <Chip label={`最高得点 ${highest_score}`} size="small" color="secondary" />
      </Tooltip>
      <Chip label={`1位 ${rank1_count}回`} size="small" variant="outlined" />
      <Chip label={`2位 ${rank2_count}回`} size="small" variant="outlined" />
      <Chip label={`3位 ${rank3_count}回`} size="small" variant="outlined" />
      <Chip label={`4位 ${rank4_count}回`} size="small" variant="outlined" />
    </Stack>
  )
}
