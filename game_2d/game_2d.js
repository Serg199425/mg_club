$(document).on('ready', function() {
  initialize_renderer();
  initialize_objects();

  window.onresize = function(event) {
    resize();
  };
});

var LEFT_BORDER = 60;
var RIGHT_BORDER = window.innerWidth - 80;
var UP_BORDER = 0;
var DOWN_BORDER = window.innerHeight;
var MAX_SPEED_X = 10;
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

function render() {
  move_objects();
  renderer.render(create_gaming_scene());
}

function render_with_text() {
  renderer.render(create_start_scene());
}

function resize() {
  WIDTH = window.innerWidth - 20;
  HEIGHT = window.innerHeight - 20;
  RIGHT_BORDER = WIDTH - 80;
  DOWN_BORDER = window.innerWidth;

  renderer.resize(WIDTH, HEIGHT);

  if (game_is_started == false) {
    plane.pos_x = iron_man.pos_x = WIDTH / 2;
  }

  plane.pos_y = HEIGHT - 250;
}

function initialize_renderer() {
  WIDTH = window.innerWidth - 20;
  HEIGHT = window.innerHeight - 20;

  renderer = new PIXI.CanvasRenderer(WIDTH, HEIGHT);
  renderer.backgroundColor = 0x00BBFF;
  document.body.appendChild(renderer.view);
}

function initialize_objects() {
  plane = new Plane(WIDTH / 2, HEIGHT - 250 );
  iron_man = new IronMan(WIDTH / 2, 20);
  enviroment = new Enviroment();
  show_press_text = true;
  interval = setInterval(render_with_text, 200);
}

function start() {
  if (game_is_started) return;
  game_is_started = true;
  clearInterval(interval);
  render_interval = setInterval(render, 10);
  move_interval = setInterval(move_objects, 50);
  enviroment_interval = setInterval(update_enviroment, 200);
}

function create_gaming_scene() {
  var scene = new PIXI.Container();
  scene.addChild(enviroment.get_model());
  scene.addChild(iron_man.get_model());
  scene.addChild(plane.get_model());
  if (iron_man.boom_duration > 0) {
    var text_style = {font: "bold 35px Snippet", fill: "white", dropShadow: true };
    var target_text = new PIXI.Text('IRON MAN IS DESTROYED', text_style);
    target_text.position.x = WIDTH / 2 - target_text.width / 2;
    target_text.position.y = HEIGHT / 2 - target_text.height;
    scene.addChild(target_text)
  }
  return scene;
};

function create_start_scene() {
  var scene = create_gaming_scene();
  var text_style = {font: "bold 35px Snippet", fill: "white", dropShadow: true };
  var target_text = new PIXI.Text('DESTROY THE IRON MAN', text_style);
  var press_text = new PIXI.Text('press [enter] to start', text_style);
  target_text.position.x = WIDTH / 2 - target_text.width / 2;
  target_text.position.y = HEIGHT / 2 - 100;
  press_text.position.x = WIDTH / 2 - press_text.width / 2;
  press_text.position.y = HEIGHT / 2 - 50;
  scene.addChild(target_text);
  if (show_press_text) {
    scene.addChild(press_text);
    show_press_text = false;
  } else {
    show_press_text = true;
  }
  return scene;
}

function update_enviroment() {
  enviroment.add_cloud(iron_man);
}

function move_objects() {
  plane.move();
  enviroment.move(iron_man);
  iron_man.move(plane.bullets);
  iron_man.check_collision(plane.bullets);
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
      plane.shoot();
    previous_keys = keys;
});

$(document).keyup(function (e) {
    delete keys[e.which];
    if (!keys[37] && !keys[39])
      plane.stop_move();
});

function Plane (pos_x, pos_y) {
  this.pos_x = pos_x;
  this.pos_y = pos_y;
  this.rotation = 0;
  this.speed_x = 0;
  this.model_index = 0;
  this.models = [this.draw(), this.draw_in_motion()];
  this.fire_side = 1;
  this.fire_models = this.draw_fire();
  this.fire_model_index = 0;
  this.reload_time = 0;
  this.bullets = [];
}

Plane.prototype.get_model = function() {
  var container = new PIXI.Container();
  container.addChild(this.get_fire());
  container.addChild(this.get_bullets());
  container.addChild(this.get_plane());
  return container;
}

Plane.prototype.get_plane = function() {
  this.speed_x == 0 ? this.model_index = 0: this.model_index = 1;
  var model = this.models[this.model_index];
  model.position.x = this.pos_x;
  model.position.y = this.pos_y;
  this.speed_x > 0 ? model.scale.x = - 0.6 : model.scale.x = 0.6; 
  return model;
}

