function getClusterSumsQuery(playerIds: number[]): string {
  const middle: string = playerIds
    .map((id) => {
      return `SELECT info.cluster, COUNT(info.cluster) as cluster_count
      FROM (
          SELECT player_matches.account_id, matches.cluster
          FROM player_matches
          INNER JOIN matches ON matches.match_id=player_matches.match_id
          WHERE player_matches.account_id = ${id}
          LIMIT 10
      ) AS info
      GROUP BY info.cluster`;
    })
    .join('\nunion all\n');
  const top = 'SELECT aggr.cluster, SUM(aggr.CLUSTER_COUNT) FROM (\n';
  const bot = '\n) as aggr GROUP BY aggr.cluster';
  const query = top + middle + bot;
  return encodeURIComponent(query);
}
