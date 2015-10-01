$(document).on('ready', function() {
  loaded_models = 0;
  initialize_renderer();
  initialize_objects();
});


var WIDTH = window.innerWidth - 20;
var HEIGHT = window.innerHeight - 20;
var BORDER_X = 60;
var BORDER_Y = 30;
var FRONT_BORDER_Z = -170;
var PLANE_MAX_ROTATIONS = 20;
var PLANE_ANGLE_STEP_X = 0.02;
var PLANE_ANGLE_STEP_Y = 0.005;
var MAX_SPEED_X = 0.5;
var MAX_SPEED_Y = 0.5;
var SPEED_UP_STEP = 5;
var SPEED_DOWN_STEP = 1;
var BULLET_BORDER_Z = -250;
var BULLET_SPEED_Y = 10;
var BULLET_SPEED_Z = 8;
var BULLET_OFFSET = 2;
var BULLETS_MAX_COUNT = 10;
var RELOAD_TIME = 10;
var PLANE_EXPLOISON_CIRCLES = 100;

var IRON_MAN_MAX_ROTATIONS = 8;
var IRON_MAN_ANGLE_STEP = 0.05;
var BOOM_SPEED = 20;
var IRON_MAN_EXPLOISON_CIRCLES = 100;
var IRON_MAN_SPEED_X = 0.5;
var IRON_MAN_RADAR_RADIUS = 10;

var CLOUD_SPEED_X = 1;
var CLOUD_SPEED_Y = 20;
var CLOUD_BOOM_SPEED = 40;

var game_is_started = false;
var MODELS_COUNT = 2;
var WATER_SPEED = 10;
var WATER_PLANE_LENGTH = 10000;
var WATER_PLANE_WIDTH = 10000;

var camera_vibration_direction = 1;
var CAMERA_VIBRATION_VALUE = 0.15;
var CAMERA_POSITION_Y = 10;

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
  stats.update();
}

function onWindowResize() {
    WIDTH = window.innerWidth - 25;
    HEIGHT = window.innerHeight - 25;
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize( WIDTH, HEIGHT );
}

function initialize_renderer() {
  camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 100, 1000000 );
  camera.position.set( 0, 45, 155 );
  camera.rotateX(-Math.PI / 100);

  // camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 100, 1000000 );
  // camera.position.set( 0, 45, 155 );
  // camera.rotateX(-Math.PI / 14);


  // camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 100, 1000000 );
  // camera.position.set( 0, 525, -30 );
  // camera.rotateX(-Math.PI / 2);

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth - 25, window.innerHeight - 25 );
  document.body.appendChild( renderer.domElement );
  window.addEventListener( 'resize', onWindowResize, false );

  stats = new Stats();
  stats.setMode( 0 );
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );
}

function initialize_objects() {
  var light = new THREE.AmbientLight( 0xffffff ); // soft white light
  scene.add( light );

  var directional_light = new THREE.DirectionalLight(0xffffFF, 1);
  directional_light.position.set(-600, 300, 600).normalize();
  scene.add(directional_light);

  plane = new Plane(scene, camera);
  iron_man = new IronMan(scene);
  enviroment = new Enviroment(scene, directional_light);
  terrain = new Terrain();
}

function start() {
  if (game_is_started || !plane.ready) return;
  game_is_started = true;
  move_interval = setInterval(move_objects, 10);
  render();
}

function move_objects() {
  plane.move();
  plane.bullets_container.check_collision(iron_man) ? iron_man.explosion() : iron_man.move(plane.bullets_container);
  enviroment.move();
  camera_vibration();
}

function camera_vibration() {
  camera.position.x += - CAMERA_VIBRATION_VALUE * sign(camera_vibration_direction);
  camera_vibration_direction = -sign(camera_vibration_direction);
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

    var direction_x = 0;
    var direction_y = 0; 

    if (keys[37] && !keys[39] || keys[37] && keys[39] && plane.speed_x > 0) {
      direction_x = -1;
    } else {
      if (keys[39] && !keys[37] || keys[37] && keys[39] && plane.speed_x < 0)
        direction_x = 1;
      else
        direction_x = 0;
    }

    if (keys[38] && !keys[40] || keys[38] && keys[40] && plane.speed_y > 0) {
      direction_y = 1;
    } else {
      if (keys[40] && !keys[38] || keys[38] && keys[40] && plane.speed_y < 0)
        direction_y = -1;
      else
        direction_y = 0; 
    }

    plane.start_move(direction_x, direction_y);
    if (keys[32])
      plane.is_shooting = true;
});

