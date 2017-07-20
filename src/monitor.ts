import { uniqBy } from 'lodash';
import { fromBits } from 'long';
import { getLiveMatchRegionFromPlayers } from './odota';
const ProgressBar = require('progress');
const barLength = 20;

let d2: any = null;
let updateTimeout: NodeJS.Timer = null;

const MMR_CUTOFF = 5000;

function init(Dota2: any) {
  d2 = Dota2;
}

function start() {
  update();
}

function stop() {
  clearTimeout(updateTimeout);
}

interface STVGamesData {
  game_list: RawSTVGame[]
}

interface RawSTVGame {
  players: any[],
  average_mmr: number,
  lobby_id: any,
  league_id: number
}

interface ParsedStvGame {
  playerIds: number[],
  average_mmr: number,
  lobby_id: number,
  league_id: number,
  region?: string
}

let sourceTVGamesDataListening = false;

function getGamesData(pages: number): Promise<ParsedStvGame[]> {
  return new Promise((resolve, reject) => {
    // TODO: use leagued_id to filter out league matches?
    let recievedPages = 0;
    const games: ParsedStvGame[] = [];
    const bar = new ProgressBar('Getting game pages :bar', { total: pages, width: barLength });

    sourceTVGamesDataListening = true;
    d2.requestSourceTVGames({
      start_game: (pages-1)*10,
      league_id: 0
    });

    d2.on('sourceTVGamesData', ({game_list}: STVGamesData) => {
      if(!sourceTVGamesDataListening) return;
      bar.tick();
      recievedPages++;

      games.push(...game_list.map(({players, average_mmr, lobby_id, league_id}) => ({
        playerIds: players.map(({account_id}) => account_id),
        average_mmr,
        lobby_id: fromBits(lobby_id.low, lobby_id.high, lobby_id.unsigned).toInt(),
        league_id
      })));

      if(recievedPages === pages) {
        sourceTVGamesDataListening = false;
        resolve(games);
      }
    });
  });
}

async function update() {
  let games: ParsedStvGame[] = [];
  games = await getGamesData(10);
  games = uniqBy(games, 'lobby_id');
  games = games.filter((game) => {
    if(game.league_id !== 0) console.log('non-zero league id: ', game.league_id);
    return game.average_mmr > MMR_CUTOFF;
  });
  console.log(`Games with mmr > ${MMR_CUTOFF}: ${games.length}`)

  // Get region of each game
  const bar = new ProgressBar('Getting match regions :bar', { total: games.length, width: barLength });
  for(const game of games) {
    const regionsAccumulator = {};
    game.region = await getLiveMatchRegionFromPlayers(game.playerIds);
    bar.tick();
  }

  //console.log('\nGames');
  //console.log(games);

  const gamesPerRegion = games.reduce((obj: { [k: string ]: number }, {region}) => {
    if(obj[region] === undefined) {
      obj[region] = 0;
    }
    obj[region]++;
    return obj;
  }, {});

  console.log('\nGames Per Region');
  console.log(gamesPerRegion);

  const averageRegionMmr = games.reduce((obj: { [k: string ]: number[] }, {region, average_mmr}) => {
    if(obj[region] === undefined) {
      obj[region] = [];
    }
    obj[region].push(average_mmr);
    return obj;
  }, {});

  console.log('\nAverage Region MMR')
  console.log(averageRegionMmr);
  process.exit();
}


export default {
  init,
  start,
  stop,
};
