SELECT aggr.cluster, SUM(aggr.CLUSTER_COUNT)
FROM (
    SELECT info.cluster, COUNT(info.cluster) as cluster_count
    FROM (
        SELECT player_matches.account_id, matches.cluster
        FROM player_matches
        INNER JOIN matches ON matches.match_id=player_matches.match_id
        WHERE player_matches.account_id = 113331514
        LIMIT 10
    ) AS info 
    GROUP BY info.cluster
    
    union all
    
    SELECT info.cluster, COUNT(info.cluster) as cluster_count
    FROM (
        SELECT player_matches.account_id, matches.cluster
        FROM player_matches
        INNER JOIN matches ON matches.match_id=player_matches.match_id
        WHERE player_matches.account_id = 92847434
        LIMIT 10
    ) AS info 
    GROUP BY info.cluster
) as aggr
GROUP BY aggr.cluster