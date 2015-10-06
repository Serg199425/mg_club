$(document).on('ready', function() {
  game = new Game();
  game.initialize();
});

function Game() {
  var move_interval;
  var scene, renderer, camera;
  var width = window.innerWidth - 20, height = window.innerHeight - 20;
  var game_is_started = false;
  var camera_vibration_direction = 1;
  var BORDER_X = 60, BORDER_Y = 40;
  var FRONT_BORDER_Z = -170;
  var PLANE_MAX_ROTATIONS = 20;
  var PLANE_ANGLE_STEP_X = 0.02, PLANE_ANGLE_STEP_Y = 0.005;
  var MAX_SPEED_X = 0.5, MAX_SPEED_Y = 0.5;
  var SPEED_UP_STEP = 5, SPEED_DOWN_STEP = 1;
  var PLANE_EXPLOISON_CIRCLES = 100;

  var BULLET_BORDER_Z = -450;
  var BULLET_SPEED_Y = 10, BULLET_SPEED_Z = 8;
  var BULLET_OFFSET = 2;
  var BULLETS_MAX_COUNT = 26;
  var RELOAD_TIME = 5;

  var IRON_MAN_MAX_ROTATIONS = 8;
  var IRON_MAN_ANGLE_STEP_X = 0.05, IRON_MAN_ANGLE_STEP_Y = 0.005;
  var BOOM_SPEED = 20;
  var IRON_MAN_EXPLOISON_CIRCLES = 100;
  var IRON_MAN_SPEED_X = 0.3, IRON_MAN_SPEED_Y = 0.2;
  var IRON_MAN_RADAR_RADIUS = 10, IRON_MAN_TERRAINS_RADIUS = 2500;

  var MODELS_COUNT = 2;
  var WATER_SPEED = 10;
  var WATER_PLANE_LENGTH = 20000, WATER_PLANE_WIDTH = 8000;

  var CAMERA_VIBRATION_VALUE = 0.15, CAMERA_POSITION_Y = 10;

  var TERRAINS_COUNT = 20, TERRAINS_INTERVAL = 4500;
  var TERRAIN_SPEED = 40;
  var TERRAIN_REAR_BORDER_Z = 500;

  var CLOUDS_COUNT = 20, CLOUDS_INTERVAL_Z = 2000, CLOUD_SPEED_Z = 20;

  this.initialize = function() {
    initialize_renderer();
    initialize_objects();
  }

  this.pause = function() {
    if (game_is_started == true) {
      clearInterval(move_interval)
      game_is_started = false
    } else { 
      move_interval = setInterval(move_objects, 10);
      game_is_started = true;
    }
  }

  function render() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
    stats.update();
  }

  function onWindowResize() {
    width = window.innerWidth - 25;
    height = window.innerHeight - 25;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
  }

  function initialize_renderer() {
    camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 100, 1000000 );
    camera.position.set( 0, 45, 155 );
    camera.rotateX(-Math.PI / 100);

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

    enviroment = new Enviroment(scene, directional_light);
    plane = new Plane(scene, camera);
    iron_man = new IronMan(scene);
    terrains_container = new TerrainsContainer();
    enviroment.add(terrains_container);
  }

  function start() {
    if (game_is_started || !plane.ready) return;
    game_is_started = true;
    move_interval = setInterval(move_objects, 10);
    render();
  }

  function move_objects() {
    plane.move(terrains_container);
    iron_man.move(plane.bullets_container, terrains_container);
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

  function TerrainsContainer() {
    this.in_enviroment = [];
    this.in_game_area = [];
    this.generate();
  }

  TerrainsContainer.prototype.generate = function() {
    var position_x, position_y;
    for (var i = 0; i < TERRAINS_COUNT / 2; i++) {
      position_x = BORDER_X * (1 - 2 * Math.random()) * 8;
      position_z = - TERRAINS_INTERVAL * (i+1) - Math.random() * TERRAINS_INTERVAL / 2;
      this.in_game_area.push(new Terrain(position_x, position_z, true));
    }

    var side = 0;
    for (var i = 0; i < TERRAINS_COUNT / 2; i++) {
      i % 2 == 0 ? side = 1 : side = -1;
      position_x = side * 30 * BORDER_X * (1 + Math.random());
      position_z = - TERRAINS_INTERVAL * (i+1) - Math.random() * TERRAINS_INTERVAL / 2;
      this.in_enviroment.push(new Terrain(position_x, position_z, false));
    }
  }

  TerrainsContainer.prototype.move = function() {
    for (var i = 0; i < this.in_enviroment.length; i++)
      this.in_enviroment[i].move();
    for (var i = 0; i < this.in_game_area.length; i++)
      this.in_game_area[i].move();
  }

  TerrainsContainer.prototype.collision_detected = function(mesh) {
    var collidable_mesh_list = [], local_vertex, global_vertex, direction_vector;
    for (var i = 0; i < this.in_game_area.length; i++) {
      if (Math.abs(this.in_game_area[i].mesh.position.length() - mesh.position.length()) < 220)
        collidable_mesh_list.push(this.in_game_area[i].mesh);
    }

    if (collidable_mesh_list.length > 0)
      for (var i = 0; i < mesh.geometry.vertices.length; i++) {       
        var local_vertex = mesh.geometry.vertices[i].clone();
        var global_vertex = local_vertex.applyMatrix4(mesh.matrix);
        var direction_vector = global_vertex.subVectors(mesh.position, global_vertex);

        var ray_caster = new THREE.Raycaster( mesh.position, direction_vector.clone().normalize() );
        var results = ray_caster.intersectObjects( collidable_mesh_list );
        if ( results.length > 0 && results[0].distance < direction_vector.length()) {
          return true;
        }
      }

    delete collidable_mesh_list;
    return false;
  }


  function Terrain(position_x, position_z, in_game_area) {
    this.in_game_area = in_game_area;
    this.initialize(position_x, position_z);
  }

  Terrain.prototype.initialize = function(position_x, position_z) {
    var side;
    var parameters = {
      alea: RAND_MT,
      generator: PN_GENERATOR,
      width: 50 + Math.random() * 50,
      height: 100 + Math.random() * 100,
      widthSegments: 20,
      heightSegments: 20,
      depth: 50 + BORDER_Y * Math.random() * 8,
      param: 4,
      filterparam: 1,
      filter: [ CIRCLE_FILTER ],
      effect: [ DESTRUCTURE_EFFECT ]
    };

    var terrainGeo = TERRAINGEN.Get(parameters);
    var terrainMaterial = new THREE.MeshPhongMaterial({ color: 0x535353, shading: THREE.SmoothShading, side: THREE.DoubleSide });
    
    var terrain = new THREE.Mesh(terrainGeo, terrainMaterial);
    terrain.position.x = position_x;
    terrain.position.y = - BORDER_Y - 140;
    terrain.position.z = position_z;
    this.mesh = terrain;
    scene.add(terrain);
  }

  Terrain.prototype.move = function() {
    if (this.mesh.position.z > TERRAIN_REAR_BORDER_Z) {
      this.mesh.position.z = - TERRAINS_COUNT * TERRAINS_INTERVAL / 2;
      if (this.in_game_area) 
        this.mesh.position.x = BORDER_X * (1 - 2 * Math.random()) * 8;
      this.mesh.position.y = - BORDER_Y - 140;
    }
    else
      this.mesh.position.z += TERRAIN_SPEED;

    if (this.mesh.position.y < -BORDER_Y - 40)
      this.mesh.position.y ++;
  }

  function Plane (scene, camera) {
    this.meshes_array;
    this.camera = camera;
    this.scene = scene;
    this.speed_x = 0;
    this.speed_y = 0;
    this.reload_time = 0;
    this.bullets_container = new BulletsContainer();
    this.rotations_x = 0;
    this.rotations_y = 0;
    this.initialize(scene);
    this.is_shooting = false;
    this.direction_x = 0;
    this.direction_y = 0;
    this.exploison_circles = 0;
    this.explosion_vertices = [];
    this.explosion_rotations = [];
  }

  Plane.prototype.move = function(terrains) {
    if (this.exploison_circles != 0 || this.collision_detected(terrains)) {
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
    this.collision.position.setVector(this.mesh.position);
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
    this.collision.rotation.z = - this.rotations_x * PLANE_ANGLE_STEP_X;
  }

  Plane.prototype.initialize = function(scene) {
    var loader = new THREE.OBJMTLLoader();
    var plane = this;
    this.collision = new THREE.Mesh( new THREE.SphereGeometry( 8, 4, 4 ) ,
      new THREE.MeshBasicMaterial( { color: 0x00aaff } )  );
    this.collision.scale.set(1,0.16,1.5);
    loader.load('models/Su-47_Berkut.obj', 'models/Su-47_Berkut.mtl',
      function ( object ) {
        object.rotateX(-Math.PI / 2);
        plane.mesh = object;
        scene.add( object );
        plane.exhaust = new Exhaust(plane);
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
      this.exhaust.toggle_visible();
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
      this.exhaust.toggle_visible();
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

  Plane.prototype.collision_detected = function(terrains) {
    if (terrains.collision_detected(this.collision))
      return true;
    else
      return false;
  }

  function Exhaust(source) {
    this.particle_systems = [];
    this.initialize(source)
  }

  Exhaust.prototype.initialize = function(source) {
    if (source instanceof Plane)
      this.initialize_for_plane(source);
    else
      this.initialize_for_iron_man(source);
  }

  Exhaust.prototype.initialize_for_plane = function (parent) {
    var parameters = {
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
    }

    var default_offset = { x: 0.8, y: 0.4, z: 3 };
    var turning_offset = { x: 0.8, y: 0.015, z: 3 };
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, 1));
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, -1));
  }

  Exhaust.prototype.plane_move = function(parent_position, rotation_x, rotation_y) {
    for (var i = 0; i < this.particle_systems.length; i++)
      this.particle_systems[i].move(parent_position, rotation_x, rotation_y / PLANE_MAX_ROTATIONS);
  }

  Exhaust.prototype.initialize_for_iron_man = function (parent) {
    var parameters = {
      type : 'sphere',
      position: new THREE.Vector3(0, 0, 0),
      positionSpread: new THREE.Vector3( 0, 10, 0 ),

      acceleration: new THREE.Vector3(0, -10, 0),
      accelerationSpread: new THREE.Vector3( 1, 10, 1 ),

      velocity: new THREE.Vector3(-10, 5, 0),
      velocitySpread: new THREE.Vector3(-10, 17.5, 10),

      colorStart: new THREE.Color(0x00AAFF),
      colorEnd: new THREE.Color('white'),

      sizeStart: 5,
      sizeEnd: 1,

      particleCount: 150,
      alive: 1,
      radius: 0.2,
    }

    var default_offset = { x: 0.5, y: -0.4, z: 3 };
    var turning_offset = { x: 0.5, y: -0.02, z: 3 };
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, 1));
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, -1));

    default_offset = { x: 0.5, y: -0.4, z: -10 };
    turning_offset = { x: 0.5, y: -0.02, z: -10 };
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, 1));
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, -1));
  }

  Exhaust.prototype.iron_man_move = function(parent_position, rotation_x, rotation_y) {
    for (var i = 0; i < this.particle_systems.length; i++)
      this.particle_systems[i].move(parent_position, rotation_x, rotation_y / PLANE_MAX_ROTATIONS);
  }

  Exhaust.prototype.toggle_visible = function() {
    for (var i = 0; i < this.particle_systems.length; i++)
      this.particle_systems[i].toggle_visible();
  }

  function ParticleSystem(emitter_params, default_offset, turning_offset, parent_position, side) {
    this.default_offset = default_offset;
    this.turning_offset = turning_offset;
    this.side = side;
    this.acceleration = emitter_params.acceleration;
    this.initialize(emitter_params, parent_position);
  }

  ParticleSystem.prototype.initialize = function(emitter_params, pos) {
    this.particle_group = new SPE.Group({
        texture: THREE.ImageUtils.loadTexture('models/smokeparticle.png'),
        maxAge: 2,
        depthTest: true,
        fixedTimeStep: 0.016, 
        blending: THREE.AdditiveBlending,
    });

    this.emitter = new SPE.Emitter(emitter_params);
    this.mesh = this.particle_group.mesh;
    this.mesh.rotateX(-Math.PI / 2);
    this.mesh.position.set(pos.x * this.side + this.default_offset.x, 
      pos.y + this.default_offset.y, pos.z + this.default_offset.z);
    this.particle_group.addEmitter(this.emitter);
    scene.add( this.mesh );
  }

  ParticleSystem.prototype.move = function(pos, rotation_x, rotation_y) {
    if (rotation_x == 0)
      this.mesh.position.set(pos.x + this.default_offset.x * this.side, pos.y + rotation_y, pos.z + this.default_offset.z);
    else
      this.mesh.position.set(pos.x + this.turning_offset.x * this.side, pos.y + rotation_y, pos.z + this.turning_offset.z);

    this.particle_group.tick();
    this.emitter.acceleration.setVector(this.acceleration);
  }

  ParticleSystem.prototype.toggle_visible = function() {
    this.mesh.visible == true ? this.mesh.visible = false : this.mesh.visible = true;
  }

  function Exploison(position, explosion_circles, color) {
    this.scaler = 1;
    this.initialize_mesh(position, color);
  }

  Exploison.prototype.update = function() {
    this.particle_group.mesh.scale.set(this.scaler, this.scaler, this.scaler);
    this.particle_group.tick();
    this.scaler += 0.2;
  }

  Exploison.prototype.initialize_mesh = function (position, color) {
      this.particle_group = new SPE.Group({
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

      this.particle_group.mesh.position.setVector(position);
      this.particle_group.addEmitter( this.emitter );

      scene.add( this.particle_group.mesh );
  }

  Exploison.prototype.remove = function(scaler) {
    scene.remove( this.particle_group.mesh);
  }


  function IronMan (scene) {
    this.direction_x = 0;
    this.direction_y = 0;
    this.scene = scene;
    this.initialize_mesh();
    this.initialize_explosion_mesh();
    this.exploison_circles = 0;
    this.rotations_x = 0;
    this.rotations_y = 0;
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
        iron_man.exhaust = new Exhaust(iron_man);
        iron_man.ready = true;
      }
    );

    this.collision = new THREE.Mesh( new THREE.SphereGeometry( 2, 4, 4 ) ,
      new THREE.MeshBasicMaterial( { color: 0x00aaff } )
    );
    this.collision.scale.set(1.1,0.6,3);
    this.collision.position.z = -134;
    // scene.add(this.collision);
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
      this.mesh.children[i].position.addSelf(this.explosion_vertices[i]);
      this.mesh.children[i].rotation.addSelf(this.explosion_rotations[i]);
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

  IronMan.prototype.choose_direction = function(bullets, terrains) {
    var bullets = bullets.bullets;
    var collision_is_near = false, clothest_bullets = [], direction_x = 0, direction_y = 0;

    for (var i = 0; i < bullets.length; i++) {
      if (bullets[i].mesh.position.x <= this.mesh.position.x + IRON_MAN_RADAR_RADIUS &&
          bullets[i].mesh.position.x >= this.mesh.position.x - IRON_MAN_RADAR_RADIUS &&
          bullets[i].mesh.position.y <= this.mesh.position.y + IRON_MAN_RADAR_RADIUS &&
          bullets[i].mesh.position.y >= this.mesh.position.y - IRON_MAN_RADAR_RADIUS &&
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

      for (var i = 0; i < clothest_bullets.length; i++) {
        clothest_bullets[i].mesh.position.x <= this.mesh.position.x ? direction_x += 1 / (i + 1) : direction_x -= 1 / (i + 1);
        clothest_bullets[i].mesh.position.y <= this.mesh.position.y ? direction_y += 1 / (i + 1) : direction_y -= 1 / (i + 1);
      }

      this.direction_x = sign(direction_x);
      this.direction_y = sign(direction_y);
    } else {
      Math.abs(this.mesh.position.x) > IRON_MAN_SPEED_X + 1 ? this.direction_x = -sign(this.mesh.position.x) : this.direction_x = 0;
      Math.abs(this.mesh.position.y) > IRON_MAN_SPEED_Y + 1 ? this.direction_y = -sign(this.mesh.position.y) : this.direction_y = 0;
    }

    for (var i = 0; i < terrains.in_game_area.length; i++) {
      if (Math.abs(Math.abs(terrains.in_game_area[i].mesh.position.x) - Math.abs(this.mesh.position.x)) < BORDER_X &&
          Math.abs(Math.abs(terrains.in_game_area[i].mesh.position.z) - Math.abs(this.mesh.position.z)) < IRON_MAN_TERRAINS_RADIUS) {
        this.direction_x = -sign(terrains.in_game_area[i].mesh.position.x);
        break;
      }
    }
  }

  IronMan.prototype.move = function(bullets, terrains) {
    if (this.exploison_circles > 0 || this.collision_detected(bullets, terrains)) {
      this.explosion();
      return;
    }
    this.choose_direction(bullets, terrains);
    this.speed_x = this.rotations_x * IRON_MAN_SPEED_X / IRON_MAN_MAX_ROTATIONS;
    this.speed_y = this.rotations_y * IRON_MAN_SPEED_Y / IRON_MAN_MAX_ROTATIONS;

    if (Math.abs(this.mesh.position.x) < BORDER_X || this.direction_x != sign(this.mesh.position.x)) {
      this.mesh.position.x += this.speed_x;
    } else {
      this.mesh.position.x = sign(this.mesh.position.x) * BORDER_X;
      this.direction_x = 0;
    }

    if (Math.abs(this.mesh.position.y) < BORDER_Y || this.direction_y != sign(this.mesh.position.y)) {
      this.mesh.position.y += this.speed_y;
    } else {
      this.mesh.position.y = sign(this.mesh.position.y) * BORDER_Y;
      this.direction_y = 0;
    }

    this.rotate();
    this.collision.position.setVector(this.mesh.position);
    this.exhaust.iron_man_move(this.mesh.position, this.rotations_x, this.rotations_y);
  }

  IronMan.prototype.collision_detected = function(bullets, terrains) {
    if (bullets.collision_detected(this) || terrains.collision_detected(this.collision))
      return true;
    return false
  }

  IronMan.prototype.rotate = function() {
    if (this.direction_x != 0) {
      if (Math.abs(this.rotations_x) < IRON_MAN_MAX_ROTATIONS || this.direction_x != sign(this.rotations_x)) {
        this.rotations_x += this.direction_x;
        this.mesh.rotation.y -= IRON_MAN_ANGLE_STEP_X * this.direction_x;
      }
    } else {
      if (this.rotations_x != 0) {
        this.mesh.rotation.y += sign(this.rotations_x) * IRON_MAN_ANGLE_STEP_X;
        this.rotations_x += -sign(this.rotations_x);
      }
    }

    if (this.direction_y != 0) {
      if (Math.abs(this.rotations_y) < IRON_MAN_MAX_ROTATIONS || this.direction_y != sign(this.rotations_y)) {
        this.rotations_y += this.direction_y;
        this.mesh.rotation.x += IRON_MAN_ANGLE_STEP_Y * this.direction_y;
      }
    } else {
      if (this.rotations_y != 0) {
        this.mesh.rotation.x -= sign(this.rotations_y) * IRON_MAN_ANGLE_STEP_Y;
        this.rotations_y += -sign(this.rotations_y);
      }
    }
  }

  function Enviroment(scene, directional_light) {
    this.objects = [];
    this.initialize(scene, directional_light);
  }

  Enviroment.prototype.initialize = function(scene, directional_light) {
    new SkyBox(scene);
    this.add(new Water(-WATER_PLANE_LENGTH / 2, scene, directional_light));
    this.add(new Water(-WATER_PLANE_LENGTH * 1.5, scene, directional_light));
  } 

  Enviroment.prototype.add = function(object) {
    this.objects.push(object);
  }

  Enviroment.prototype.move = function() {
    for (var index in this.objects)
      this.objects[index].move();
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

    var camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 100, 1000000 );
    camera.position.set( 0, 65, 555 );

    this.water_controller = new THREE.Water( renderer, camera, scene, {
      textureWidth: 128,
      textureHeight: 128,
      waterNormals: water_normals,
      alpha:  1.0,
      sunDirection: directional_light.position.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 50.0,
    } );

    var water_mesh = new THREE.Mesh(plane, this.water_controller.material);

    water_mesh.rotateZ(Math.PI / 2);
    water_mesh.position.y = - BORDER_Y - 15;
    water_mesh.position.z = pos_z;

    water_mesh.add(this.water_controller);
    water_mesh.rotation.x = - Math.PI * 0.5;
    scene.add(water_mesh);

    return water_mesh;
  }


  function SkyBox(scene) {
    this.clouds = [];
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


    //generate clouds

    // for (var i = 0; i < CLOUDS_COUNT; i++)
    //   this.clouds.push(new Cloud(i));
  }

  SkyBox.prototype.move = function() {
    for (var i = 0; i < this.clouds.length; i++)
      this.clouds[i].move();
  }

  function Cloud(index) {
    this.initialize(index);
  }

  Cloud.prototype.initialize = function(index) {
      var geometry = new THREE.Geometry();

      var texture = THREE.ImageUtils.loadTexture( 'models/cloud.png');
      // texture.magFilter = THREE.LinearMipMapLinearFilter;
      // texture.minFilter = THREE.LinearMipMapLinearFilter;

      var fog = new THREE.Fog( 0x75B4E4, - 100, 3000 );

      material = new THREE.ShaderMaterial( {

        uniforms: {

          "map": { type: "t", value: texture },
          "fogColor" : { type: "c", value: fog.color },
          "fogNear" : { type: "f", value: fog.near },
          "fogFar" : { type: "f", value: fog.far },

        },
        vertexShader: document.getElementById( 'vs' ).textContent,
        fragmentShader: document.getElementById( 'fs' ).textContent,
        depthWrite: true,
        depthTest: false,
        transparent: true

      } );

      var plane = new THREE.Mesh( new THREE.PlaneGeometry( 128, 128 ) );

      for ( var i = 0; i < 100; i++ ) {

        plane.position.x = Math.random() * 350 - 50;
        plane.position.y = i;
        plane.position.z = - Math.random() * Math.random() * 200 - 15;
        plane.rotation.z = Math.random() * Math.PI;
        plane.scale.x = plane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;

        plane.updateMatrix();
        geometry.merge( plane.geometry, plane.matrix );
      }

      this.mesh = new THREE.Mesh( geometry, material );
      this.mesh.position.set((1 - 2 * Math.random()) * 2000, 1000, - index * CLOUDS_INTERVAL_Z);
      scene.add( this.mesh );
  }

  Cloud.prototype.move = function() {
    this.mesh.position.z += CLOUD_SPEED_Z;
    if (this.mesh.position.z > 0) {
      this.mesh.position.z += - CLOUDS_INTERVAL_Z * CLOUDS_COUNT;
      this.mesh.position.x = (1 - 2 * Math.random()) * 5000;
    }
  }

  function BulletsContainer() {
    this.bullets = [];
    this.initialize();
  }

  BulletsContainer.prototype.initialize = function(scene) {
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry( 0.13, 0.13, 8 ),
      new THREE.MeshPhongMaterial( { color: 0xFF0000, specular: 0x555555, shininess: 30 })
    );

    for (var i = 0; i < BULLETS_MAX_COUNT / 2; i++) {
      this.bullets.push(new Bullet(this.mesh, 0.5));
      this.bullets.push(new Bullet(this.mesh, -0.5));
    }
  }

  BulletsContainer.prototype.add = function(parent_position) {
    for (var i = 0, bullets_added = 0; i < this.bullets.length && bullets_added < 2; i++)
      if (this.bullets[i].mesh.visible == false) {
        bullets_added++;
        this.bullets[i].move_to(parent_position);
      }
  }

  BulletsContainer.prototype.move = function(parent_position, is_shooting) {
    for (var i = 0; i < this.bullets.length; i++) {
      this.bullets[i].move();
    }
  }

  BulletsContainer.prototype.collision_detected = function(iron_man) {
    if (iron_man.exploison_circles != 0) return true;
    for (var i = 0; i < this.bullets.length; i++) {
      if (this.bullets[i].mesh.position.x <= iron_man.mesh.position.x + 3 &&
          this.bullets[i].mesh.position.x >= iron_man.mesh.position.x - 3 &&
          this.bullets[i].mesh.position.y <= iron_man.mesh.position.y + 1 &&
          this.bullets[i].mesh.position.y >= iron_man.mesh.position.y - 1 &&
          this.bullets[i].mesh.position.z > FRONT_BORDER_Z &&
          this.bullets[i].mesh.position.z < FRONT_BORDER_Z + 6)
        return true;
    }
    return false;
  }

  function Bullet(mesh, side) {
    this.initialize(mesh, side);
  }

  Bullet.prototype.initialize = function(mesh, side) {
    this.side = side;
    this.mesh = mesh.clone();
    this.mesh.position.set(side * BULLET_OFFSET, 0, 0);
    this.mesh.visible = false;
    scene.add( this.mesh );
  }

  Bullet.prototype.move = function() {
    this.mesh.position.z -= BULLET_SPEED_Z;
    if (this.mesh.position.z < BULLET_BORDER_Z) {
      this.mesh.visible = false;
      return false;
    }
    return true;
  }

  Bullet.prototype.move_to = function(position) {
    this.mesh.position.set(position.x + this.side * BULLET_OFFSET, position.y, position.z);
    this.mesh.visible = true;
  }

  function sign(number) {
    return number ? number < 0 ? -1 : 1 : 0;
  }
}

THREE.Vector3.prototype.addSelf = THREE.Euler.prototype.addSelf = function(vector) {
  this.x += vector.x;
  this.y += vector.y;
  this.z += vector.z;
  return this;
}

THREE.Vector3.prototype.setVector = THREE.Euler.prototype.setVector = function(vector) {
  this.x = vector.x;
  this.y = vector.y;
  this.z = vector.z;
  return this;
}