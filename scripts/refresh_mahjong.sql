-- refresh_mahjong.sql
-- (1) 今月マテビュー更新
REFRESH MATERIALIZED VIEW CONCURRENTLY mahjong_monthly;

-- (2) users.monthly_pt 更新（キャッシュ用途）
UPDATE users u
SET    monthly_pt = m.monthly_pt
FROM   mahjong_monthly m
WHERE  u.id = m.user_id
  AND  m.month = date_trunc('month', now())::date;

-- (3) 段位更新 (累積 total_pt 基準)
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
    FROM users
)
UPDATE users u
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
         SUM(monthly_pt) AS recent_pt
    FROM mahjong_monthly
   WHERE month >= date_trunc('month', now() - INTERVAL '6 months')::date
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
UPDATE users u
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