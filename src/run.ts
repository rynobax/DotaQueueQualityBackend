import { getData, gamesUpdate} from './getData';
import { addToDB } from './db';

function run() {
  getData()
    .then(addToDB)
    .catch((err) => {
      console.log('Error: ', err);
      throw err;
    });
}

export { run };