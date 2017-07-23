import { get } from 'request';
const dotaconstants = require('dotaconstants');

// Api Limit
const timePerReqInSec = .35;
let lastRequest: number = 0;

const recentMatchesEndpoint = (id: number) => `https://api.opendota.com/api/players/${id}/recentMatches`;
const matchEndpoint = (id: number) => `https://api.opendota.com/api/matches/${id}`;

async function observeApiLimit() {
  return new Promise((resolve, reject) => {
    const now = new Date().getTime();
    const timeSinceLastReqInSec = (now - lastRequest) / 1000;
    if (timeSinceLastReqInSec < timePerReqInSec) {
      const waitTime = timePerReqInSec - timeSinceLastReqInSec;
      setTimeout(() => {
        lastRequest = new Date().getTime();
        resolve();
      }, waitTime * 1000);
    } else {
      lastRequest = new Date().getTime();
      resolve();
    }
  });
}

function getTopRegion(regions: {[k: string]: number}): string {
  let topCount = 0;
  let topRegion = '';
  for(const region in regions) {
    const regionCount = regions[region];
    if(regionCount > topCount) {
      topRegion = region;
      topCount = regionCount;
    }
  }
  return topRegion;
}

let getMatchRegionErrorCount = 0;
function getMatchRegion(matchId: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    await observeApiLimit();
    get(matchEndpoint(matchId), {}, (error, response, body) => {
      try {
        const json = JSON.parse(body);
        if(json.error) {
          if(json.error === 'rate limit exceeded') {
            setTimeout(() => {
              resolve(getMatchRegion(matchId));
            }, 1000);
          } else {
            throw Error(json.error);
          }
        }
        const cluster: number = json.cluster;
        const regionId = dotaconstants.cluster[cluster];
        const regionName = dotaconstants.region[regionId];
        getMatchRegionErrorCount = 0;
        resolve(regionName);
      } catch(e) {
        getMatchRegionErrorCount++;
        console.log(`getMatchRegion failure for id ${matchId} - ${getMatchRegionErrorCount}`)
        if(getMatchRegionErrorCount > 3) {
          console.error('getMatchRegion body: ', body);
          reject(e);
        } else {
          resolve(getMatchRegion(matchId));
        }
      }
    });
  });
}

let playerRegionErrorCount = 0;
function getPlayerRegion(playerId: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    await observeApiLimit();
    get(recentMatchesEndpoint(playerId), {}, async (error, response, body) => {
      if(error) { 
        reject(error);
      } else {
        try{
          // Get matches to check the users region
          let matchesToCheck = 3;
          const json = JSON.parse(body);
          if(json.error) {
            if(json.error === 'rate limit exceeded') {
              setTimeout(() => {
                resolve(getPlayerRegion(playerId));
              }, 1000);
            } else {
              throw Error(json.error);
            }
          }
          const matches = json;
          const regions: {[k: string]: number} = {};
          if(matches.length < matchesToCheck) {
            matchesToCheck = matches.length;
          }
          for(let i = 0; i < matchesToCheck; i++) {
            const match = matches[i];
            const cluster = match.cluster;
            const regionId = dotaconstants.cluster[cluster];
            const matchRegion = dotaconstants.region[regionId];
            if(regions[matchRegion] === undefined) regions[matchRegion] = 0
            regions[matchRegion]++;
          }

          const topRegion = getTopRegion(regions);
          playerRegionErrorCount = 0;
          resolve(topRegion);
        } catch(e) {
          playerRegionErrorCount++;
          console.log(`getPlayerRegion failure for id ${playerId} - ${playerRegionErrorCount}`)
          if(playerRegionErrorCount > 3) {
            console.error('getPlayerRegionNew body: ', body);
            reject(e);
          } else {
            resolve(getPlayerRegion(playerId));
          }
        }
      }
    })
  });
}

function getLiveMatchRegionFromPlayers(playerIds: number[]): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // How many players that need to have the same region
    const matchingPlayersLimit = 2;
    const regions: {[k: string]: number} = {};
    for(const playerId of playerIds) {
      const region = await getPlayerRegion(playerId);
      if(regions[region] === undefined) regions[region] = 0;
      regions[region]++;
      if(regions[region] > matchingPlayersLimit) return resolve(region);
    }
    // No region met the criteria so just return the top
    const topRegion = getTopRegion(regions);
    resolve(topRegion);
  });
}

export { getLiveMatchRegionFromPlayers };
