import { addToDB } from './db';
import { GamesUpdate, getData } from './getData';

function run() {
  getData()
    .then(addToDB)
    .catch((err) => {
      console.log('Error: ', err);
      throw err;
    });
}

export { run };
