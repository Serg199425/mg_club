$(document).on('ready', function() {
  loaded_models = 0;
  initialize_renderer();
  initialize_objects();
});


var WIDTH = window.innerWidth - 20;
var HEIGHT = window.innerHeight - 20;
var LEFT_BORDER = -40;
var RIGHT_BORDER = 40;
var FRONT_BORDER_Z = -170;
var DOWN_BORDER = window.innerHeight;
var PLANE_MAX_ANGLE = 0.5;
var PLANE_ANGLE_STEP = 0.05;
var IRON_MAN_MAX_ANGLE = 1.0;
var IRON_MAN_ANGLE_STEP = 0.2;
var MAX_SPEED_X = 1;
var SPEED_UP_STEP = 5;
var SPEED_DOWN_STEP = 1;
var BULLET_SPEED_Y = 10;
var BOOM_SPEED = 20;
var BOOM_DURATION_CIRCLES = 100;
var CLOUD_SPEED_X = 1;
var CLOUD_SPEED_Y = 20;
var CLOUD_BOOM_SPEED = 40;
var IRON_MAN_SPEED_X = 1;
var IRON_MAN_RADAR_RADIUS = 20;
var RELOAD_TIME = 10;
var game_is_started = false;
var MODELS_COUNT = 2;
var WATER_SPEED = 5;
var BULLET_SPEED_Z = 8;
var BULLET_OFFSET = 2;

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
  iron_man.check_collision(plane.bullets);
  iron_man.move(plane.bullets);
  enviroment.move();
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

  camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 100, 1000000 );
  camera.position.set( 0, 45, 155 );
  camera.rotateX(-Math.PI / 14);


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

  var directional_light = new THREE.DirectionalLight(0xffff55, 1);
  directional_light.position.set(-600, 300, 600);
  scene.add(directional_light);

  plane = new Plane(scene, camera);
  iron_man = new IronMan(scene);
  enviroment = new Enviroment(scene, directional_light);
}

function start() {
  if (game_is_started || !plane.ready) return;
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
    if (keys[32])
      plane.is_shooting = true;
    previous_keys = keys;
});

$(document).keyup(function (e) {
    delete keys[e.which];
    if (!keys[37] && !keys[39])
      plane.stop_move();
    if (!keys[32])
      plane.is_shooting = false;
});

function Plane (scene, camera) {
  this.camera = camera;
  this.scene = scene;
  this.speed_x = 0;
  this.reload_time = 0;
  this.bullets = [];
  this.rotation = 0;
  this.exhaust = new Exhaust();
  this.initialize_mesh(scene);
  this.is_shooting = false;
}

Plane.prototype.move = function() {
  this.reload();
  this.shoot();
  this.update_position();
  this.update_bullets_position();
}

Plane.prototype.reload = function() {
  if (this.reload_time > 0) this.reload_time--;
}

Plane.prototype.start_move = function(direction) {
  this.speed_x = direction * MAX_SPEED_X;
}

Plane.prototype.stop_move = function() {
  this.speed_x = 0;
}

Plane.prototype.shoot = function() {
  if (this.reload_time > 0 || this.is_shooting == false) return;
  this.reload_time = RELOAD_TIME;
  this.bullets.push(new Bullet(this.scene, this.mesh.position, 0.5));
  this.bullets.push(new Bullet(this.scene, this.mesh.position, -0.5));
}

