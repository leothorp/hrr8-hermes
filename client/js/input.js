/* input.js
 *
 * This file will register all listeners for game logic
 * 
 * TODO:  separate out input_functions
 *        move server comm to out also??
 *
 */

window.addEventListener('keydown', function(e) {
  //user has pressed Enter and wants to start a race, or enter a new one
  if (e.keyCode === 13) {
    if (!window.readyPressed) {
      socket.emit('readyToRace');
      var infoBox = document.getElementById('info');
      //keeps this message from displaying for a split second
      //if you're the last one to press it
      setTimeout(function () {
        if (infoBox.innerHTML === 'Press \'I\' to view the instructions.') {
          infoBox.className = 'visible';
          infoBox.innerHTML = 'Ready...or are you?';
        } 
      }, 60);  
      window.readyPressed = true;
    } else if (window.finished) {
      window.location.reload();
    }
    return;
  } else {
    if (e.keyCode === 73) {
      var instructions = document.getElementById('instructions');
      if (instructions.className === 'absent') {
        instructions.className = 'visible';
      } else {
        instructions.className = 'absent';
      }
    }
  }
  // Global object for all inputs
  // 1 = triggered
  // 0 = untriggered
  var obj = {};
  obj['K' + String.fromCharCode(e.keyCode)] = 1;
  socket.emit('movementInput',obj);
});
window.addEventListener('keyup', function(e) {
  //USER_INPUT['K' + String.fromCharCode(e.keyCode)] = 0;
    var obj = {};
  obj['K' + String.fromCharCode(e.keyCode)] = 0;
  socket.emit('movementInput',obj);
});

// window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 73 }))