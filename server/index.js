//Modules for server
var express = require("./server");
var Game = require('./game');
var server = require('http').Server(express);
var io = require('socket.io')(server);
var PNG = require('pngjs2').PNG;
var fs = require('fs');


//The list of games in the server
var games = {};
var nextGameId = 1;
var currentMapName = 'city';
var maps = {
  circle: {
    name: 'Circle of Iniquity',
    path: 'server/assets/scaledCircleMap',
    width: null,
    height: null,
    grid: null,
  },
  star: {
    name: 'Satan\'s Secret Star',
    path: 'server/assets/course_1_star',
    width: null,
    height: null,
    grid: null
  },
  oblong: {
    name: 'The Odious Oblong',
    path: 'server/assets/course_2_oblong',
    width: null,
    height: null,
    grid: null
  },
  city: {
    name: 'The Careening City Course',
    path: 'server/assets/course_3_city',
    width: null,
    height: null,
    grid: null
  }
};
//Load up a map grid for collision detection and start a game
initialize();

//load the map grid, as soon as that's complete, use it to instantiate a Game
function initialize() {
  loadMapGrid(currentMapName, createGame);
  console.log(games);
}

function loadMapGrid(mapName, callback) {
  var mapObj = maps[mapName]; 
  fs.createReadStream(mapObj.path+'.png')
    .pipe(new PNG({
      filterType: 4
    }))
    .on('parsed', function() {
      mapObj.grid = processImageIntoBitArray(this.data, this.width, this.height);
      mapObj.width = this.width;
      mapObj.height = this.height;
      console.log(mapObj.width);
      callback();
    }); 
}

function createGame() {
  var game = new Game(nextGameId, io, maps[currentMapName]);
  games[nextGameId] = game;
  nextGameId++;
  return game;
}

//Listen to connections from socket.io
io.on('connection', function(socket) {
  //add this player to the first open game
  var currentGame;
  var maxPlayers = 0;
  var numPlayers = 0;
  for (var i = 1; i < nextGameId; i++)  {

//only put a player in a game that has not already begun and is not full
    if (!games[i].raceInProgress && games[i].numPlayers < games[i].maxPlayers && !currentGame) {
      currentGame = games[i];
    }
    numPlayers += games[i].numPlayers;
    maxPlayers += games[i].maxPlayers;
  }
  //if we haven't found a game that meets those conditions, create one.
  if (currentGame === undefined) {
    currentGame = createGame();
  }
  console.log(numPlayers / maxPlayers)
  if(numPlayers / maxPlayers >= .75) {
    createGame();
    console.log("Creating another game. This is " + (nextGameId - 1)  + " games!")
  }
  currentGame.addPlayer(socket.id);
  //Gets the recently added player from game object
  var currentPlayer = currentGame.players[socket.id];
  //Let all the players know about the new player
  currentGame.sendToClients('playerConnected',currentGame.getSendablePlayer(currentPlayer),socket)


  //receive input from players, hand off to the appropriate game object to calculate positions
  socket.on('movementInput', function(inputObj) {
    currentGame.parseInput(inputObj, socket.id);
  }); 

  socket.on('readyToRace', function() {
    currentGame.playerIsReady(socket.id);
  });
  
  //send all player info to recently connected player
  setTimeout(function() {
    var ps = {};
    for(var pid in currentGame.players) {
      var player = currentGame.players[pid];
      ps[player.socketId] = currentGame.getSendablePlayer(player);
    }
    socket.emit("connected", ps);
  }, 500);

  socket.on('seeking new game', function() {

  });
  //Handle when a player disconnects from server
  socket.on('disconnect', function() {
    currentGame.removePlayer(socket.id);
    console.log('dc');
    //Tell all other players that he is disconnected
    io.sockets.emit('playerDisconnected', currentGame.getSendablePlayer(currentPlayer));
  });
});

//Finds the game a socket is connected to.
function getGameBySocketId(socketId) {
  for (var gameId in games) {
    for(var playerId in games[gameId].players) {
      if (playerId === socketId) return games[gameId];
    }
  }
}


//Start up express and socket io
var port = process.env.PORT || 3000;
server.listen(port);


//converts data from png of the map into a multidimensional array of 1s and 0s, 
//representing white and black pixels resepectively
function processImageIntoBitArray(imageDataArray, width, height) {
  var bitArrayGrid = [];
  var numRows = height;
  var rowLength = width;
  for (var i = 0; i < numRows; i++) {
    var row = [];
    for (var j = 0; j < rowLength; j++) {
      var currentIndex = (j * 4) + (rowLength * i * 4);
      var startOfPixel = imageDataArray[currentIndex];
      //if imageDataArray[index] is the start of a white pixel, push a 1
      if (startOfPixel === 255) {
        row.push(1);    
      } else {
        //else, it is a black pixel, so push a 0
        row.push(0);
      }
    }
    bitArrayGrid.push(row);  
  }
  //console.log(bitArrayGrid[170][258]);
  findWhiteZone(bitArrayGrid);
  return bitArrayGrid;
}

//used for testing that our bitArrayGrid is correct
//keep this in the file until our track is finalized
function findWhiteZone(grid) {
  var count = 0;
  var breaking = false;
  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid.length; j++) {
      if (grid[i][j] === 1) {
        console.log('first white pixel: row: ' + i + 'column: ' + j );
        count++;
        breaking = (count > 0); 
        if (breaking) break;
      }  
    }
    if (breaking) break;
  } 
  return [i, j];
}  