$(document).keyup(function (e) {
    delete keys[e.which];
    if (!keys[37] && !keys[38] && !keys[39] && !keys[40])
      plane.stop_move();
    if (!keys[32]) {
      plane.is_shooting = false;
    }
});

function Terrain() {
  this.initialize_mesh();
}

Terrain.prototype.initialize_mesh = function() {
  var parameters = {
    alea: RAND_MT,
    generator: PN_GENERATOR,
    width: 200,
    height: 200,
    widthSegments: 450,
    heightSegments: 450,
    depth: 50,
    param: 4,
    filterparam: 1,
    filter: [ CIRCLE_FILTER ],
    postgen: [ MOUNTAINS_COLORS ],
    effect: [ DESTRUCTURE_EFFECT ]
  };

  var terrainGeo = TERRAINGEN.Get(parameters);
  var terrainMaterial = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, shading: THREE.SmoothShading, side: THREE.DoubleSide });
  
  var terrain = new THREE.Mesh(terrainGeo, terrainMaterial);
  terrain.position.y = - BORDER_Y - 30;
  terrain.position.z = - 200;
  this.mesh = terrain;
  scene.add(terrain);
}

function Plane (scene, camera) {
  this.camera = camera;
  this.scene = scene;
  this.speed_x = 0;
  this.speed_y = 0;
  this.reload_time = 0;
  this.bullets_container = new BulletsContainer();
  this.rotations_x = 0;
  this.rotations_y = 0;
  this.exhaust = new Exhaust();
  this.initialize_mesh(scene);
  this.is_shooting = false;
  this.direction_x = 0;
  this.direction_y = 0;
  this.exploison_circles = 0;
  this.explosion_vertices = [];
  this.explosion_rotations = [];
}

Plane.prototype.move = function() {
  if (this.exploison_circles != 0) {
    this.explosion();
    return;
  }
  this.reload();
  this.shoot();
  this.update_position();
  this.bullets_container.move(this.mesh.position, this.is_shooting);
}

Plane.prototype.reload = function() {
  if (this.reload_time > 0) this.reload_time--;
}

Plane.prototype.start_move = function(direction_x, direction_y) {
  this.direction_x = direction_x; 
  this.direction_y = direction_y;
}

Plane.prototype.stop_move = function() {
  this.direction_x = 0;
  this.direction_y = 0;
}

Plane.prototype.shoot = function() {
  if (this.reload_time > 0 || this.is_shooting == false) return;
  this.reload_time = RELOAD_TIME;
  this.bullets_container.add(this.mesh.position);
}

Plane.prototype.update_position = function() {
  this.speed_x = this.rotations_x * MAX_SPEED_X / PLANE_MAX_ROTATIONS;
  this.speed_y = this.rotations_y * MAX_SPEED_Y / PLANE_MAX_ROTATIONS;

  if (Math.abs(this.mesh.position.x) < BORDER_X || this.direction_x != sign(this.mesh.position.x)) {
    this.mesh.position.x += this.speed_x;
    this.camera.position.x += this.speed_x / 2;
  } else {
    this.mesh.position.x = sign(this.mesh.position.x) * BORDER_X;
    this.camera.position.x = sign(this.mesh.position.x) * BORDER_X / 2;
    this.direction_x = 0;
  }

  if (Math.abs(this.mesh.position.y) < BORDER_Y || this.direction_y != sign(this.mesh.position.y)) {
    this.mesh.position.y += this.speed_y;
    this.camera.position.y += this.speed_y;
  } else {
    this.mesh.position.y = sign(this.mesh.position.y) * BORDER_Y;
    this.camera.position.y = this.mesh.position.y;
    this.direction_y = 0;
  }

  this.camera.position.y = this.mesh.position.y + CAMERA_POSITION_Y;
  this.exhaust.plane_move(this.mesh.position, this.rotations_x, this.rotations_y);
  this.rotate();
}

