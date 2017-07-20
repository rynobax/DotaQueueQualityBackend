let d2: any = null;
let updateTimeout: NodeJS.Timer = null;

function init(Dota2: any) {
  d2 = Dota2;
}

function start() {
  const timeoutInSec = 60;
  updateTimeout = setTimeout(update, 60 * 1000);
}

function stop() {
  clearTimeout(updateTimeout);
}

function update() {
  d2.requestSourceTVGames({});
  d2.on('sourceTVGamesData', (data: any) => {
    console.log('Successfully received SourceTVGames: ');
    console.log(data.game_list);
  });
}

export {
  init,
  start,
  stop,
};
