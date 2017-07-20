const dota2 = require('dota2');
const steam = require('steam');

const config = require('../config');
import monitor from './monitor';
const steamClient = new steam.SteamClient();
const steamUser = new steam.SteamUser(steamClient);
const steamFriends = new steam.SteamFriends(steamClient);
const Dota2 = new dota2.Dota2Client(steamClient, false, false);

function launch() {
  function onSteamLogOn(logonResp: any) {
    if (logonResp.eresult === steam.EResult.OK) {
      console.log('Logged on.');
      console.log('Launching Dota2...');
      Dota2.launch();
      Dota2.on('ready', () => {
        console.log('Launched.');
        monitor.init(Dota2);
        monitor.start();
      });
    }
  }

  function onSteamError(error: any) {
    console.log('Connection closed by server: ', error);
  }

  console.log('Connecting to steam...');
  steamClient.connect();
  steamClient.on('connected', () => {
    console.log('Connected.');
    console.log('Logging in to account...');
    steamUser.logOn({
      account_name: config.username,
      password: config.password,
    });
  });
  steamClient.on('logOnResponse', onSteamLogOn);
  steamClient.on('error', onSteamError);
}

export default launch;