Plane.prototype.get_fire = function() {
  this.fire_model_index == 0 ? this.fire_model_index = 1 : this.fire_model_index = 0;
  this.fire_models[this.fire_model_index].position.x = this.pos_x + this.fire_side;
  this.fire_side > 0 ? this.fire_side = -1 : this.fire_side = 1; 
  this.fire_models[this.fire_model_index].position.y = this.pos_y + 170;
  return this.fire_models[this.fire_model_index];
}

Plane.prototype.get_bullets = function() {
  var bullets = new PIXI.Container();
  for (var i = 0; i < this.bullets.length; i++ )
    bullets.addChild(this.bullets[i].get_model());
  return bullets;
}

Plane.prototype.move = function() {
  this.reload();
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
  if (this.reload_time > 0) return;
  this.reload_time = RELOAD_TIME;
  this.bullets.push(new Bullet(this.pos_x + 30, this.pos_y + 120));
  this.bullets.push(new Bullet(this.pos_x - 30, this.pos_y + 120));
}

Plane.prototype.update_position = function() {
  this.pos_x += this.speed_x;
  if (this.pos_x < LEFT_BORDER) {
    this.pos_x = LEFT_BORDER;
    this.speed_x = 0;
  }
  if (this.pos_x > RIGHT_BORDER) {
    this.pos_x = RIGHT_BORDER
    this.speed_x = 0;
  }
}

Plane.prototype.update_bullets_position = function() {
  for (var i = 0; i < this.bullets.length; i++) {
    if (this.bullets[i].move() == false) {
      this.bullets.splice(i,1);
      i--;
    }
  }
}

function IronMan(pos_x, pos_y) {
  this.pos_x = pos_x;
  this.pos_y = pos_y;
  this.model = this.draw();
  this.boom_model = this.boom_draw();
  this.boom_duration = 0;
  this.speed_x = 0;
}

IronMan.prototype.get_model = function() {
  if (this.boom_duration == 0) {
    this.model.position.x = this.pos_x;
    this.model.position.y = this.pos_y;
    return this.model;
  } else {
    if (this.boom_duration < BOOM_DURATION_CIRCLES) {
      this.boom_duration += 1;
    } else {
      this.boom_duration = 0;
    }
    this.boom_model = this.boom_draw();
    this.boom_model.position.x = this.pos_x;
    this.boom_model.position.y = this.pos_y;
    return this.boom_model;
  }
}

IronMan.prototype.check_collision = function(bullets) {
  if (this.boom_duration != 0) return;
  for (var i = 0; i < bullets.length; i++) {
    if (bullets[i].pos_x <= this.pos_x + this.model.width / 1.8 &&
        bullets[i].pos_x >= this.pos_x - this.model.width / 1.8 &&
        bullets[i].pos_y < UP_BORDER + 50 &&
        bullets[i].pos_y > UP_BORDER)
      this.boom_duration += 1;
  }
}

IronMan.prototype.move = function(bullets) {
  if (this.boom_duration > 0) return;
  var collision_is_near = false;
  var clothest_bullets = [];
  var direction = 0;

  for (var i = 0; i < bullets.length; i++) {
    if (bullets[i].pos_x <= this.pos_x + IRON_MAN_RADAR_RADIUS &&
        bullets[i].pos_x >= this.pos_x - IRON_MAN_RADAR_RADIUS && 
        bullets[i].pos_y > UP_BORDER) {
      clothest_bullets.push(bullets[i])
      collision_is_near = true;
    }
  }

  if (collision_is_near == true) {
    clothest_bullets.sort(function(a, b) {
      if (a.pos_y < b.pos_y)
        return -1;
      if (a.pos_y > b.pos_y)
        return 1;
      if (a.pos_y == b.pos_y)
        return 0;
    });

    for (var i = 0; i < clothest_bullets.length; i++)
      clothest_bullets[i].pos_x <= this.pos_x ? direction += 1 / (i + 1) : direction -= 1 / (i + 1);

    direction > 0 ? this.speed_x = IRON_MAN_SPEED_X : this.speed_x = -IRON_MAN_SPEED_X;
  } else {
    if (Math.abs(this.pos_x - WIDTH / 2) > IRON_MAN_SPEED_X)
      (this.pos_x - WIDTH / 2 < 0) ? this.speed_x = IRON_MAN_SPEED_X : this.speed_x = -IRON_MAN_SPEED_X;
    else
      this.speed_x = 0;
  }

  this.pos_x += this.speed_x;
  if (this.pos_x < LEFT_BORDER) {
    this.pos_x = LEFT_BORDER;
    this.speed_x = 0;
  }
  if (this.pos_x > RIGHT_BORDER) {
    this.pos_x = RIGHT_BORDER
    this.speed_x = 0;
  }
}

