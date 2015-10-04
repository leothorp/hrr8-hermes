/* assets.js
 *
 * This should assign a global array of asset info objects
 * and also set a scale
 *
 * Optionally include a scale per-mesh
 *
 * TODO: sounds autoplay, loop, volume?
 *
 */

window.ASSET_SCALE = 0.02;

window.ASSETS = [

  // { 'name' : 'Skitter',
  //   'type' : 'mesh',
  //   'file' : 'Assets/enemy@idleRun.babylon' },

  { 'name' : 'Robot',
    'type' : 'mesh',
    'scale': 0.03,
    'file' : 'assets/robot.babylon' },

  { 'name' : 'track',
    'type' : 'mesh',
    'file' : 'Assets/course_2_oblong.babylon'},

  { 'name' : 'bg1',
    'type' : 'sound',
    'file' : 'sounds/bg/industrialfunk.wav'},

  { 'name' : 'boom1',
    'type' : 'sound',
    'file' : 'sounds/boom1.wav'},

  { 'name' : 'step',
    'type' : 'sound',
    'file' : 'sounds/step.wav'}

];
