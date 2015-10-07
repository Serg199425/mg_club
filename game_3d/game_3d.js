$(document).on('ready', function() {
  game = new Game();
  game.initialize();
});

function Game() {
  var move_interval;
  var scene, renderer, camera, current_scene, current_camera;
  var width = window.innerWidth - 20, height = window.innerHeight - 20;
  var is_started = false, is_paused = false, is_end = false;
  var loaded_models = 0;
  var frame_id;

  var iron_man, plane, enviroment, terrains_container;
  var camera_vibration_direction = 1;

  var BORDER_X = 60, BORDER_Y = 40;
  var FRONT_BORDER_Z = -170;
  var PLANE_MAX_ROTATIONS = 20;
  var PLANE_ANGLE_STEP_X = 0.02, PLANE_ANGLE_STEP_Y = 0.005;
  var MAX_SPEED_X = 0.5, MAX_SPEED_Y = 0.5;
  var SPEED_UP_STEP = 5, SPEED_DOWN_STEP = 1;
  var PLANE_EXPLOISON_CIRCLES = 1000;

  var BULLET_BORDER_Z = -450;
  var BULLET_SPEED_Y = 10, BULLET_SPEED_Z = 8;
  var BULLET_OFFSET = 2;
  var BULLETS_MAX_COUNT = 26;
  var RELOAD_TIME = 5;

  var IRON_MAN_MAX_HEALTH = 100;
  var IRON_HEALTH_DECREASE_STEP = 10;
  var IRON_MAN_MAX_ROTATIONS = 8;
  var IRON_MAN_ANGLE_STEP_X = 0.05, IRON_MAN_ANGLE_STEP_Y = 0.005;
  var BOOM_SPEED = 20;
  var IRON_MAN_EXPLOISON_CIRCLES = 5000;
  var IRON_MAN_HIT_CIRCLES = 10;
  var IRON_MAN_SPEED_X = 0.3, IRON_MAN_SPEED_Y = 0.2;
  var IRON_MAN_RADAR_RADIUS = 10, IRON_MAN_TERRAINS_RADIUS = 2500;

  var MODELS_COUNT = 3;
  var WATER_SPEED = 10;
  var WATER_PLANE_LENGTH = 20000, WATER_PLANE_WIDTH = 8000;

  var CAMERA_VIBRATION_VALUE = 0.15, CAMERA_POSITION_Y = 10;

  var TERRAINS_COUNT = 20, TERRAINS_INTERVAL = 4500;
  var TERRAIN_SPEED = 40;
  var TERRAIN_REAR_BORDER_Z = 0;

  var CLOUDS_COUNT = 20, CLOUDS_INTERVAL_Z = 2000, CLOUD_SPEED_Z = 20;

  this.initialize = function() {
    initialize_renderer();
    initialize_loading_scene();
    initialize_objects();
  }

  this.pause = function() {
    if (is_paused == true) {
      clearInterval(move_interval)
      is_paused = false
    } else { 
      move_interval = setInterval(move_objects, 10);
      is_paused = true;
    }
  }

  this.destroy_plane = function() {
    if (plane.ready) plane.explosion();
  }

  this.destroy_iron_man = function() {
    if (iron_man.ready) iron_man.explosion();
  }

  function onWindowResize() {
    width = window.innerWidth - 25;
    height = window.innerHeight - 25;
    current_camera.aspect = width / height;
    current_camera.updateProjectionMatrix();
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
    game.plane = plane = new Plane(scene, camera);
    game.iron_man = iron_man = new IronMan(scene);
    terrains_container = new TerrainsContainer();
    enviroment.add(terrains_container);
    increase_loaded_models();
  }

  function initialize_loading_scene() {
    $("#progress").show();
    current_scene = new THREE.Scene(),
    current_camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 1000 );

    current_camera.position.z = 100;
    current_scene.add( current_camera );

    var object, geometry, material, light, count = 500, range = 200;

    material = new THREE.MeshLambertMaterial( { color:0xffffff } );
    geometry = new THREE.BoxGeometry( 5, 5, 5 );

    for( var i = 0; i < count; i++ ) {

      object = new THREE.Mesh( geometry, material );

      object.position.x = ( Math.random() - 0.5 ) * range;
      object.position.y = ( Math.random() - 0.5 ) * range;
      object.position.z = ( Math.random() - 0.5 ) * range;

      object.rotation.x = Math.random() * 6;
      object.rotation.y = Math.random() * 6;
      object.rotation.z = Math.random() * 6;

      object.matrixAutoUpdate = false;
      object.updateMatrix();

      current_scene.add( object );

    }

    current_scene.matrixAutoUpdate = false;

    light = new THREE.PointLight( 0xffffff );
    current_scene.add( light );

    light = new THREE.DirectionalLight( 0x111111 );
    light.position.x = 1;
    current_scene.add( light );

    render();
  }

  function render() {
    frame_id = requestAnimationFrame( render );
    renderer.render( current_scene, current_camera );
    stats.update();
  }

  function start() {
    if (is_started) return;
    text1.remove();
    text2.remove();
    is_started = true;
    $('.health').show();
    clearInterval(move_interval);
    move_interval = setInterval(move_objects, 10);
  }

  function restart() {
    end_text.remove();
    is_end = false;
    plane.reset();
    iron_man.reset();
    clearInterval(move_interval);
    move_interval = setInterval(move_objects, 10);
  }

  function increase_loaded_models() {
    loaded_models++;
    if (loaded_models >= MODELS_COUNT) 
      show_game_scene();
    else
      update_progress_bar();
  }

  function show_game_scene() {
    current_scene = scene;
    current_camera = camera;
    $('.load.progress').hide();
    cancelAnimationFrame( frame_id );
    text1 = new Text(-20,10,0, "Press any Key");
    text2 = new Text(-10, 4,0, "to start");
    move_object_load_scene();
    move_interval = setInterval(move_object_load_scene, 10);
    render();
  }

  function update_progress_bar() {
    $('.load .progress-bar.progress-bar-danger').attr('style', 'width:' + (loaded_models * 100 / MODELS_COUNT) + '%;' );
  }

  function move_objects() {
    if (plane.move(terrains_container) == true) {
      clearInterval(move_interval);
      is_end = true;
      end_text = new Text(camera.position.x - 20, camera.position.y - 10 , 30, "GAME OVER");
      move_interval = setInterval(lose_animation, 10);
      iron_man.exhaust.toggle_visible();
      return;
    }

    if (iron_man.move(plane.bullets_container, terrains_container) == true) {
      clearInterval(move_interval);
      is_end = true;
      end_text = new Text(camera.position.x - 15, camera.position.y - 10 ,0, "YOU WIN!");
      move_interval = setInterval(won_animation, 10);
      return;
    }
    enviroment.move();
    camera_vibration();
  }

  function move_object_load_scene() {
    text1.mesh.scale.y = 1 + 0.1 * Math.sin(new Date().getTime() * .015);
    text2.mesh.scale.y = 1 + 0.1 * Math.sin(new Date().getTime() * .015);
    plane.move(terrains_container);
    enviroment.move();
    camera_vibration();
  }

  function camera_vibration() {
    camera.position.x += - CAMERA_VIBRATION_VALUE * sign(camera_vibration_direction);
    camera_vibration_direction = -sign(camera_vibration_direction);
  }

  function lose_animation() {
    end_text.mesh.scale.y = 1 + 0.1 * Math.sin(new Date().getTime() * .015);
    terrains_container.hide();
    if (!plane.exploded) 
      plane.explosion();
    iron_man.end_animation();
    enviroment.move_water();
  }

  function won_animation() {
    end_text.mesh.scale.y = 1 + 0.1 * Math.sin(new Date().getTime() * .015);
    terrains_container.hide();
    if (!iron_man.exploded) 
      iron_man.explosion();
    plane.end_animation();
    enviroment.move_water();
  }

  var keys = {};
  var previous_keys = {};

  $(document).keydown(function (e) {
      keys[e.which] = true; 

      if (keys[13] && is_started == false) {
        start();
        return;
      }

      if (is_started == false)
        return;

      if (keys[13] && is_end == true) {
        restart();
        return;
      }

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
    var position_x, position_z;
    for (var i = 0; i < TERRAINS_COUNT / 2; i++) {
      position_x = BORDER_X * (1 - 2 * Math.random()) * 8;
      position_z = - TERRAINS_INTERVAL * (i+5) - Math.random() * TERRAINS_INTERVAL / 2;
      this.in_game_area.push(new Terrain(position_x, position_z, true));
    }

    var side = 0;
    for (var i = 0; i < TERRAINS_COUNT / 2; i++) {
      i % 2 == 0 ? side = 1 : side = -1;
      position_x = side * 30 * BORDER_X * (1 + Math.random());
      position_z = - TERRAINS_INTERVAL * (i+4) - Math.random() * TERRAINS_INTERVAL / 2;
      this.in_enviroment.push(new Terrain(position_x, position_z, false));
    }

    this.ready = true;
  }

  TerrainsContainer.prototype.move = function() {
    if (is_started == false) return;
    for (var i = 0; i < this.in_enviroment.length; i++)
      this.in_enviroment[i].move();
    for (var i = 0; i < this.in_game_area.length; i++)
      this.in_game_area[i].move();
  }

  TerrainsContainer.prototype.collision_detected = function(mesh) {
    var collidable_mesh_list = [], local_vertex, global_vertex, direction_vector, ray_caster, results;
    for (var i = 0; i < this.in_game_area.length; i++) {
      if (Math.abs(this.in_game_area[i].mesh.position.z - mesh.position.z) < 300)
        collidable_mesh_list.push(this.in_game_area[i].mesh);
    }

    if (collidable_mesh_list.length > 0)
      for (var i = 0; i < mesh.geometry.vertices.length; i++) {       
        local_vertex = mesh.geometry.vertices[i].clone();
        global_vertex = local_vertex.applyMatrix4(mesh.matrix);
        direction_vector = global_vertex.subVectors(mesh.position, global_vertex);

        ray_caster = new THREE.Raycaster( mesh.position, direction_vector.clone().normalize() );
        results = ray_caster.intersectObjects( collidable_mesh_list );

        if ( results.length > 0 && results[0].distance <= direction_vector.length())
          return true;
      }

    delete collidable_mesh_list;
    return false;
  }

  TerrainsContainer.prototype.hide = function() {
    for (var i = 0; i < this.in_enviroment.length; i++)
      this.in_enviroment[i].hide();
    for (var i = 0; i < this.in_game_area.length; i++)
      this.in_game_area[i].hide();
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
      width: 100 + Math.random() * 100,
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
    terrain.position.y = - BORDER_Y - 350;
    terrain.position.z = position_z;
    this.mesh = terrain;
    this.box = new THREE.Box3().setFromObject( this.mesh );
    if (this.box.max.x - this.box.min.x > 120 && Math.abs(this.mesh.position.x) < 40 )
      this.mesh.scale.y = 0.5;
    else
      this.mesh.scale.y = 1.5;
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
    else {
      this.box = new THREE.Box3().setFromObject( this.mesh );
      if (this.box.max.x - this.box.min.x > 120 && Math.abs(this.mesh.position.x) < 40 )
        this.mesh.scale.y = 0.5;
      else
        this.mesh.scale.y = 1.5;
    }
  }

  Terrain.prototype.hide = function() {
    if (this.mesh.position.z > -20000 && this.mesh.position.y > - BORDER_Y - 350) 
      this.mesh.position.y -= 10;
    else
      if (this.mesh.position.z > -20000) {
        this.mesh.position.z -= TERRAINS_COUNT * TERRAINS_INTERVAL / 2;
        enviroment.move();
      }
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

    this.default_camera_position = camera.position.clone();
  }

  Plane.prototype.initialize = function(scene) {
    this.collision = new THREE.Mesh( new THREE.SphereGeometry( 8, 4, 4 ) ,
      new THREE.MeshBasicMaterial( { color: 0x00aaff } )  );
    this.collision.scale.set(1,0.16,1.5);

    var loader = new THREE.OBJMTLLoader();
    var plane = this;
    loader.load('models/Su-47_Berkut.obj', 'models/Su-47_Berkut.mtl',
      function ( object ) {
        object.rotateX(-Math.PI / 2);
        scene.add( object );
        plane.mesh = object;
        plane.exhaust = new Exhaust(plane);
        plane.default_rotation = plane.mesh.rotation.clone();
        plane.ready = true;
        increase_loaded_models();
      },
      function ( xhr ) {
        console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
      },
      function ( xhr ) {
        console.log( 'An error happened' );
      }
    );
  }

  Plane.prototype.reset = function() {
    this.camera.position.setVector(this.default_camera_position);
    if (this.exploison_circles > 0) this.cancel_exploison();
    this.exploded = false;
    this.mesh.rotation.setVector(this.default_rotation);
    this.mesh.position.set(0,0,0);
    this.exploison_circles = 0;
    this.rotations_y = 0;
    this.rotations_x = 0;
  }

  Plane.prototype.move = function(terrains) {
    if (this.exploison_circles != 0 || this.collision_detected(terrains)) {
      this.explosion();
      return true;
    }

    this.reload();
    this.shoot();
    this.update_position();
    this.animate();
    this.bullets_container.move(this.mesh.position, this.is_shooting);

    return false;
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
    this.collision.position.setVector(this.mesh.position);
  }

  Plane.prototype.animate = function() {
    this.exhaust.move(this.mesh.position, this.rotations_x, this.rotations_y, PLANE_MAX_ROTATIONS);
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
    this.collision.rotation.z = - this.rotations_x * PLANE_ANGLE_STEP_X;
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

    this.explosion_mesh.move();
    this.bullets_container.move(this.mesh.position, false);

    if (this.exploison_circles > PLANE_EXPLOISON_CIRCLES) this.exploded = true;
  }

  Plane.prototype.cancel_exploison = function() {
    this.exhaust.toggle_visible();
    for (var i = 0; i < this.mesh.children.length; i++) {
      this.mesh.children[i].position.x -= this.explosion_vertices[i].x * (this.exploison_circles);
      this.mesh.children[i].position.y -= this.explosion_vertices[i].y * (this.exploison_circles);
      this.mesh.children[i].position.z -= this.explosion_vertices[i].z * (this.exploison_circles);
      this.mesh.children[i].rotation.set(0,0,0);
    }

    this.explosion_vertices = [];
    this.explosion_rotations = [];
    this.explosion_mesh.remove();
    delete this.explosion_mesh;
  }

  Plane.prototype.collision_detected = function(terrains) {
    if (terrains.collision_detected(this.collision))
      return true;
    else
      return false;
  }

  Plane.prototype.end_animation = function() {
    this.rotate();
    this.mesh.position.z -= 10;
    this.exhaust.move(this.mesh.position, this.rotations_x, this.rotations_y, PLANE_MAX_ROTATIONS);
    this.bullets_container.move(this.mesh.position, false);
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

    var default_offset = { x: 0.8, y: 0.4, z: 5 };
    var turning_offset = { x: 0.8, y: -0.02, z: 5, y_multiplier: 0.4 };
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, 1));
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, -1));
  }

  Exhaust.prototype.move = function(parent_position, rotation_x, rotation_y, max_rotations) {
    for (var i = 0; i < this.particle_systems.length; i++)
      this.particle_systems[i].move(parent_position, rotation_x, rotation_y, max_rotations);
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

    var default_offset = { x: 0.5, y: 0.4, z: 3 };
    var turning_offset = { x: 0.5, y: -0.02, z: 3, y_multiplier: 1 };
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, 1));
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, -1));

    default_offset = { x: 1.0, y: 0.3, z: -3 };
    turning_offset = { x: 1.0, y: -0.01, z: -3, y_multiplier: 1 };
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, 1));
    this.particle_systems.push(new ParticleSystem(parameters, default_offset, turning_offset, parent.mesh.position, -1));
  }

  Exhaust.prototype.toggle_visible = function() {
    for (var i = 0; i < this.particle_systems.length; i++)
      this.particle_systems[i].toggle_visible();
  }

  function ParticleSystem(emitter_params, default_offset, turning_offset, parent_position, side) {
    this.default_offset = default_offset;
    this.turning_offset = turning_offset;
    this.offset_y_multiplier;
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

  ParticleSystem.prototype.move = function(pos, rotation_x, rotation_y, max_rotations) {
    if (rotation_x == 0)
      this.mesh.position.set(pos.x + this.default_offset.x * this.side, 
        pos.y + rotation_x * this.side * this.default_offset.y, pos.z + this.default_offset.z);
    else
      this.mesh.position.set(pos.x + this.turning_offset.x * this.side, 
        pos.y + rotation_x * this.side * this.turning_offset.y, pos.z + this.turning_offset.z);

    this.mesh.position.y -= rotation_y * this.turning_offset.y_multiplier / max_rotations;
    this.emitter.acceleration.set(this.acceleration.x, this.acceleration.y, -rotation_y);
    this.particle_group.tick();
  }

  ParticleSystem.prototype.toggle_visible = function() {
    this.mesh.visible == true ? this.mesh.visible = false : this.mesh.visible = true;
  }

  function Exploison(position, explosion_circles, color) {
    this.scaler = 1;
    this.initialize_mesh(position, color);
  }

  Exploison.prototype.move = function(position) {
    this.particle_group.mesh.scale.set(this.scaler, this.scaler, this.scaler);
    this.particle_group.tick();
    if (position) this.particle_group.mesh.position.setVector(position);
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
    this.health = 100;
    this.scene = scene;
    this.initialize();
    this.exploison_circles = 0;
    this.hit_circles = 0;
    this.rotations_x = 0;
    this.rotations_y = 0;
    this.explosion_vertices = [];
    this.explosion_rotations = [];
    this.lose_animation_circle = 0;
  }

  IronMan.prototype.initialize = function() {
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
        iron_man.default_rotation = iron_man.mesh.rotation.clone();
        iron_man.ready = true;
        increase_loaded_models();
      }
    );

    this.collision = new THREE.Mesh( new THREE.SphereGeometry( 2, 4, 4 ) ,
      new THREE.MeshBasicMaterial( { color: 0x00aaff } )
    );
    this.collision.scale.set(1.1,0.6,3);
    this.collision.position.z = -134;
    // scene.add(this.collision);
  }

  IronMan.prototype.reset = function() {
    if (this.exploison_circles > 0) this.cancel_exploison();
    this.exhaust.toggle_visible();
    this.exploded = false;
    this.health = 100;
    this.update_health_bar();

    this.exploison_circles = 0;
    this.hit_circles = 0;

    this.mesh.rotation.setVector(this.default_rotation);
    this.mesh.children[18].rotation.set(0,0,0);
    this.mesh.position.set(0,0,-130);

    this.rotations_y = 0;
    this.rotations_x = 0;
  }

  IronMan.prototype.is_dead = function(bullets, terrains) {
    if (this.exploison_circles > 0) {
      this.explosion();
      return true;
    }

    var collision_value = this.collision_detected(bullets, terrains);

    if (collision_value < 0) {
      this.explosion();
      return true;
    }

    if (collision_value > 0) {
      this.health -= 10 + Math.round(5 * Math.random());
      if (this.health <= 0) {
        this.explosion();
        return true;
      } else {
        this.hit_circles = 0;
        this.hit();
        return false;
      }
    }

    if (this.hit_circles > 0) {
      this.hit();
      return false;
    }

    return false;
  }

  IronMan.prototype.explosion = function() {
    this.exploison_circles += 1;
    if (this.exploison_circles == 1) {
      this.health = 0;
      this.update_health_bar();
      this.exploison_circles = 1;
      this.exhaust.toggle_visible();
      for (var  i = 0; i < this.mesh.children.length; i++)
        this.explosion_vertices[i] = new THREE.Vector3(1 - 2 * Math.random(), 1 - 2 * Math.random(), 1 - 2 * Math.random());

      for (var  i = 0; i < this.mesh.children.length; i++)
        this.explosion_rotations[i] = new THREE.Euler(1 - 2 * Math.random(), 1 - 2 * Math.random(), 3 - 2 * Math.random());
      if (this.explosion_mesh) {
        this.explosion_mesh.remove();
        delete this.explosion_mesh;
      }
      this.explosion_mesh = new Exploison(this.mesh.position.clone(), IRON_MAN_EXPLOISON_CIRCLES, 'blue');
    }

    for (var i = 0; i < this.mesh.children.length; i++) {
      this.mesh.children[i].position.addSelf(this.explosion_vertices[i]);
      this.mesh.children[i].rotation.addSelf(this.explosion_rotations[i]);
    }

    this.explosion_mesh.move();

    if (this.exploison_circles > IRON_MAN_EXPLOISON_CIRCLES) this.exploded = true;
  }

  IronMan.prototype.cancel_exploison = function() {
    for (var i = 0; i < this.mesh.children.length; i++) {
      this.mesh.children[i].position.x -= this.explosion_vertices[i].x * (this.exploison_circles);
      this.mesh.children[i].position.y -= this.explosion_vertices[i].y * (this.exploison_circles);
      this.mesh.children[i].position.z -= this.explosion_vertices[i].z * (this.exploison_circles);
      this.mesh.children[i].rotation.set(0,0,0);
    }

    this.explosion_mesh.remove();
    this.explosion_vertices = [];
    this.explosion_rotations = [];
    delete this.explosion_mesh;
  }

  IronMan.prototype.update_health_bar = function() {
    var health_value = this.health
    if (health_value < 0) health_value = 1;
    color = { r: Math.round(255 * (1 - this.health / (1.7 * IRON_MAN_MAX_HEALTH))) , 
      g: Math.round(255 * this.health * 1.2 / IRON_MAN_MAX_HEALTH), b: 0 };
    color_string = "rgb(" + color.r + "," + color.g + "," + color.b + ');';
    $('.health .progress-bar.progress-bar-success').attr('style', 'width:' + this.health + '%;background-color:' + color_string );
  }

  IronMan.prototype.hit = function() {
    if (this.hit_circles == 0) {
      this.update_health_bar();
      this.hit_circles = 1;
      if (this.explosion_mesh) {
        this.explosion_mesh.remove();
        delete this.explosion_mesh;
      }
      this.explosion_mesh = new Exploison(this.mesh.position.clone(), IRON_MAN_EXPLOISON_CIRCLES, 'orange');
    }

    this.explosion_mesh.move(this.position);
    this.hit_circles += 1;

    if (this.hit_circles > IRON_MAN_HIT_CIRCLES) {
      this.hit_circles = 0;
      this.explosion_mesh.remove();
      delete this.explosion_mesh;
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
      if (terrains.in_game_area[i].box.min.x - 10 < this.mesh.position.x &&
          terrains.in_game_area[i].box.max.x + 10 > this.mesh.position.x &&
          terrains.in_game_area[i].mesh.position.z > -IRON_MAN_TERRAINS_RADIUS) {
        if ((terrains.in_game_area[i].box.max.y < BORDER_Y - 5) && (terrains.in_game_area[i].box.max.y > this.mesh.position.y - 5))
          this.direction_y = 1;
        else
          this.direction_x = -sign(terrains.in_game_area[i].mesh.position.x);
      }
    }
  }

  IronMan.prototype.move = function(bullets, terrains) {
    if (this.is_dead(bullets, terrains)) return true;
    this.choose_direction(bullets, terrains);
    this.update_position();
    this.animate();
    return false;
  }

  IronMan.prototype.update_position = function() {
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

    this.collision.position.setVector(this.mesh.position);
  }

  IronMan.prototype.animate = function() {
    this.rotate();
    this.exhaust.move(this.mesh.position, this.rotations_x, this.rotations_y, IRON_MAN_MAX_ROTATIONS);
  }

  IronMan.prototype.collision_detected = function(bullets, terrains) {
    if (bullets.collision_detected(this)) return 1;
    if (terrains.collision_detected(this.collision)) return -1;
    return 0;
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

  IronMan.prototype.end_animation = function() {
    if (Math.abs(this.mesh.position.y - (camera.position.y + 2)) >= 1)
      this.mesh.position.y += sign((camera.position.y + 2) - this.mesh.position.y);
    if (Math.abs(this.mesh.position.x - camera.position.x) >= 1)
      this.mesh.position.x += sign(camera.position.x - this.mesh.position.x);
    if (this.mesh.rotation.x < Math.PI)
      this.mesh.rotation.x += 0.05;
    if (this.mesh.rotation.y > -Math.PI)
      this.mesh.rotation.y -= 0.05;
    if (this.mesh.position.z < 53)
      this.mesh.position.z += 1;
    else {
      this.mesh.children[18].rotation.y = 0.8 * Math.sin(new Date().getTime() * .005);
    }
  }

  function Enviroment(scene, directional_light) {
    this.objects = [];
    this.water = [];
    this.initialize(scene, directional_light);
  }

  Enviroment.prototype.initialize = function(scene, directional_light) {
    new SkyBox(scene);
    this.water.push(new Water(-WATER_PLANE_LENGTH / 2, scene, directional_light));
    this.water.push(new Water(-WATER_PLANE_LENGTH * 1.5, scene, directional_light));
    this.objects = this.objects.concat(this.water);
  } 

  Enviroment.prototype.add = function(object) {
    this.objects.push(object);
  }

  Enviroment.prototype.move = function() {
    for (var index in this.objects)
      this.objects[index].move();
  }

  Enviroment.prototype.move_water = function() {
    for (var index in this.water)
      this.water[index].move();
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
      new THREE.MeshBasicMaterial( { color: 0xFF0A00, specular: 0x555555, shininess: 30 })
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
      if (this.bullets[i].mesh.visible == true &&
          this.bullets[i].mesh.position.x <= iron_man.mesh.position.x + 3 &&
          this.bullets[i].mesh.position.x >= iron_man.mesh.position.x - 3 &&
          this.bullets[i].mesh.position.y <= iron_man.mesh.position.y + 1 &&
          this.bullets[i].mesh.position.y >= iron_man.mesh.position.y - 1 &&
          this.bullets[i].mesh.position.z > FRONT_BORDER_Z &&
          this.bullets[i].mesh.position.z < FRONT_BORDER_Z + 6) {
        this.bullets[i].mesh.visible = false;
        return true;
      }
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

  function Text(pos_x, pos_y, pos_z, text)
  {
    var material = new THREE.MeshPhongMaterial( { color: 0xff0000, overdraw: 0.5, transparent:true } );
    var geometry = new THREE.TextGeometry( text, {
            size: 5,
            height: 5,
            curveSegments: 5,
            font: "optimer"
          });

    this.mesh = new THREE.Mesh( geometry, material );

    this.mesh.position.set(pos_x, pos_y, pos_z);

    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;

    scene.add(this.mesh);
  }

  Text.prototype.remove = function()
  {
    scene.remove(this.mesh);
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