Plane.prototype.rotate = function() {
  if (this.direction_x != 0) {
    if (Math.abs(this.rotations_x) < PLANE_MAX_ROTATIONS || this.direction_x != sign(this.rotations_x)) {
      this.rotations_x += this.direction_x;
      this.mesh.rotation.y += PLANE_ANGLE_STEP_X * this.direction_x;
    }
  } else {
    if (this.rotations_x != 0) {
      this.mesh.rotation.y -= sign(this.rotations_x) * PLANE_ANGLE_STEP_X;
      this.rotations_x += -sign(this.rotations_x);
    }
  }

  if (this.direction_y != 0) {
    if (Math.abs(this.rotations_y) < PLANE_MAX_ROTATIONS || this.direction_y != sign(this.rotations_y)) {
      this.rotations_y += this.direction_y;
      this.mesh.rotation.x += PLANE_ANGLE_STEP_Y * this.direction_y;
    }
  } else {
    if (this.rotations_y != 0) {
      this.mesh.rotation.x -= sign(this.rotations_y) * PLANE_ANGLE_STEP_Y;
      this.rotations_y += -sign(this.rotations_y);
    }
  }
}

Plane.prototype.initialize_mesh = function(scene) {
    var loader = new THREE.OBJMTLLoader();
    var plane = this;
    loader.load('models/Su-47_Berkut.obj', 'models/Su-47_Berkut.mtl',
    function ( object ) {
      object.rotateX(-Math.PI / 2);
      plane.mesh = object;
      scene.add( object );
      plane.ready = true;
    },
    function ( xhr ) {
      console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    },
    function ( xhr ) {
      console.log( 'An error happened' );
    }
  );
}

Plane.prototype.explosion = function() {
  this.exploison_circles += 1;
  if (this.exploison_circles == 1) {
    this.exhaust_visible_change(false);
    for (var  i = 0; i < this.mesh.children.length; i++)
      this.explosion_vertices[i] = new THREE.Vector3(1 - 2 * Math.random(), 1 - 2 * Math.random(), 1 - 2 * Math.random());

    for (var  i = 0; i < this.mesh.children.length; i++)
      this.explosion_rotations[i] = new THREE.Euler(1 - 2 * Math.random(), 1 - 2 * Math.random(), 1 - 2 * Math.random());

    this.explosion_mesh = new Exploison(this.mesh.position.clone(), PLANE_EXPLOISON_CIRCLES, 'red');
  }

  for (var i = 0; i < this.mesh.children.length; i++) {
    this.mesh.children[i].position.x += this.explosion_vertices[i].x;
    this.mesh.children[i].position.y += this.explosion_vertices[i].y;
    this.mesh.children[i].position.z += this.explosion_vertices[i].z;
    this.mesh.children[i].rotation.x += this.explosion_rotations[i].x;
    this.mesh.children[i].rotation.y += this.explosion_rotations[i].y;
    this.mesh.children[i].rotation.z += this.explosion_rotations[i].z;
  }

  this.explosion_mesh.update();

  if (this.exploison_circles > PLANE_EXPLOISON_CIRCLES) {
    this.exploison_circles = 0;
    this.cancel_exploison();
    this.explosion_vertices = [];
    this,explosion_rotations = [];
    this.exhaust_visible_change(true);
    this.explosion_mesh.remove();
    delete this.explosion_mesh;
  }
}

Plane.prototype.cancel_exploison = function() {
  for (var i = 0; i < this.mesh.children.length; i++) {
    this.mesh.children[i].position.x -= this.explosion_vertices[i].x * (PLANE_EXPLOISON_CIRCLES + 1);
    this.mesh.children[i].position.y -= this.explosion_vertices[i].y * (PLANE_EXPLOISON_CIRCLES + 1);
    this.mesh.children[i].position.z -= this.explosion_vertices[i].z * (PLANE_EXPLOISON_CIRCLES + 1);
    this.mesh.children[i].rotation.set(0,0,0);
  }
}