function Bullet(pos_x, pos_y) {
  this.pos_x = pos_x;
  this.pos_y = pos_y;
  this.speed_y = BULLET_SPEED_Y;
  this.models = [this.draw(1), this.draw(0)];
  this.model_index = 0;
}

Bullet.prototype.move = function() {
  this.pos_y -= BULLET_SPEED_Y;
  return this.pos_y < UP_BORDER - 100 ? false : true;
}

Bullet.prototype.get_model = function() {
  this.model_index == 0 ? this.model_index = 1 : this.model_index = 0;
  this.models[this.model_index].position.x = this.pos_x;
  this.models[this.model_index].position.y = this.pos_y;
  return this.models[this.model_index];
}

function Cloud(pos_x, pos_y) {
  this.pos_x = pos_x;
  this.pos_y = pos_y;
  this.speed_x = CLOUD_SPEED_X;
  this.speed_y = CLOUD_SPEED_Y;
  this.model = this.draw();
}

function Enviroment() {
  this.clouds = [];
}

Enviroment.prototype.add_cloud = function(iron_man) {
  if (iron_man.boom_duration > 0) return;
  this.clouds.push(new Cloud(Math.random() * WIDTH, -500)); 
}

Enviroment.prototype.move = function(iron_man) {
  for (var i = 0; i < this.clouds.length; i++) {
    if (this.clouds[i].move(iron_man) == false) {
      this.clouds.splice(i,1);
      i--;
    }
  }
}

Enviroment.prototype.get_model = function() {
  var enviroment_models = new PIXI.Container();
  for (var i = 0; i < this.clouds.length; i++)
    enviroment_models.addChild(this.clouds[i].get_model());
  return enviroment_models;
}

Cloud.prototype.move = function(iron_man) {
  if (iron_man.boom_duration > 0) {
    this.speed_x = CLOUD_SPEED_X / (this.pos_x - iron_man.pos_x);
    this.pos_y - iron_man.pos_y > 0 ? this.speed_y = CLOUD_SPEED_Y : this.speed_y = - CLOUD_SPEED_Y;
  } else {
    this.speed_x = CLOUD_SPEED_X;
    this.speed_y = CLOUD_SPEED_Y;
  }
  this.pos_x += this.speed_x;
  this.pos_y += this.speed_y;
  return this.pos_y > DOWN_BORDER ? false : true;
}

Cloud.prototype.get_model = function() {
  this.model.position.x = this.pos_x;
  this.model.position.y = this.pos_y;
  return this.model;
}

//drawing

Cloud.prototype.draw = function() {
  var pos_y = 0, side = 1, pos_x = 0;
  var graphics = new PIXI.Graphics();

  for (var i = 0; i < 10; i++) {
    graphics.beginFill(0xFFFFFF);
    graphics.drawEllipse(pos_x + side * (3 + Math.random()) * 10, 
      pos_y + 100, 50 + Math.random() * 40, 50 + Math.random() * 40);
    pos_x += Math.random() * 60 - 30;
    pos_y += Math.random() * 60 - 30;
    side > 0 ? side = -1 : side = 1;
  }

  graphics.scale.x = 1 + Math.random();
  graphics.scale.y = 1 + Math.random();
  graphics.alpha = Math.random() / 2 + 0.2;
  return graphics;
}


Bullet.prototype.draw = function(variant) {
  var pos_x = 0;
  var pos_y = 0;
  var bullet = new PIXI.Container();
  var graphics = new PIXI.Graphics();
  graphics.lineStyle(5, 0xFF0000);
  graphics.beginFill(0xFF9108);
  graphics.moveTo(0, 150);
  graphics.lineTo(20, 200 + Math.random() * 10);
  graphics.lineTo(12, 190 + Math.random() * 20);
  graphics.lineTo(35, 240 + Math.random() * 30);
  graphics.lineTo(0, 230);
  graphics.lineTo(-35, 240 + Math.random() * 30);
  graphics.lineTo(-12, 190 + Math.random() * 20);
  graphics.lineTo(-20, 200 + Math.random() * 10);
  graphics.endFill();

  graphics.beginFill(0xAAAAAA);
  graphics.moveTo(0,0);
  graphics.lineTo(10, 30);
  graphics.lineTo(-10, 30);
  graphics.endFill();

  graphics.beginFill(0x666666);
  graphics.lineStyle(0);
  graphics.drawEllipse(0,30, 10, 30);
  graphics.endFill();

  graphics.scale.x = 0.25;
  graphics.scale.y = 0.35;

  return graphics;
}

