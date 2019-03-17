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

//Show the caller which presets are available
app.get('/', async (req, res) => {
  try {
    let camera = await getCameraInstance();

    let results = await camera.ptz.getPresets();
    //console.log(JSON.stringify(results.data.GetPresetsResponse));
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
    throw err;
  }
});

//fire it up
app.listen(8080);
console.log('Listening on port 8080');