Plane.prototype.update_position = function() {
  var direction = sign(this.speed_x);
  sign(direction) != sign(this.rotation) ? this.mesh.position.x += this.speed_x / 5 : this.mesh.position.x += this.speed_x;
  if (this.mesh.position.x < LEFT_BORDER) {
    this.mesh.position.x = LEFT_BORDER;
    this.speed_x = 0;
  }
  if (this.mesh.position.x > RIGHT_BORDER) {
    this.mesh.position.x = RIGHT_BORDER
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

Plane.prototype.update_bullets_position = function() {
  for (var i = 0; i < this.bullets.length; i++) {
    if (this.bullets[i].move() == false) {
      this.bullets.splice(i,1);
      i--;
    }
  }
}


function Exhaust() {
  this.meshes_array = this.initialize_mesh(-0.8, -0.1, 9);
}

Exhaust.prototype.move = function(parent_position, rotation) {
  for (var i = 0; i < this.meshes_array.length; i++) {
    this.meshes_array[i].position.z = parent_position.z + 9;
    i == 0 ? this.meshes_array[i].position.x = parent_position.x - 0.8 : this.meshes_array[i].position.x = parent_position.x + 0.8;

    if (rotation != 0) {
      i == 0 ? this.meshes_array[i].position.y = parent_position.y + 0.037 * rotation : this.meshes_array[i].position.y = parent_position.y - 0.037 * rotation;
    } else {
      this.meshes_array[i].position.y = parent_position.y - 0.1;
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

        sizeStart: 10,
        sizeEnd: 10,

        particleCount: 1000,
        alive: 0.5,
        radius: 0.2,
    });

    this.particleGroup.mesh.rotateX(-Math.PI / 2);
    this.particleGroup.mesh.position.set(pos_x, pos_y, pos_z);
    this.particleGroup.addEmitter( emitter );

    scene.add( this.particleGroup.mesh );

    var particleGroup1 = this.particleGroup.mesh.clone();
    particleGroup1.position.x = -pos_x;
    scene.add( particleGroup1 );
    return [this.particleGroup.mesh, particleGroup1];
}


function IronMan (scene) {
  this.speed_x = IRON_MAN_SPEED_X;
  this.scene = scene;
  this.initialize_mesh();
  this.initialize_explosion_mesh();
  this.boom_duration = 0;
  this.rotation = 0;
}

IronMan.prototype.initialize_mesh = function() {
  var loader = new THREE.OBJMTLLoader();
  var iron_man = this;

  loader.load('models/Mark_42.obj', 'models/Mark_42.mtl',
    function ( object ) {
      iron_man.mesh = object;
      iron_man.mesh.rotateX(-Math.PI / 2);
      iron_man.mesh.rotateY(Math.PI);
      iron_man.mesh.position.z = -130;
      iron_man.mesh.scale.set(5.5,5.5,5.5);
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

IronMan.prototype.check_collision = function(bullets) {
  if (this.boom_duration != 0) {
    this.explosion();
    return;
  }
  for (var i = 0; i < bullets.length; i++) {
    if (bullets[i].mesh.position.x <= this.mesh.position.x + 3 &&
        bullets[i].mesh.position.x >= this.mesh.position.x - 3 &&
        bullets[i].mesh.position.z > FRONT_BORDER_Z &&
        bullets[i].mesh.position.z < FRONT_BORDER_Z + 6) 
      this.boom_duration = 1;
  }
}

IronMan.prototype.explosion = function() {
  if (this.boom_duration == 0) return;
  this.explosion_mesh.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
  this.explosion_mesh.scale.set(this.boom_duration, this.boom_duration, this.boom_duration);

  if (this.boom_duration == 1) {
    this.scene.add(this.explosion_mesh);
  }

  if (this.boom_duration > BOOM_DURATION_CIRCLES) {
    this.boom_duration = 0;
    this.scene.remove(this.explosion_mesh);
    return;
  }

  this.boom_duration += 1;
}

IronMan.prototype.move = function(bullets) {
  if (this.boom_duration > 0) return;
  var collision_is_near = false;
  var clothest_bullets = [];
  var direction = 0;

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

    direction > 0 ? this.speed_x = IRON_MAN_SPEED_X : this.speed_x = -IRON_MAN_SPEED_X;
  } else {
    if (this.mesh.position.x != 0)
      (this.mesh.position.x < 0) ? this.speed_x = IRON_MAN_SPEED_X : this.speed_x = -IRON_MAN_SPEED_X;
    else
      this.speed_x = 0;
  }

  this.mesh.position.x += this.speed_x;
  if (this.mesh.position.x < LEFT_BORDER) {
    this.mesh.position.x = LEFT_BORDER;
    this.speed_x = 0;
  }
  if (this.mesh.position.x > RIGHT_BORDER) {
    this.mesh.position.x = RIGHT_BORDER
    this.speed_x = 0;
  }

  if (direction != 0)
    direction < 0 ? direction = -1 : direction = 1;
  if (sign(direction) != sign(this.rotation)) this.speed_x /= 2;

  if (this.speed_x != 0) {
    if (Math.abs(this.rotation * IRON_MAN_ANGLE_STEP) <= IRON_MAN_MAX_ANGLE || sign(direction) != sign(this.rotation)) {
      this.rotation += sign(this.speed_x);
      this.mesh.rotateY(IRON_MAN_ANGLE_STEP * sign(this.speed_x));
    }
  } else {
    if (this.rotation != 0) {
      this.mesh.rotateY(-sign(this.rotation) * IRON_MAN_ANGLE_STEP);
      this.rotation += -sign(this.rotation);
    }
  }
}


function Enviroment(scene, directional_light) {
  this.water_array = [new Water(-500, scene, directional_light), new Water(-1500, scene, directional_light)];
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
  if (this.mesh.position.z == 500) this.mesh.position.z = -1500;
  this.mesh.position.z += WATER_SPEED;
}
Water.prototype.initialize_mesh = function(pos_z, scene, directional_light) {
  var plane = new THREE.BufferGeometry().fromGeometry(new THREE.PlaneGeometry( 1000, 1200));


  var water_normals = THREE.ImageUtils.loadTexture( 'models/ocean.jpg' );
  water_normals.wrapS = water_normals.wrapT = THREE.RepeatWrapping;

  this.water_controller = new THREE.Water(renderer, camera, scene, {
      textureWidth: 512, 
      textureHeight: 512,
      waterNormals: water_normals,
      alpha:  0.2,
      sunDirection: directional_light.position.normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001FFf,
      distortionScale: 80.0,
      side: THREE.DoubleSide
  });

  var water_mesh = new THREE.Mesh(plane, this.water_controller.material);

  water_mesh.rotateZ(Math.PI / 2);
  water_mesh.position.y = -15;
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

function Bullet(scene, pos_vector, side) {
  this.initialize_mesh(scene, pos_vector, side);
  this.exhaust = new Exhaust();
  this.scene = scene;
}

Bullet.prototype.initialize_mesh = function(scene, pos_vector, side) {
  this.mesh = new THREE.Mesh(new THREE.BoxGeometry( 0.1, 0.1, 5 ),
    new THREE.MeshBasicMaterial( { color: 0xFFFF00 })
  );

  this.mesh.position.set(pos_vector.x + side * BULLET_OFFSET, 0, 0);
  scene.add( this.mesh );
}

Bullet.prototype.move = function() {
  this.mesh.position.z -= BULLET_SPEED_Z;
  if (this.mesh.position.z < FRONT_BORDER_Z) {
    this.scene.remove(this.mesh)
    return false;
  }
  return true;
}

function sign(number) {
  return number ? number < 0 ? -1 : 1 : 0;
}