Plane.prototype.draw_fire = function(variant) {
  var pos_x = 0;
  var pos_y = 0;
  var fire1 = new PIXI.Graphics();
  fire1.lineStyle(5, 0xFF0000);
  fire1.beginFill(0xFF9108);
  fire1.moveTo(0,0);
  fire1.lineTo(50 + Math.random() * 10, 20);
  fire1.lineTo(40, 8 + Math.random() * 8);
  fire1.lineTo(90 + Math.random() * 40, 35);
  fire1.lineTo(80, 0);
  fire1.lineTo(90, -25 - Math.random() * 10);
  fire1.lineTo(40, -8 - Math.random() * 8);
  fire1.lineTo(50, -20);
  fire1.position.x = pos_x + 10;
  fire1.position.y = pos_y + 280;
  fire1.endFill();
  fire1.rotation = Math.PI / 2;

  var fire2 = new PIXI.Graphics();
  fire2.lineStyle(5, 0xFF0000);
  fire2.beginFill(0xFF9108);
  fire2.moveTo(0,0);
  fire2.lineTo(50, 20);
  fire2.lineTo(40, 8);
  fire2.lineTo(90, 25);
  fire2.lineTo(80, 0);
  fire2.lineTo(110, -35);
  fire2.lineTo(40, -12);
  fire2.lineTo(60, -20);
  fire2.position.x = pos_x - 10;
  fire2.position.y = pos_y + 280;
  fire2.endFill();
  fire2.rotation = Math.PI / 2;

  fire1.scale.x = 0.8;
  fire1.scale.y = 0.4;

  fire2.scale.x = 0.7;
  fire2.scale.y = 0.4;

  return [fire1, fire2];
}

Plane.prototype.draw_in_motion = function (variant) {
  var pos_x = 0;
  var pos_y = 0;
  var plane = new PIXI.Container();

  var front = new PIXI.Graphics();
  front.beginFill(0xA0A0A0);
  front.moveTo(0,0);
  front.lineTo(10, 30);
  front.lineTo(-10, 30);
  front.position.x = pos_x;
  front.position.y = pos_y;
  front.endFill();
  plane.addChild(front);

  var ellipse = new PIXI.Graphics();
  ellipse.beginFill(0xA0A0A0);
  ellipse.drawEllipse(0,0, 20, 80);
  ellipse.position.x = pos_x;
  ellipse.position.y = pos_y + 100;
  plane.addChild(ellipse);

  var rear = new PIXI.Graphics();
  rear.beginFill(0xA0A0A0);
  rear.moveTo(0,0);
  rear.lineTo(22, 0);
  rear.lineTo(15, 30);
  rear.lineTo(-15, 30);
  rear.lineTo(-22, 0);
  rear.position.x = pos_x;
  rear.position.y = pos_y + 260;
  rear.endFill();
  plane.addChild(rear);

  var body = new PIXI.Graphics();
  body.beginFill(0xC4C4C4);
  body.moveTo(0,0);
  body.lineTo(20, 0);
  body.lineTo(40, 40);
  body.lineTo(140, 110);
  body.lineTo(140, 120);
  body.lineTo(40, 120);
  body.lineTo(40, 130);
  body.lineTo(80, 160);
  body.lineTo(80, 170);
  body.lineTo(-80, 170);
  body.lineTo(-80, 160);
  body.lineTo(-40, 130);
  body.lineTo(-40, 120);
  body.lineTo(-140, 120);
  body.lineTo(-140, 110);
  body.lineTo(-40, 40);
  body.lineTo(-20, 0);
  body.position.x = pos_x;
  body.position.y = pos_y + 100;
  body.scale.x = 0.9;
  body.endFill();
  plane.addChild(body);

  var body = new PIXI.Graphics();
  body.beginFill(0xA0A0A0);
  body.drawRect(0,0, 40, 170);
  body.position.x = pos_x - 20;
  body.position.y = pos_y + 100;
  plane.addChild(body);

  var ellipse = new PIXI.Graphics();
  ellipse.beginFill(0x0077FF);
  ellipse.drawEllipse(0,0, 15, 50);
  ellipse.position.x = pos_x - 10;
  ellipse.position.y = pos_y + 90;
  plane.addChild(ellipse);

  var rear = new PIXI.Graphics();
  rear.beginFill(0xC0C0C0);
  rear.moveTo(0,0);
  rear.lineTo(0, 50);
  rear.lineTo(-15, 50);
  rear.lineTo(-15, 20);
  rear.position.x = pos_x;
  rear.position.y = pos_y + 230;
  rear.endFill();
  plane.addChild(rear);

  var tail = new PIXI.Graphics();
  tail.beginFill(0x909090);
  tail.drawRect(0,0, 6, 30);
  tail.position.x = pos_x - 15;
  tail.position.y = pos_y + 250;
  plane.addChild(tail);

  var star = new PIXI.Graphics();
  star.beginFill(0xFF0000);
  star.moveTo(0,0);
  star.lineTo(10, 20);
  star.lineTo(35, 20);
  star.lineTo(15, 30);
  star.lineTo(25, 50);
  star.lineTo(0, 35);
  star.lineTo(-25, 50);
  star.lineTo(-15, 30);
  star.lineTo(-35, 20);
  star.lineTo(-10, 20);
  star.position.x = pos_x - 70;
  star.position.y = pos_y + 170;
  star.scale.x = 0.4;
  star.scale.y = 0.8;
  star.endFill();

  plane.addChild(star);

  var star = star.clone();
  star.scale.x = 0.4;
  star.scale.y = 0.8;
  star.position.x = pos_x + 70;
  star.position.y = pos_y + 170;
  plane.addChild(star);

  plane.scale.x = 0.4;
  plane.scale.y = 0.6;
  return plane;
}