Plane.prototype.exhaust_visible_change = function(visible) {
  for (var  i = 0; i < this.exhaust.meshes_array.length; i++)
    this.exhaust.meshes_array[i].visible = visible;
}


function Exhaust() {
  this.meshes_array = this.initialize_mesh(-0.8, -0.1, 9);
}

Exhaust.prototype.plane_move = function(parent_position, rotation_x, rotation_y) {
  for (var i = 0; i < this.meshes_array.length; i++) {
    this.meshes_array[i].position.z = parent_position.z + 9;
    i == 0 ? this.meshes_array[i].position.x = parent_position.x - 0.8 : this.meshes_array[i].position.x = parent_position.x + 0.8;
    if (rotation_x != 0) {
      i == 0 ? this.meshes_array[i].position.y = parent_position.y + 0.02 * rotation_x : this.meshes_array[i].position.y = parent_position.y - 0.02 * rotation_x;
    } else {
      this.meshes_array[i].position.y = parent_position.y - 0.1;
    }

    if (rotation_y != 0) {
      this.meshes_array[i].position.y = this.meshes_array[i].position.y - rotation_y / PLANE_MAX_ROTATIONS;
      this.emitter.acceleration.set(0, -170, -rotation_y);
    }
  }

  this.particleGroup.tick();
}

Exhaust.prototype.initialize_mesh = function (pos_x, pos_y, pos_z) {
    this.particleGroup = new SPE.Group({
        texture: THREE.ImageUtils.loadTexture('models/smokeparticle.png'),
        maxAge: 2,
        depthTest: true,
        fixedTimeStep: 0.016, 
        blending: THREE.AdditiveBlending,
    });

    this.emitter = new SPE.Emitter({
        type : 'sphere',
        position: new THREE.Vector3(0, 0, 0),
        positionSpread: new THREE.Vector3( 0, 0, 0 ),

        acceleration: new THREE.Vector3(0, -170, 0),
        accelerationSpread: new THREE.Vector3( 5, 0, 5 ),

        velocity: new THREE.Vector3(0, 5, 0),
        velocitySpread: new THREE.Vector3(10, 7.5, 10),

        colorStart: new THREE.Color(0xff5a00),
        colorMiddle: new THREE.Color( 'gray' ),
        colorEnd: new THREE.Color('white'),

        sizeStart: 10,
        sizeEnd: 10,

        particleCount: 1000,
        alive: 0.5,
        radius: 0.2,
    });

    this.particleGroup.mesh.rotateX(-Math.PI / 2);
    this.particleGroup.mesh.position.set(pos_x, pos_y, pos_z);
    this.particleGroup.addEmitter( this.emitter );

    scene.add( this.particleGroup.mesh );

    var particleGroup1 = this.particleGroup.mesh.clone();
    particleGroup1.position.x = -pos_x;
    scene.add( particleGroup1 );
    return [this.particleGroup.mesh, particleGroup1];
}

function Exploison(position, explosion_circles, color) {
  this.scaler = 1;
  this.initialize_mesh(position, color);
}


Exploison.prototype.update = function() {
  this.particleGroup.mesh.scale.set(this.scaler, this.scaler, this.scaler);
  this.particleGroup.tick();
  this.scaler += 0.2;
}

Exploison.prototype.initialize_mesh = function (position, color) {
    this.particleGroup = new SPE.Group({
        texture: THREE.ImageUtils.loadTexture('models/smokeparticle.png'),
        maxAge: 2,
        depthTest: true,
        fixedTimeStep: 0.016, 
        blending: THREE.AdditiveBlending,
    });

    this.emitter = new SPE.Emitter({
        type : 'sphere',
        position: new THREE.Vector3(0, 0, 0),
        positionSpread: new THREE.Vector3( 0, 0, 0 ),

        acceleration: new THREE.Vector3(0, 0, 0),
        accelerationSpread: new THREE.Vector3( 11, 1, 11 ),

        velocity: new THREE.Vector3(5, 5, 5),
        velocitySpread: new THREE.Vector3(10, 7.5, 10),

        colorStart: new THREE.Color(color),
        colorMiddle: new THREE.Color( 0xff5a00 ),
        colorEnd: new THREE.Color('white'),

        sizeStart: 100,
        sizeEnd: 1000,

        particleCount: 1000,
        alive: 0.5,
        radius: 1,
    });

    this.particleGroup.mesh.position.set(position.x, position.y, position.z);
    this.particleGroup.addEmitter( this.emitter );

    scene.add( this.particleGroup.mesh );
}

