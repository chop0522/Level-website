-- Breakout game tables

-- 1) プレイログ（1プレイ1行）
CREATE TABLE IF NOT EXISTS breakout_runs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  play_date_jst DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  score INTEGER NOT NULL DEFAULT 0,
  stage_reached INTEGER NOT NULL DEFAULT 1,
  stage_cleared INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  client_version TEXT
);

CREATE INDEX IF NOT EXISTS idx_breakout_runs_date_score ON breakout_runs (play_date_jst, score DESC);
CREATE INDEX IF NOT EXISTS idx_breakout_runs_user_date ON breakout_runs (user_id, play_date_jst);
CREATE INDEX IF NOT EXISTS idx_breakout_runs_user_started ON breakout_runs (user_id, started_at DESC);

-- 2) ベスト記録集計
CREATE TABLE IF NOT EXISTS breakout_best (
  user_id BIGINT PRIMARY KEY,
  best_score INTEGER NOT NULL DEFAULT 0,
  best_stage_reached INTEGER NOT NULL DEFAULT 1,
  best_stage_cleared INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
