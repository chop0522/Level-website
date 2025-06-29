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