Exploison.prototype.remove = function(scaler) {
  scene.remove( this.particleGroup.mesh);
}


function IronMan (scene) {
  this.direction_x = 0;
  this.scene = scene;
  this.initialize_mesh();
  this.initialize_explosion_mesh();
  this.exploison_circles = 0;
  this.rotations_x = 0;
  this.explosion_vertices = [];
  this.explosion_rotations = [];
}

IronMan.prototype.initialize_mesh = function() {
  var loader = new THREE.OBJMTLLoader();
  var iron_man = this;

  loader.load('models/Mark_42.obj', 'models/Mark_42.mtl',
    function ( object ) {
      iron_man.mesh = object;
      iron_man.mesh.rotateX(-Math.PI /2 + 0.1);
      iron_man.mesh.rotateY(Math.PI);
      iron_man.mesh.position.z = -130;
      iron_man.mesh.scale.set(3, 3, 3);
      iron_man.scene.add( iron_man.mesh );
      iron_man.ready = true;
    }
  );
}

IronMan.prototype.initialize_explosion_mesh = function() {
  this.explosion_mesh = new THREE.Mesh( new THREE.SphereGeometry( 1, 16, 8 ) ,
    new THREE.MeshBasicMaterial( { color: 0x00aaff } )
  );
}

IronMan.prototype.explosion = function() {
  if (this.exploison_circles == 0) {
    this.exploison_circles = 1;
    for (var  i = 0; i < this.mesh.children.length; i++)
      this.explosion_vertices[i] = new THREE.Vector3(1 - 2 * Math.random(), 1 - 2 * Math.random(), 1 - 2 * Math.random());

    for (var  i = 0; i < this.mesh.children.length; i++)
      this.explosion_rotations[i] = new THREE.Euler(1 - 2 * Math.random(), 1 - 2 * Math.random(), 3 - 2 * Math.random());
    this.explosion_mesh = new Exploison(this.mesh.position.clone(), IRON_MAN_EXPLOISON_CIRCLES, 'blue');
  }

  for (var i = 0; i < this.mesh.children.length; i++) {
    this.mesh.children[i].position.x += this.explosion_vertices[i].x;
    this.mesh.children[i].position.y += this.explosion_vertices[i].y;
    this.mesh.children[i].position.z += this.explosion_vertices[i].z;
    this.mesh.children[i].rotation.x += this.explosion_rotations[i].x;
    this.mesh.children[i].rotation.y += this.explosion_rotations[i].y;
    this.mesh.children[i].rotation.z += this.explosion_rotations[i].z;
  }

  if (this.exploison_circles > IRON_MAN_EXPLOISON_CIRCLES) {
    this.exploison_circles = 0;
    this.explosion_mesh.remove();
    this.cancel_exploison();
    this.explosion_vertices = [];
    this,explosion_rotations = [];
    delete this.explosion_mesh;
    return;
  }

  this.explosion_mesh.update();
  this.exploison_circles += 1;
}

IronMan.prototype.cancel_exploison = function() {
  for (var i = 0; i < this.mesh.children.length; i++) {
    this.mesh.children[i].position.x -= this.explosion_vertices[i].x * (IRON_MAN_EXPLOISON_CIRCLES + 1);
    this.mesh.children[i].position.y -= this.explosion_vertices[i].y * (IRON_MAN_EXPLOISON_CIRCLES + 1);
    this.mesh.children[i].position.z -= this.explosion_vertices[i].z * (IRON_MAN_EXPLOISON_CIRCLES + 1);
    this.mesh.children[i].rotation.set(0,0,0);
  }
}


