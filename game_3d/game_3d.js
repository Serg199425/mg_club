$(document).on('ready', function() {
  loaded_models = 0;
  initialize_renderer();
  initialize_objects();
});


var WIDTH = window.innerWidth - 20;
var HEIGHT = window.innerHeight - 20;
var LEFT_BORDER = - window.innerWidth / 2;
var RIGHT_BORDER = - window.innerWidth/ 2;
var UP_BORDER = 0;
var DOWN_BORDER = window.innerHeight;
var PLANE_MAX_ANGLE = 0.5;
var PLANE_ANGLE_STEP = 0.05;
var MAX_SPEED_X = 1;
var SPEED_UP_STEP = 5;
var SPEED_DOWN_STEP = 1;
var BULLET_SPEED_Y = 10;
var BOOM_SPEED = 20;
var BOOM_DURATION_CIRCLES = 100;
var CLOUD_SPEED_X = 1;
var CLOUD_SPEED_Y = 20;
var CLOUD_BOOM_SPEED = 40;
var IRON_MAN_SPEED_X = 5;
var IRON_MAN_RADAR_RADIUS = 200;
var RELOAD_TIME = 10;
var game_is_started = false;
var MODELS_COUNT = 2;

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
  stats.update();
}

function render_with_text() {
  renderer.render(create_scene_with_text());
}

function onWindowResize() {

  camera.aspect = window.innerWidth - 20 / window.innerHeight - 20;
  camera.updateProjectionMatrix();
  controls.handleResize();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function initialize_renderer() {

  container = document.getElementById( 'container' );

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor( 0xaaccff );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( WIDTH, HEIGHT );

  container.innerHTML = "";

  container.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize, false );

  stats = new Stats();
  stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb

  // align top-left
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
}

function initialize_objects() {

  camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 20000 );
  camera.position.z = 75;
  camera.position.y = 20;

  scene = new THREE.Scene();

  var light = new THREE.AmbientLight( 0xffffff ); // soft white light
  scene.add( light );

  dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  dirLight.color.setHSL( 0.1, 1, 0.95 );
  dirLight.position.set( -1, 1.75, 1 );
  dirLight.position.multiplyScalar( 50 );
  scene.add( dirLight );

  dirLight.castShadow = true;

  dirLight.shadowMapWidth = 1048;
  dirLight.shadowMapHeight = 1048;

  var d = 50;

  dirLight.shadowCameraLeft = -d;
  dirLight.shadowCameraRight = d;
  dirLight.shadowCameraTop = d;
  dirLight.shadowCameraBottom = -d;

  dirLight.shadowCameraFar = 3500;
  dirLight.shadowBias = -0.0001;
  dirLight.shadowDarkness = 0.35;
  dirLight.shadowCameraVisible = true;
  scene.add( dirLight );

  controls = new THREE.FirstPersonControls( camera );

  plane = new Plane(camera);

  load_models();
}

function load_models() {
  var loader = new THREE.OBJMTLLoader();

  // load an obj / mtl resource pair
  loader.crossOrigin = 'anonymous';
  loader.load(
    // OBJ resource URL
    'models/Mark_42.obj',
    // MTL resource URL
    'models/Mark_42.mtl',
    // Function when both resources are loaded
    function ( object ) {
      mesh = object;
      mesh.rotateX(-Math.PI / 2);
      mesh.rotateY(Math.PI);
      mesh.position.z = -60;
      mesh.scale.x = 2;
      mesh.scale.y = 2;
      mesh.scale.z = 2;
      scene.add( object );
      loaded_models += 1;
    }
  );

  loader.load(
    // OBJ resource URL
    'models/Su-47_Berkut.obj',
    // MTL resource URL
    'models/Su-47_Berkut.mtl',
    // Function when both resources are loaded
    function ( object ) {
      object.rotateX(-Math.PI / 2);
      loaded_models += 1;
      plane.mesh = object;
      scene.add( object );
    },
    // Function called when downloads progress
    function ( xhr ) {
      console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    },
    // Function called when downloads error
    function ( xhr ) {
      console.log( 'An error happened' );
    }
  );


  // var loader = new THREE.ColladaLoader();

  // loader.load(
  //   // resource URL
  //   'models/Ironman.dae',
  //   // Function when resource is loaded
  //   function ( collada ) {
  //     scene.add( collada.scene );
  //   },
  //   // Function called when download progresses
  //   function ( xhr ) {
  //     console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
  //   }
  // );
}

function start() {
  if (game_is_started || loaded_models != MODELS_COUNT) return;
  game_is_started = true;
  move_interval = setInterval(move_objects, 10);
  render();
}

function move_objects() {
  plane.move();
}

var keys = {};
var previous_keys = {};

$(document).keydown(function (e) {
    keys[e.which] = true; 

    if (keys[13] && game_is_started == false) {
      start();
      return;
    }

    if (game_is_started == false)
      return;

    if (keys[37] && !keys[39] || keys[37] && keys[39] && plane.speed_x > 0) {
      plane.start_move(-1);
    } else {
      if (keys[39] && !keys[37] || keys[37] && keys[39] && plane.speed_x < 0)
        plane.start_move(1);
    }
    // if (keys[32])
    //   plane.shoot();
    previous_keys = keys;
});

$(document).keyup(function (e) {
    delete keys[e.which];
    if (!keys[37] && !keys[39])
      plane.stop_move();
});

function Plane (camera) {
  this.camera = camera;
  this.speed_x = 0;
  this.reload_time = 0;
  this.bullets = [];
  this.rotation = 0;
}

Plane.prototype.move = function() {
  // this.reload();
  this.update_position();
  // this.update_bullets_position();
}

// Plane.prototype.reload = function() {
//   if (this.reload_time > 0) this.reload_time--;
// }

Plane.prototype.start_move = function(direction) {
  this.speed_x = direction * MAX_SPEED_X;
}

Plane.prototype.stop_move = function() {
  this.speed_x = 0;
}

// Plane.prototype.shoot = function() {
//   if (this.reload_time > 0) return;
//   this.reload_time = RELOAD_TIME;
//   this.bullets.push(new Bullet(this.pos_x + 30, this.pos_y + 120));
//   this.bullets.push(new Bullet(this.pos_x - 30, this.pos_y + 120));
// }

Plane.prototype.update_position = function() {
  var direction = sign(this.speed_x);
  sign(direction) != sign(this.rotation) ? this.mesh.position.x += this.speed_x / 5 : this.mesh.position.x += this.speed_x;
  if (this.mesh.position.x < -40) {
    this.mesh.position.x = -40;
    this.speed_x = 0;
  }
  if (this.mesh.position.x > 40) {
    this.mesh.position.x = 40
    this.speed_x = 0;
  }

  this.camera.position.x += this.speed_x / 2;

  if (this.speed_x != 0) {
    if (Math.abs(this.rotation * PLANE_ANGLE_STEP) <= PLANE_MAX_ANGLE || sign(direction) != sign(this.rotation)) {
      this.rotation += direction;
      this.mesh.rotateY(PLANE_ANGLE_STEP * direction);
    }
  } else {
    if (this.rotation != 0) {
      this.mesh.rotateY(-sign(this.rotation) * PLANE_ANGLE_STEP);
      this.rotation += -sign(this.rotation);
    }
  }
}

// Plane.prototype.update_bullets_position = function() {
//   for (var i = 0; i < this.bullets.length; i++) {
//     if (this.bullets[i].move() == false) {
//       this.bullets.splice(i,1);
//       i--;
//     }
//   }
// }

function sign(number) {
  return number ? number < 0 ? -1 : 1 : 0;
}