Plane.prototype.draw = function () {
  var pos_x = 0;
  var pos_y = 0;
  var plane = new PIXI.Container();

  var front = new PIXI.Graphics();
  front.beginFill(0xA0A0A0);
  front.moveTo(0,0);
  front.lineTo(10, 30);
  front.lineTo(-10, 30);
  front.position.x = pos_x;
  front.position.y = pos_y;
  front.endFill();
  plane.addChild(front);

  var ellipse = new PIXI.Graphics();
  ellipse.beginFill(0xA0A0A0);
  ellipse.drawEllipse(0,0, 20, 80);
  ellipse.position.x = pos_x;
  ellipse.position.y = pos_y + 100;
  plane.addChild(ellipse);

  var rear = new PIXI.Graphics();
  rear.beginFill(0xA0A0A0);
  rear.moveTo(0,0);
  rear.lineTo(22, 0);
  rear.lineTo(15, 30);
  rear.lineTo(-15, 30);
  rear.lineTo(-22, 0);
  rear.position.x = pos_x;
  rear.position.y = pos_y + 260;
  rear.endFill();
  plane.addChild(rear);

  var body = new PIXI.Graphics();
  body.beginFill(0xC4C4C4);
  body.moveTo(0,0);
  body.lineTo(20, 0);
  body.lineTo(40, 40);
  body.lineTo(140, 110);
  body.lineTo(140, 120);
  body.lineTo(40, 120);
  body.lineTo(40, 130);
  body.lineTo(80, 160);
  body.lineTo(80, 170);
  body.lineTo(-80, 170);
  body.lineTo(-80, 160);
  body.lineTo(-40, 130);
  body.lineTo(-40, 120);
  body.lineTo(-140, 120);
  body.lineTo(-140, 110);
  body.lineTo(-40, 40);
  body.lineTo(-20, 0);
  body.position.x = pos_x;
  body.position.y = pos_y + 100;
  body.endFill();
  plane.addChild(body);

  var body = new PIXI.Graphics();
  body.beginFill(0xA0A0A0);
  body.drawRect(0,0, 40, 170);
  body.position.x = pos_x - 20;
  body.position.y = pos_y + 100;
  plane.addChild(body);

  var ellipse = new PIXI.Graphics();
  ellipse.beginFill(0x0077FF);
  ellipse.drawEllipse(0,0, 15, 50);
  ellipse.position.x = pos_x;
  ellipse.position.y = pos_y + 90;
  plane.addChild(ellipse);

  var body = new PIXI.Graphics();
  body.beginFill(0xC0C0C0);
  body.drawRect(0,0, 6, 50);
  body.position.x = pos_x - 3;
  body.position.y = pos_y + 230;
  plane.addChild(body);

  var body = new PIXI.Graphics();
  body.beginFill(0x909090);
  body.drawRect(0,0, 6, 30);
  body.position.x = pos_x - 3;
  body.position.y = pos_y + 250;
  plane.addChild(body);

  var star = new PIXI.Graphics();
  star.beginFill(0xFF0000);
  star.moveTo(0,0);
  star.lineTo(10, 20);
  star.lineTo(35, 20);
  star.lineTo(15, 30);
  star.lineTo(25, 50);
  star.lineTo(0, 35);
  star.lineTo(-25, 50);
  star.lineTo(-15, 30);
  star.lineTo(-35, 20);
  star.lineTo(-10, 20);
  star.position.x = pos_x - 70;
  star.position.y = pos_y + 170;
  star.scale.x = 0.6;
  star.scale.y = 0.8
  star.endFill();

  plane.addChild(star);

  var star = star.clone();
  star.scale.x = 0.6;
  star.scale.y = 0.8;
  star.position.x = pos_x + 70;
  star.position.y = pos_y + 170;
  plane.addChild(star);

  plane.scale.x = 0.4;
  plane.scale.y = 0.6;
  return plane;
}

