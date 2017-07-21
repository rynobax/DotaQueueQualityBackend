import { launch, gamesUpdate} from './src/launch';
import { addToDB } from './src/db';

launch().then(addToDB).then((games) => {
  console.log('games: ', games);
  process.exit();
}).catch((err) => {
  console.log('Error: ', err);
  throw err;
});