/* r6.js
 *
 * This file should contain actual scene rendering loops and any
 * additional setup code
 */

function runScene(meshes,sounds) {
  window.sounds = sounds;
  BABYLON.Engine.audioEngine.setGlobalVolume(0.1);
  window.NUM_LAPS = 2;
  window.LAP_DIST = 8;
  window.readyPressed = false;
  window.finished = false;
  createMaterials(); 
  var players = {};
  var startPos = { x: 200, y: 1.7, z : -66 };
  var bob = new Robot(0,new BABYLON.Vector3(startPos.x, startPos.y, startPos.z),meshes['Robot'],meshes['Robot'].skeleton);
  //This is set when connected
  //bob.mesh.material = materials.robot; 
  
  scene.clearColor = new BABYLON.Color3(0,0,0);

  meshes['track'].setEnabled(true);
  meshes['track'].scaling = new BABYLON.Vector3(1,1,1);
  meshes['buildings'].setEnabled(true);
  meshes['buildings'].scaling = new BABYLON.Vector3(1,1,1);

  // creates free-floating camera w/ default controls
  // click-drag to look, arrows to move, standard FP controls
  var freeCam = new BABYLON.FreeCamera('freeCam', new BABYLON.Vector3(0,300,-90), scene);
  freeCam.attachControl(canvas);
  
  // 0,0,0 visualization
  var origin = new BABYLON.Mesh.CreateSphere('origin', 20, 10, scene);
  origin.position = new BABYLON.Vector3(0,0,0);
  origin.material = new BABYLON.StandardMaterial('originmat',scene);
  origin.material.emissiveColor = new BABYLON.Color3(1,0,0);

  // followcam
  window.camera = new BABYLON.TargetCamera('camera1', new BABYLON.Vector3(0,5,-10), scene);
  camera.attachControl(canvas,false);
  scene.activeCamera = camera;

  // toggle to cam following our robot bob
  // radius is distance to maintain, height/rotation is as it sounds
  // acceleration is relative to target object
  // max allows fast-moving object to pull away
  var chaseCam = new BABYLON.FollowCamera('FollowCam', new BABYLON.Vector3(2,3,1), scene);
  chaseCam.target = bob.pivot;
  chaseCam.radius = 7;
  chaseCam.heightOffset = 2;
  chaseCam.rotationOffset = 90;
  chaseCam.cameraAcceleration = 0.1;
  chaseCam.maxCameraSpeed = 10;

  // toggle shadows if turned on in GET
  if (window.location.href.match(/shadows=1$/)) {
    // ambient light that allows for shadows
    var light2 = new BABYLON.DirectionalLight('light2', new BABYLON.Vector3(0,-0.8,0.2), scene);
    light2.diffuse = new BABYLON.Color3(1,1,1);
    light2.specular = new BABYLON.Color3(1,1,1);
    light2.position = new BABYLON.Vector3(0,150,0);
    light2.intensity = 1;

    //light buildings
    var uplight = new BABYLON.DirectionalLight('uplight', new BABYLON.Vector3(0,1,-0.2),scene);
    uplight.diffuse = new BABYLON.Color3(1,1,1);
    uplight.specular = new BABYLON.Color3(1,1,1);
    uplight.position = new BABYLON.Vector3(0,0,0);
    uplight.intensity = 5;

    var uplight2 = new BABYLON.DirectionalLight('uplight2', new BABYLON.Vector3(0,1,0.2),scene);
    uplight2.diffuse = new BABYLON.Color3(1,1,1);
    uplight2.specular = new BABYLON.Color3(1,1,1);
    uplight2.position = new BABYLON.Vector3(0,0,0);
    uplight2.intensity = 5;

    // enable shadows for bob
    var shadowGenerator = new BABYLON.ShadowGenerator(3300,light2);
    shadowGenerator.getShadowMap().renderList.push(bob.mesh);
    //shadowGenerator.usePoissonSampling = true;
    shadowGenerator.useBlurVarianceShadowMap = true;

    meshes['track'].receiveShadows = true;
    meshes['buildings'].receiveShadows = true;
    shadowGenerator.getShadowMap().refreshRate = 1;
  } else {
    // light the entire scene with ambient
    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,300,0),scene);
    light.diffuse = new BABYLON.Color3(0.8,0.8,0.8);
    light.specular = new BABYLON.Color3(0.8,0.8,0.8);
    light.groundColor = new BABYLON.Color3(0,0,0);
  }

  // sounds.bg1.loop = true;
  // sounds.bg1.autoplay = true;
  // sounds.bg1.setVolume(1.8);
  // sounds.bg1.play();

  scene.clearColor = new BABYLON.Color3(0.05,0.05,0.05);

  // start rendering
  engine.runRenderLoop(function() {
    scene.render();
    applyPositions(); 
  });
  
  // keep Babylon rendering at same scale as canvas
  window.addEventListener('resize', function() {
    engine.resize();
  });

  // additional listeners for debugging
  // use 'f' to flip cams through follow, chase, and free
  // use 'p' to toggle debug layer
  var switchcam = 0;
  var switchdebug = true;
  var togglemusic = true;
  var shadowMode = 0;

  window.addEventListener('keydown', function(e) {
    
    // L to stop shadows
    if (e.keycode===76) {
      //no idea how to make that happen
    }

    if (e.keyCode===70) {
      if (switchcam===0) {       
        scene.activeCamera = chaseCam;
      } else if (switchcam===1) {
        scene.activeCamera = camera;
      } else {
        freeCam.setTarget(origin.position);
        scene.activeCamera = freeCam;
      }
      switchcam = (switchcam<2)?switchcam+1:0;
    }
    if (e.keyCode===80) {
      if (switchdebug) {
        scene.debugLayer.show();
      } else {
        scene.debugLayer.hide();
      }
      switchdebug = !switchdebug;
    }

    // M to stop track
    if (e.keyCode === 77) {
      if (togglemusic) {
        sounds.bg1.stop();
      } else {
        sounds.bg1.play();
      }
      togglemusic = !togglemusic;
    }

  });
  //Connect to server once the scene is loaded to not miss any events

  window.socket = socket = io();
  socket.on('connect', function() {
    console.log('Connected');
  });
  var applyPositions = function(){
    if(window.positions) {
      for (var serverPlayerId in window.positions) {
        if (players[serverPlayerId]) {
          var serverPlayer = window.positions[serverPlayerId];
          players[serverPlayerId].update(serverPlayer);
        }
      }
    }
  };
  socket.on('positions', function(data) {
    window.positions = data; 
  });
  //a new player has connected
  socket.on('playerConnected', function(playerData) {
    var set = new Robot(playerData.socketId,new BABYLON.Vector3(startPos.x, startPos.y, startPos.z),meshes['Robot'],meshes['Robot'].skeleton);
    var color = (playerData.robotModel.color % 4) + 1;
    set.mesh.material = materials['robot' + color]; 
    players[playerData.socketId] = set;
  });
  
  socket.on('raceStarting', function() {
    console.log('race started');
    bob.distance = 0;
    reportLap(bob.distance,scene);
  });

  socket.on('finished', function(numPlayersFinished) {
    console.log('all done!');
    var info = document.getElementById('info');
    info.className = 'visible';
    var indexInPlaces = numPlayersFinished;
    var places = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    info.innerHTML = 'You finished in '
      + places[indexInPlaces] + '!<br/>Press enter to join a new game.';
    window.finished = true;  
  });
  socket.on('countdown', function() {
    console.log('counting down');
    var countdown = document.getElementById('info');
    countdown.className = 'visible';
    var countdownText = ['3..', '2..', '1..', 'GO!'];
    var index = 0;
    var counter = function() {
      countdown.innerHTML = countdownText[index];
      index++;
      if (index < countdownText.length) {
        setTimeout(counter, 1000);
      } else {
        countdown.className = 'shortfade';
      }
    };
    counter();
  });

  socket.on('connected', function(data) {
    //receives a object of connected players
    for (var playerId in data) {
      var player = data[playerId];
      var set;
      if(player.socketId === socket.id) {
        bob.id = socket.id;
        set = bob;
        var color = (player.robotModel.color % 4) + 1;
        set.mesh.material = materials['robot' + color];
      } else {
        set = new Robot(player.socketId,new BABYLON.Vector3(startPos.x, startPos.y, startPos.z),meshes['Robot'],meshes['Robot'].skeleton);
        var color = (player.robotModel.color % 4) + 1;
        set.mesh.material = materials['robot' + color];  
      }  
      players[player.socketId] = set;
    }
  });

  socket.on('playerDisconnected', function(player) {
      if(players[player.socketId]) {
        players[player.socketId].pivot.dispose();
        delete players[player.socketId];
      }
  });

  var info = document.getElementById('info');
  info.innerHTML = 'Press \'I\' to view the instructions.';
  info.className = 'longfade';

}