IronMan.prototype.boom_draw = function() {
  var pos_x = 0;
  var pos_y = 0;
  var iron_man = new PIXI.Container();
  var boom_position = 70 * this.boom_duration

  var head = new PIXI.Graphics();
  head.beginFill(0xFF3f15);
  head.moveTo(0,0);
  head.lineTo(10, 0);
  head.lineTo(20, 10);
  head.lineTo(20, 30);
  head.lineTo(10, 40);
  head.lineTo(-10, 40);
  head.lineTo(-20, 30);
  head.lineTo(-20, 10);
  head.lineTo(-10, 0);
  head.position.x = pos_x;
  head.position.y = pos_y + boom_position;
  head.endFill();
  iron_man.addChild(head);

  //right arm up

  var head = new PIXI.Graphics();
  head.beginFill(0xecdc3d);
  head.moveTo(0,0);
  head.lineTo(10, 0);
  head.lineTo(15, 5);
  head.lineTo(25, 30);
  head.lineTo(20, 60);
  head.lineTo(5, 60);
  head.lineTo(0, 30);

  head.position.x = pos_x + 35 + boom_position / 3;
  head.position.y = pos_y + 50 + boom_position;
  head.endFill();
  iron_man.addChild(head);

  //left arm up
  var head = head.clone();
  head.position.x = pos_x - 35 - boom_position;
  head.position.y = pos_y + 50 + boom_position / 4;
  head.scale.x = -1;
  head.endFill();
  iron_man.addChild(head);

  //right arm down

  var head = new PIXI.Graphics();
  head.beginFill(0xFF0000);
  head.moveTo(5,0);
  head.lineTo(10, 0);
  head.lineTo(15, 5);
  head.lineTo(25, 30);
  head.lineTo(20, 60);
  head.lineTo(5, 60);
  head.lineTo(0, 30);


  head.position.x = pos_x + 35 + boom_position / 4;
  head.position.y = pos_y + 70 + boom_position / 3;
  head.endFill();
  iron_man.addChild(head);

  //left arm down
  var head = head.clone();
  head.position.x = pos_x - 35 - boom_position / 3;
  head.position.y = pos_y + 70 + boom_position / 2;
  head.scale.x = -1;
  head.endFill();
  iron_man.addChild(head);


  //body
  var head = new PIXI.Graphics();
  head.beginFill(0xFF3f15);
  head.moveTo(0,0);
  head.lineTo(20, 0);
  head.lineTo(45, 10);
  head.lineTo(45, 40);
  head.lineTo(25, 80);
  head.lineTo(-25, 80);
  head.lineTo(-45, 40);
  head.lineTo(-45, 10);
  head.lineTo(-20, 0);
  head.position.x = pos_x + boom_position;
  head.position.y = pos_y + 35 + boom_position / 4;
  head.endFill();
  iron_man.addChild(head);

  var head = new PIXI.Graphics();
  head.beginFill(0xFF0000);
  head.moveTo(0,0);
  head.lineTo(25, 0);
  head.lineTo(35, 20);
  head.lineTo(35, 40);
  head.lineTo(25, 70);
  head.lineTo(10, 70);
  head.lineTo(0, 40);

  head.position.x = pos_x;
  head.position.y = pos_y + 125 + boom_position;
  head.endFill();
  iron_man.addChild(head);

  //leg low

  var head = new PIXI.Graphics();
  head.beginFill(0xFF00000);
  head.moveTo(0,0);
  head.lineTo(25, 0);
  head.lineTo(33, 20);
  head.lineTo(33, 40);
  head.lineTo(25, 70);
  head.lineTo(10, 70);
  head.lineTo(3, 40);
  head.lineTo(3, 20);
  head.lineTo(10, 0);

  head.position.x = pos_x + boom_position / 2;
  head.position.y = pos_y + 185 + boom_position;
  head.endFill();
  iron_man.addChild(head);

  var head = head.clone();
  head.position.x = pos_x - boom_position / 2;
  head.position.y = pos_y + 185 + boom_position;
  head.scale.x = -1;
  head.endFill();
  iron_man.addChild(head);

  //foot

  var head = new PIXI.Graphics();
  head.beginFill(0xecdc3d);
  head.moveTo(0,-3);
  head.lineTo(20, -3);
  head.lineTo(23, 5);
  head.lineTo(18, 20);
  head.lineTo(5, 20);
  head.lineTo(0, 5);
  head.lineTo(5, -3);

  head.position.x = pos_x + 5 - boom_position;
  head.position.y = pos_y + 255 + boom_position * 2;
  head.scale.y = 1.5
  head.endFill();
  iron_man.addChild(head);

  //palm

  var head = head.clone();
  head.position.x = pos_x + 35 + boom_position;
  head.position.y = pos_y + 130 + boom_position / 3;
  iron_man.addChild(head);

  var head = head.clone();
  head.position.x = pos_x - 60 + boom_position / 2;
  head.position.y = pos_y + 130 + boom_position / 2; 
  iron_man.addChild(head);

  //back
  var head = new PIXI.Graphics();
  head.beginFill(0xecdc3d);
  head.moveTo(0,0);
  head.lineTo(25, 0);
  head.lineTo(35, 20);
  head.lineTo(35, 40);
  head.lineTo(25, 80);
  head.lineTo(10, 80);
  head.lineTo(0, 40);
  head.lineTo(0, 20);
  head.lineTo(10, 0);

  head.position.x = pos_x - 18 + boom_position * 2;
  head.position.y = pos_y + 35 + boom_position / 4;
  head.endFill();
  iron_man.addChild(head);

  var head = new PIXI.Graphics();
  head.beginFill(0xFF0000);
  head.moveTo(0,0);
  head.lineTo(5, 0);
  head.lineTo(5, 80);
  head.lineTo(-5, 80);
  head.lineTo(-5, 0);

  head.position.x = pos_x + boom_position * 2;
  head.position.y = pos_y + 35 + boom_position;
  head.endFill();
  iron_man.addChild(head);

  iron_man.scale.x = 0.25;
  iron_man.scale.y = 0.25;
  
  if (this.boom_duration != 0) {
    var side = 1;
    for (var i = 0; i < 10; i++) {
      var ellipse = new PIXI.Graphics();
      ellipse.beginFill(0x0051ff);
      ellipse.drawEllipse(0,0, 20 + this.boom_duration / 10, 20 + this.boom_duration / 10);
      ellipse.alpha = 1 - this.boom_duration / BOOM_DURATION_CIRCLES;
      ellipse.position.x = pos_x + side * 70;
      ellipse.position.y = pos_y + 100;
      ellipse.scale.x = this.boom_duration / 1.2;
      ellipse.scale.y = this.boom_duration / 1.2;
      iron_man.addChild(ellipse);
      pos_x += Math.random() * 160 - 30;
      pos_y += Math.random() * 160 - 30;
      side > 0 ? side = -1 : side = 1;
    }
  }

  iron_man.rotation += Math.PI * this.boom_duration / 1000;

  return iron_man;
}

