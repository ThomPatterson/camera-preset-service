# camera-preset-service
Web Service written in Node.js to control your ONVIF-enabled camera by existing presets.

Modify [config.js](config.js) with the correct values for your camera.

Run with `node index.js`.  This will create a server listening on port 8080.

See [camera-preset-service](https://cloud.docker.com/u/thompatterson/repository/docker/thompatterson/camera-preset-service) on DockerHub to run this project in a container.

#### Check which presets you already have created on the camera.
```
$ curl -s "http://localhost:8080/" | jq
{
  "availablePresets": [
    {
      "token": "1",
      "name": "patio"
    },
    {
      "token": "2",
      "name": "treefort"
    },
    {
      "token": "3",
      "name": "driveway"
    }
  ]
}
```

#### Specify a preset to move the camera to.
```
$ curl -s "http://localhost:8080/gotoPreset?presetToken=2" | jq
{
  "status": "Success"
}
```

#### Specify a preset to move the camera to and the number of seconds after which the camera will return to where it was prior.
```
$ curl -s "http://localhost:8080/gotoPreset?presetToken=1&returnSeconds=60" | jq
{
  "next": "Will return to {\"x\":\"-0.747833\",\"y\":\"0.516952\",\"z\":\"0.000000\"} in 60 seconds.",
  "status": "Success"
}
```
