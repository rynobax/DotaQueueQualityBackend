const uniqBy = require('lodash.uniqby');
import { fromBits } from 'long';
import { getLiveMatchRegionFromPlayers } from './odota';
const barLength = 20;

let d2: any = null;

const MMR_CUTOFF = 5000;

function init(Dota2: any) {
  d2 = Dota2;
}

interface STVGamesData {
  game_list: RawSTVGame[];
}

interface RawSTVGame {
  players: any[];
  average_mmr: number;
  lobby_id: any;
  league_id: number;
}

interface ParsedStvGame {
  playerIds: number[];
  average_mmr: number;
  lobby_id: number;
  league_id: number;
  region?: string;
}

let sourceTVGamesDataListening = false;

function getGamesData(pages: number): Promise<ParsedStvGame[]> {
  return new Promise((resolve, reject) => {
    let recievedPages = 0;
    const games: ParsedStvGame[] = [];

    sourceTVGamesDataListening = true;
    d2.requestSourceTVGames({
      league_id: 0,
      start_game: (pages - 1) * 10,
    });

    d2.on('sourceTVGamesData', ({game_list}: STVGamesData) => {
      if (!sourceTVGamesDataListening) { return; }
      recievedPages++;

      games.push(...game_list.map(({players, average_mmr, lobby_id, league_id}) => ({
        average_mmr,
        league_id,
        lobby_id: fromBits(lobby_id.low, lobby_id.high, lobby_id.unsigned).toInt(),
        playerIds: players.map(({account_id}) => account_id),
      })));

      if (recievedPages === pages) {
        sourceTVGamesDataListening = false;
        resolve(games);
      }
    });
  });
}

interface GamesUpdate {
  date: number;
  games: {[k: string]: number[]};
}

async function update(): Promise<GamesUpdate> {
  console.log('Checking matches');
  const now = new Date();

  let games: ParsedStvGame[] = [];
  games = await getGamesData(10);
  games = uniqBy(games, 'lobby_id');
  games = games.filter((game) => {
    return game.average_mmr > MMR_CUTOFF;
  });

  // Get region of each game
  for (const game of games) {
    const regionsAccumulator = {};
    game.region = await getLiveMatchRegionFromPlayers(game.playerIds);
  }

  const mmrPerRegion = games.reduce((obj: { [k: string ]: number[] }, {region, average_mmr}) => {
    if (obj[region] === undefined) {
      obj[region] = [];
    }
    obj[region].push(average_mmr);
    return obj;
  }, {});
  console.log('Done');
  return {
    date: now.getTime(),
    games: mmrPerRegion,
  };
}

export {
  GamesUpdate,
  init,
  update,
};
