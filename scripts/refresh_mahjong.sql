-- refresh_mahjong.sql
-- 月次マテビューを user_id 集計（JST・テスト除外）で再定義し、
-- ランキング用のキャッシュ＆段位更新まで一括で実行します。

-- 0) マテビューを再作成（JST月、is_test=false のみ集計）
DROP MATERIALIZED VIEW IF EXISTS public.mahjong_monthly;

CREATE MATERIALIZED VIEW public.mahjong_monthly AS
SELECT
  g.user_id,
  date_trunc('month', (g.played_at AT TIME ZONE 'Asia/Tokyo'))::date AS month,
  SUM(g.point)  AS total_points,
  COUNT(*)      AS games
FROM public.mahjong_games g
WHERE COALESCE(g.is_test, false) = false
GROUP BY g.user_id, date_trunc('month', (g.played_at AT TIME ZONE 'Asia/Tokyo'));

-- 0b) REFRESH CONCURRENTLY 用のユニークインデックス＋並び替え用インデックス
CREATE UNIQUE INDEX IF NOT EXISTS mahjong_monthly_user_month_uidx
  ON public.mahjong_monthly (user_id, month);
CREATE INDEX IF NOT EXISTS mahjong_monthly_month_points_idx
  ON public.mahjong_monthly (month, total_points DESC);

-- 1) 今月マテビュー更新（作り直し直後でも冪等）
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mahjong_monthly;

-- 2) users.monthly_pt 更新（キャッシュ用途／JST基準）
UPDATE public.users u
SET    monthly_pt = m.total_points
FROM   public.mahjong_monthly m
WHERE  u.id = m.user_id
  AND  m.month = date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo'))::date;

-- 3) 段位更新 (累積 total_pt 基準)
WITH rank_calc AS (
  SELECT id,
         total_pt,
         CASE
           WHEN total_pt >= 3100 THEN 5
           WHEN total_pt >= 2000 THEN 4
           WHEN total_pt >= 1200 THEN 3
           WHEN total_pt >=  650 THEN 2
           ELSE 1
         END AS r,
         CASE
           WHEN total_pt >= 3100             THEN 3
           WHEN total_pt >= 2700 THEN 2
           WHEN total_pt >= 2300 THEN 1
           WHEN total_pt >= 2000              THEN 3
           WHEN total_pt >= 1700 THEN 2
           WHEN total_pt >= 1400 THEN 1
           WHEN total_pt >= 1200              THEN 3
           WHEN total_pt >= 1000 THEN 2
           WHEN total_pt >=  800 THEN 1
           WHEN total_pt >=  650              THEN 3
           WHEN total_pt >=  500 THEN 2
           WHEN total_pt >=  350 THEN 1
           WHEN total_pt >=  200              THEN 3
           WHEN total_pt >=  100 THEN 2
           ELSE 1
         END AS subr
    FROM public.users
)
UPDATE public.users u
SET    mahjong_rank    = rc.r,
       mahjong_subrank = rc.subr
FROM   rank_calc rc
WHERE  u.id = rc.id;

/* ==========================================================
   降段ロジック : 直近 6 ヶ月の月間Pt 合計で判定
   ----------------------------------------------------------
   - recent_pt が現在ランク閾値を下回ったユーザーのみ降段
   - 同ランク内では subrank を下げる (III → II → I)
   - ランクが下がる場合は subrank を 3 (III) にリセット
========================================================== */
WITH recent AS (
  SELECT user_id,
         SUM(total_points) AS recent_pt
    FROM public.mahjong_monthly
   WHERE month >= date_trunc(
                     'month',
                     ((now() AT TIME ZONE 'Asia/Tokyo') - INTERVAL '6 months')
                   )::date
   GROUP BY user_id
), new_grade AS (
  SELECT user_id,
         CASE
           WHEN recent_pt >= 3100 THEN 5
           WHEN recent_pt >= 2000 THEN 4
           WHEN recent_pt >= 1200 THEN 3
           WHEN recent_pt >=  650 THEN 2
           ELSE 1
         END AS rnk,
         CASE
           WHEN recent_pt >= 3100             THEN 3
           WHEN recent_pt >= 2700 THEN 2
           WHEN recent_pt >= 2300 THEN 1
           WHEN recent_pt >= 2000              THEN 3
           WHEN recent_pt >= 1700 THEN 2
           WHEN recent_pt >= 1400 THEN 1
           WHEN recent_pt >= 1200              THEN 3
           WHEN recent_pt >= 1000 THEN 2
           WHEN recent_pt >=  800 THEN 1
           WHEN recent_pt >=  650              THEN 3
           WHEN recent_pt >=  500 THEN 2
           WHEN recent_pt >=  350 THEN 1
           WHEN recent_pt >=  200              THEN 3
           WHEN recent_pt >=  100 THEN 2
           ELSE 1
         END AS subr
    FROM recent
)
UPDATE public.users u
SET    mahjong_rank =
          LEAST(u.mahjong_rank, ng.rnk),
       mahjong_subrank =
          CASE
            WHEN ng.rnk < u.mahjong_rank
                 THEN 3                           -- ランクダウン時は subrank を III に
            WHEN ng.rnk = u.mahjong_rank
                 THEN LEAST(u.mahjong_subrank, ng.subr) -- 同一ランク内でのみ降段
            ELSE u.mahjong_subrank
          END
FROM   new_grade ng
WHERE  u.id = ng.user_id;