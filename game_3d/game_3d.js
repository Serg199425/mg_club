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
  particleGroup.tick( 0.026 );
  renderer.render( scene, camera );
  stats.update();
}

function render_with_text() {
  renderer.render(create_scene_with_text());
}

function onWindowResize() {
    WIDTH = window.innerWidth - 20;
    HEIGHT = window.innerHeight - 20;
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize( WIDTH, HEIGHT );

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
  stats.setMode( 0 );
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
}

function initialize_objects() {

  camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 20000 );
  camera.position.z = 75;
  camera.position.y = 10;

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

  clock = new THREE.Clock();
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
  this.exhaust = new Exhaust();
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

  sign(direction) != sign(this.rotation) ? this.camera.position.x += this.speed_x / 10 : this.camera.position.x += this.speed_x / 2;
  this.exhaust.move(this.mesh.position, this.rotation);

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


function Exhaust() {
  this.meshes_array = this.generate_model(-0.8, -0.1, 9);
}

Exhaust.prototype.move = function(plane_pos, rotation) {
  for (var i = 0; i < this.meshes_array.length; i++) {
    this.meshes_array[i].position.z = plane_pos.z + 9;
    i == 0 ? this.meshes_array[i].position.x = plane_pos.x - 0.8 : this.meshes_array[i].position.x = plane_pos.x + 0.8;

    if (rotation != 0) {
      i == 0 ? this.meshes_array[i].position.y = plane_pos.y + 0.05 * rotation : this.meshes_array[i].position.y = plane_pos.y - 0.05 * rotation;
    } else {
      this.meshes_array[i].position.y = plane_pos.y - 0.1;
    }
  }
}

Exhaust.prototype.generate_model = function (pos_x, pos_y, pos_z) {
    particleGroup = new SPE.Group({
        texture: THREE.ImageUtils.loadTexture('models/smokeparticle.png'),
        maxAge: 2
    });

    emitter = new SPE.Emitter({
        type : 'sphere',
        position: new THREE.Vector3(0, 0, 0),
        positionSpread: new THREE.Vector3( 0, 0, 0 ),

        acceleration: new THREE.Vector3(0, -170, 0),
        accelerationSpread: new THREE.Vector3( 5, 0, 5 ),

        velocity: new THREE.Vector3(0, 5, 0),
        velocitySpread: new THREE.Vector3(10, 7.5, 10),

        colorStart: new THREE.Color(0xff5a00),
        colorEnd: new THREE.Color('gray'),

        sizeStart: 1,
        sizeEnd: 8,

        particleCount: 5000,
        alive: 1,
        radius: 0.3
    });

    particleGroup.mesh.rotateX(-Math.PI / 2);
    particleGroup.mesh.position.x = pos_x;
    particleGroup.mesh.position.y = pos_y;
    particleGroup.mesh.position.z = pos_z;
    particleGroup.addEmitter( emitter );

    scene.add( particleGroup.mesh );

    particleGroup1 = particleGroup.mesh.clone();
    particleGroup1.position.x = -pos_x;
    scene.add( particleGroup1 );
    return [particleGroup.mesh, particleGroup1];
}

function sign(number) {
  return number ? number < 0 ? -1 : 1 : 0;
}