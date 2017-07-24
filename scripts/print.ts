import { GamesUpdate, getData } from '../src/getData';

console.time('print');
getData()
  .then(console.log)
  .then(() => {
    console.timeEnd('print');
  })
  .catch((err) => {
    console.log('Error: ', err);
    throw err;
  });
