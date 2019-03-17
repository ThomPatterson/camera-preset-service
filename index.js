const express = require('express');
const app = express();
const config = process.env.hasOwnProperty('CONFIG') ? JSON.parse(process.env.CONFIG) : require('./config.js');

//The meat behind this is the wonderful onvif-nvt package from Jeffrey Galbraith (Hawkeye64)
//https://www.npmjs.com/package/onvif-nvt
//anyone looking to understand this app should review his documentation at
//https://hawkeye64.github.io/onvif-nvt/index.html
const OnvifManager = require('onvif-nvt');

//connect to the camera and return a 'camera' object
//https://hawkeye64.github.io/onvif-nvt/Camera.html
const getCameraInstance = async () => {
  try {
    let camera = await OnvifManager.connect(config.CAMERA_ADDRESS, config.ONVIF_PORT, config.ONVIF_USER, config.ONVIF_PASS, config.ONVIF_SERVICE_PATH);
    checkForPtz(camera);
    return camera;
  } catch (err) {
    console.error(`Error in getCameraInstance: ${err}`);
    throw err;
  }
}

//make sure this camera support PTZ (pan tilt zoom)
const checkForPtz = (camera) => {
  if (camera.hasOwnProperty('ptz')) {
    return;
  } else {
    let err = 'This camera doesnt appear to have PTZ support.'
    console.error(err);
    throw err;
  }
}

const logIt = (msg) => {
  console.log(new Date() + ': ' + msg);
}

//Show the caller which presets are available
//https://hawkeye64.github.io/onvif-nvt/Ptz.html#getPresets
app.get('/', async (req, res) => {
  try {

    let results = await camera.ptz.getPresets();
    let presets = results.data.GetPresetsResponse.Preset;

    let simpleDetails = presets.map(preset => {
      return {
        token: preset.$.token,
        name: preset.Name
      };
    });

    res.json({
      availablePresets: simpleDetails
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

//Go to a specified preset
//https://hawkeye64.github.io/onvif-nvt/Ptz.html#gotoPreset
app.get('/gotoPreset', async (req, res) => {
  try {
    let presetToken = (req.query.hasOwnProperty('presetToken')) ? req.query.presetToken : false;
    let returnSeconds = (req.query.hasOwnProperty('returnSeconds')) ? parseInt(req.query.returnSeconds) : false;

    if (!presetToken) {
      return res.status(400).send('Missing required parameter: presetToken');
    }

    logIt(`Moving to preset: ${presetToken}`);

    let camera = await getCameraInstance();

    let response = {};

    //if returnSeconds was specified, have the camera return to its
    //current position after that many seconds
    if (!!returnSeconds) {
      //figure out the current position
      let statusResults = await camera.ptz.getStatus();
      let curPosition = {
        x: statusResults.data.GetStatusResponse.PTZStatus.Position.PanTilt.$.x,
        y: statusResults.data.GetStatusResponse.PTZStatus.Position.PanTilt.$.y,
        z: statusResults.data.GetStatusResponse.PTZStatus.Position.Zoom.$.x,
      }

      let msg = `Will return to ${JSON.stringify(curPosition)} in ${returnSeconds} seconds.`;
      logIt(msg);
      response.next = msg;

      setTimeout(() => {
        logIt(`Returning to ${JSON.stringify(curPosition)}`);
        camera.ptz.absoluteMove('', curPosition)
      }, returnSeconds * 1000)
    }

    //go to the specified preset
    let results = await camera.ptz.gotoPreset('', presetToken);
    response.status = "Success";

    res.json(response);

  } catch (err) {
    return res.status(500).send(err);
  }


});

//fire it up
app.listen(8080);
console.log('Listening on port 8080');