IronMan.prototype.choose_direction = function(bullets_container) {
  var bullets = bullets_container.bullets;
  var collision_is_near = false, clothest_bullets = [], direction = 0;

  for (var i = 0; i < bullets.length; i++) {
    if (bullets[i].mesh.position.x <= this.mesh.position.x + IRON_MAN_RADAR_RADIUS &&
        bullets[i].mesh.position.x >= this.mesh.position.x - IRON_MAN_RADAR_RADIUS && 
        bullets[i].mesh.position.z > FRONT_BORDER_Z) {
      clothest_bullets.push(bullets[i])
      collision_is_near = true;
    }
  }

  if (collision_is_near == true) {
    clothest_bullets.sort(function(a, b) {
      if (a.mesh.position.z < b.mesh.position.z)
        return -1;
      if (a.mesh.position.z > b.mesh.position.z)
        return 1;
      if (a.mesh.position.z == b.mesh.position.z)
        return 0;
    });

    for (var i = 0; i < clothest_bullets.length; i++)
      clothest_bullets[i].mesh.position.x <= this.mesh.position.x ? direction += 1 / (i + 1) : direction -= 1 / (i + 1);

    this.direction_x = sign(direction);
  } else {
    Math.abs(this.mesh.position.x) > IRON_MAN_SPEED_X + 1 ? this.direction_x = -sign(this.mesh.position.x) : this.direction_x = 0;
  }
}

IronMan.prototype.move = function(bullets) {
  if (this.exploison_circles > 0) return;
  this.choose_direction(bullets);
  this.speed_x = this.rotations_x * IRON_MAN_SPEED_X / IRON_MAN_MAX_ROTATIONS;


  if (Math.abs(this.mesh.position.x) < BORDER_X || this.direction_x != sign(this.mesh.position.x)) {
    this.mesh.position.x += this.speed_x;
  } else {
    this.mesh.position.x = sign(this.mesh.position.x) * BORDER_X;
    this.direction_x = 0;
  }

  this.rotate();
}

IronMan.prototype.rotate = function() {
  if (this.direction_x != 0) {
    if (Math.abs(this.rotations_x) < IRON_MAN_MAX_ROTATIONS || sign(this.rotations_x) != this.direction_x) {
      this.rotations_x += this.direction_x;
      this.mesh.rotateY(IRON_MAN_ANGLE_STEP * this.direction_x);
    }
  } else {
    if (this.rotations_x != 0) {
      this.mesh.rotateY(-sign(this.rotations_x) * IRON_MAN_ANGLE_STEP);
      this.rotations_x += -sign(this.rotations_x);
    }
  }
}


function Enviroment(scene, directional_light) {
  this.water_array = [new Water(-WATER_PLANE_LENGTH / 2, scene, directional_light), new Water(-WATER_PLANE_LENGTH * 1.5, scene, directional_light)];
  this.skybox = new SkyBox(scene);
}

Enviroment.prototype.move = function() {
  for (var index in this.water_array)
    this.water_array[index].move();
}

function Water(pos_z, scene, directional_light) {
  this.mesh = this.initialize_mesh(pos_z, scene, directional_light);
}

Water.prototype.move = function() {
  this.water_controller.material.uniforms.time.value += 1.0 / 60.0;
  this.water_controller.render();
  if (this.mesh.position.z == WATER_PLANE_LENGTH / 2) this.mesh.position.z = -WATER_PLANE_LENGTH * 1.5;
  this.mesh.position.z += WATER_SPEED;
}

Water.prototype.initialize_mesh = function(pos_z, scene, directional_light) {
  var plane = new THREE.PlaneBufferGeometry( WATER_PLANE_LENGTH, WATER_PLANE_WIDTH);


  var water_normals = THREE.ImageUtils.loadTexture( 'models/ocean.jpg' );
  water_normals.wrapS = water_normals.wrapT = THREE.RepeatWrapping;

  this.water_controller = new THREE.Water(renderer, camera, scene, {
      textureWidth: 512, 
      textureHeight: 512,
      waterNormals: water_normals,
      alpha:  1,
      sunDirection: directional_light.position.normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001FFf,
      distortionScale: 80.0,
  });

  var water_mesh = new THREE.Mesh(plane, this.water_controller.material);

  water_mesh.rotateZ(Math.PI / 2);
  water_mesh.position.y = - BORDER_Y - 20;
  water_mesh.position.z = pos_z;

  water_mesh.add(this.water_controller);
  water_mesh.rotation.x = - Math.PI * 0.5;
  scene.add(water_mesh);

  return water_mesh;
}

