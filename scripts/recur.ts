import {run} from '../src/run';
const schedule = require('node-schedule');

schedule.scheduleJob('*/10 * * * *', () => {
  run();
});