IronMan.prototype.draw = function () {
  var pos_x = 0;
  var pos_y = 0;
  var iron_man = new PIXI.Container();

  var head = new PIXI.Graphics();
  head.beginFill(0xFF3f15);
  head.moveTo(0,0);
  head.lineTo(10, 0);
  head.lineTo(20, 10);
  head.lineTo(20, 30);
  head.lineTo(10, 40);
  head.lineTo(-10, 40);
  head.lineTo(-20, 30);
  head.lineTo(-20, 10);
  head.lineTo(-10, 0);
  head.position.x = pos_x;
  head.position.y = pos_y;
  head.endFill();
  iron_man.addChild(head);

  //right arm up

  var head = new PIXI.Graphics();
  head.beginFill(0xecdc3d);
  head.moveTo(0,0);
  head.lineTo(10, 0);
  head.lineTo(15, 5);
  head.lineTo(25, 30);
  head.lineTo(20, 60);
  head.lineTo(5, 60);
  head.lineTo(0, 30);

  head.position.x = pos_x + 35;
  head.position.y = pos_y + 50;
  head.endFill();
  iron_man.addChild(head);

  //left arm up
  var head = head.clone();
  head.position.x = pos_x - 35;
  head.position.y = pos_y + 50;
  head.scale.x = -1;
  head.endFill();
  iron_man.addChild(head);

  //right arm down

  var head = new PIXI.Graphics();
  head.beginFill(0xFF0000);
  head.moveTo(5,0);
  head.lineTo(10, 0);
  head.lineTo(15, 5);
  head.lineTo(25, 30);
  head.lineTo(20, 60);
  head.lineTo(5, 60);
  head.lineTo(0, 30);


  head.position.x = pos_x + 35;
  head.position.y = pos_y + 70;
  head.endFill();
  iron_man.addChild(head);

  //left arm down
  var head = head.clone();
  head.position.x = pos_x - 35;
  head.position.y = pos_y + 70;
  head.scale.x = -1;
  head.endFill();
  iron_man.addChild(head);


  //body
  var head = new PIXI.Graphics();
  head.beginFill(0xFF3f15);
  head.moveTo(0,0);
  head.lineTo(20, 0);
  head.lineTo(45, 10);
  head.lineTo(45, 40);
  head.lineTo(25, 80);
  head.lineTo(-25, 80);
  head.lineTo(-45, 40);
  head.lineTo(-45, 10);
  head.lineTo(-20, 0);
  head.position.x = pos_x;
  head.position.y = pos_y + 35;
  head.endFill();
  iron_man.addChild(head);

  var head = new PIXI.Graphics();
  head.beginFill(0xecdc3d);
  head.moveTo(0,0);
  head.lineTo(25, 0);
  head.lineTo(25, 10);
  head.lineTo(-25, 10);
  head.lineTo(-25, 0);
  head.position.x = pos_x;
  head.position.y = pos_y + 115;
  head.endFill();
  iron_man.addChild(head);

  var head = new PIXI.Graphics();
  head.beginFill(0xFF0000);
  head.moveTo(0,0);
  head.lineTo(25, 0);
  head.lineTo(35, 20);
  head.lineTo(35, 40);
  head.lineTo(25, 70);
  head.lineTo(10, 70);
  head.lineTo(0, 40);

  head.position.x = pos_x;
  head.position.y = pos_y + 125;
  head.endFill();
  iron_man.addChild(head);

  var head = head.clone();
  head.position.x = pos_x;
  head.position.y = pos_y + 125;
  head.scale.x = -1;
  head.endFill();
  iron_man.addChild(head);

  //leg low

  var head = new PIXI.Graphics();
  head.beginFill(0xFF00000);
  head.moveTo(0,0);
  head.lineTo(25, 0);
  head.lineTo(33, 20);
  head.lineTo(33, 40);
  head.lineTo(25, 70);
  head.lineTo(10, 70);
  head.lineTo(3, 40);
  head.lineTo(3, 20);
  head.lineTo(10, 0);

  head.position.x = pos_x;
  head.position.y = pos_y + 185;
  head.endFill();
  iron_man.addChild(head);

  var head = head.clone();
  head.position.x = pos_x;
  head.position.y = pos_y + 185;
  head.scale.x = -1;
  head.endFill();
  iron_man.addChild(head);

  //foot

  var head = new PIXI.Graphics();
  head.beginFill(0xecdc3d);
  head.moveTo(0,-3);
  head.lineTo(20, -3);
  head.lineTo(23, 5);
  head.lineTo(18, 20);
  head.lineTo(5, 20);
  head.lineTo(0, 5);
  head.lineTo(5, -3);

  head.position.x = pos_x + 5;
  head.position.y = pos_y + 255;
  head.scale.y = 1.5
  head.endFill();
  iron_man.addChild(head);

  var head = head.clone();
  head.position.x = pos_x - 6;
  head.position.y = pos_y + 255;
  head.scale.x = -1;
  head.scale.y = 1.5;
  head.endFill();
  iron_man.addChild(head);

  //palm

  var head = head.clone();
  head.position.x = pos_x + 35;
  head.position.y = pos_y + 130;
  iron_man.addChild(head);

  var head = head.clone();
  head.position.x = pos_x - 60;
  head.position.y = pos_y + 130;
  iron_man.addChild(head);

  //back
  var head = new PIXI.Graphics();
  head.beginFill(0xecdc3d);
  head.moveTo(0,0);
  head.lineTo(25, 0);
  head.lineTo(35, 20);
  head.lineTo(35, 40);
  head.lineTo(25, 80);
  head.lineTo(10, 80);
  head.lineTo(0, 40);
  head.lineTo(0, 20);
  head.lineTo(10, 0);

  head.position.x = pos_x - 18;
  head.position.y = pos_y + 35;
  head.endFill();
  iron_man.addChild(head);

  var head = new PIXI.Graphics();
  head.beginFill(0xFF0000);
  head.moveTo(0,0);
  head.lineTo(5, 0);
  head.lineTo(5, 80);
  head.lineTo(-5, 80);
  head.lineTo(-5, 0);

  head.position.x = pos_x;
  head.position.y = pos_y + 35;
  head.endFill();
  iron_man.addChild(head);

  iron_man.scale.x = 0.25;
  iron_man.scale.y = 0.25;

  return iron_man;
}