function SkyBox(scene) {
  this.initialize_mesh(scene);
}

SkyBox.prototype.initialize_mesh = function(scene) {
  var sky = new THREE.Sky();
  scene.add( sky.mesh );

  var sunSphere = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry( new THREE.SphereGeometry( 20000, 16, 8 ) ),
    new THREE.MeshBasicMaterial( { color: 0xffffff } )
  );
  sunSphere.position.y = - 700000;
  sunSphere.visible = false;
  scene.add( sunSphere );

  var distance = 400000;
  var uniforms = sky.uniforms;
  uniforms.turbidity.value = 10;
  uniforms.reileigh.value = 2;
  uniforms.luminance.value = 1;
  uniforms.mieCoefficient.value = 0.005;
  uniforms.mieDirectionalG.value = 0.8;


  var theta = Math.PI * ( 0.49 - 0.5 );
  var phi = 2 * Math.PI * ( 0.25 - 0.5 );

  sunSphere.position.x = distance * Math.cos( phi );
  sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
  sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );

  sunSphere.visible = false;

  sky.uniforms.sunPosition.value.copy( sunSphere.position );
}

function BulletsContainer() {
  this.initialize_mesh();
  this.bullets = [];
}

BulletsContainer.prototype.initialize_mesh = function(scene) {
  this.mesh = new THREE.Mesh(new THREE.BoxGeometry( 0.1, 0.1, 5 ),
    new THREE.MeshBasicMaterial( { color: 0xFFFF00 })
  );
}

BulletsContainer.prototype.add = function(parent_position) {
  if (this.bullets.length < BULLETS_MAX_COUNT) {
    this.bullets.push(new Bullet(this.mesh, parent_position, 0.5));
    this.bullets.push(new Bullet(this.mesh, parent_position, -0.5));
  } else {
    this.move(parent_position, true);
  }
}

BulletsContainer.prototype.move = function(parent_position, is_shooting) {
  for (var i = 0; i < this.bullets.length; i++) {
    if (this.bullets[i].move() == false) {
      if (is_shooting) {
        this.bullets[i].move_to(parent_position);
      } else {
        scene.remove(this.bullets[i].mesh);
        delete this.bullets[i];
        this.bullets.splice(i,1);
        i--;
      }
    }
  }
}

BulletsContainer.prototype.check_collision = function(iron_man) {
  if (iron_man.exploison_circles != 0) return true;
  for (var i = 0; i < this.bullets.length; i++) {
    if (this.bullets[i].mesh.position.x <= iron_man.mesh.position.x + 3 &&
        this.bullets[i].mesh.position.x >= iron_man.mesh.position.x - 3 &&
        this.bullets[i].mesh.position.z > FRONT_BORDER_Z &&
        this.bullets[i].mesh.position.z < FRONT_BORDER_Z + 6)
      return true;
  }
  return false;
}

function Bullet(mesh, pos_vector, side) {
  this.initialize_mesh(mesh, pos_vector, side);
  this.exhaust = new Exhaust();
}

Bullet.prototype.initialize_mesh = function(mesh, parent_position, side) {
  this.side = side;
  this.mesh = mesh.clone();
  this.mesh.position.set(parent_position.x + side * BULLET_OFFSET, parent_position.y, 0);
  scene.add( this.mesh );
}

Bullet.prototype.move = function() {
  this.mesh.position.z -= BULLET_SPEED_Z;
  if (this.mesh.position.z < BULLET_BORDER_Z) {
    return false;
  }
  return true;
}

Bullet.prototype.move_to = function(position) {
  this.mesh.position.set(position.x + this.side * BULLET_OFFSET, position.y, position.z);
}

function sign(number) {
  return number ? number < 0 ? -1 : 1 : 0;
}