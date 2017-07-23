const dynamoose = require('dynamoose');
import { GamesUpdate } from './monitor';

const version = 1; // Update version if schema changes
const options = {
  create: true, // Create table in DB, if it does not exist,
  update: false, // Update remote indexes if they do not match local index structure

  // Disable these for production
  waitForActive: true, // Wait for table to be created before trying to use it
  waitForActiveTimeout: 60000, // wait 3 minutes for table to activate
}
const config = require('../config');
dynamoose.AWS.config.update({
  accessKeyId: config.accessKeyId,
  region: config.region,
  secretAccessKey: config.secretAccessKey,
});
dynamoose.setDefaults(options);
dynamoose.local();

const MatchDataSchema = new dynamoose.Schema({
  date: {
    hashKey: true,
    type: Number,
  },
  games: {
    type: String,
  },
});

const Match = dynamoose.model('MatchData'+version, MatchDataSchema);

function addToDB(gamesUpdate: GamesUpdate) {
  return new Promise((resolve, reject) => {
    const {date, games} = gamesUpdate;
    let gamesJson = '';
    try {
      gamesJson = JSON.stringify(games);
    } catch (e) {
      return reject(e);
    }
    const match = new Match({
      date,
      games: gamesJson,
    });
    console.log('Saving to DB...');
    match.save((err: Error) => {
      if (err) { reject(err); }
      console.log('Done');
      resolve(games);
    });
  });
}

function getAll() {
  interface Data {
    date: number;
    games: string;
  }
  return new Promise((resolve, reject) => {
    Match.scan().all().exec((err: Error, data: any) => {
      resolve(data.map(({date, games}: Data) => {
        return {
          date,
          games: JSON.parse(games)
        }
      }));
    });
  });
}

export {addToDB, getAll};
