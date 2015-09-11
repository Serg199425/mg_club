$(document).ready(function() {
  renderer = new PIXI.CanvasRenderer(window.innerWidth - 20, window.innerHeight - 20);
  renderer.backgroundColor = 0x00DDFF;

  document.body.appendChild(renderer.view);

  width = window.innerWidth - 20;
  height = window.innerHeight - 20;
  rotation = 0;

  speed_x = 0;
  speed_y = 0;

  plane = new Plane(width / 2, height - 250 );
  iron_man = new IronMan(width / 2, 20);

  interval = setInterval(render, 10);
});

var LEFT_BORDER = 60;
var RIGHT_BORDER = window.innerWidth - 80;
var UP_BORDER = 0;
var MAX_SPEED_X = 10;
var SPEED_UP_STEP = 2;
var BULLET_SPEED_Y = 10;
var BOOM_SPEED = 20;
var BOOM_DURATION_CIRCLES = 100;

function render() {
  var scene = new PIXI.Container();
  plane.move();
  iron_man.check_collision(plane.bullets);
  scene.addChild(iron_man.get_model());
  for (var i = 0; i < plane.bullets.length; i++ )
    scene.addChild(plane.bullets[i].get_model());
  scene.addChild(plane.get_fire());
  scene.addChild(plane.get_model());
  renderer.render(scene);
  delete scene;
}

$(document).on('keydown', function(e) {

  switch(e.keyCode) {
    case 37: 
      plane.change_speed(-1);
      break;
    case 39:
      plane.change_speed(1);
      break;
    case 0:
      plane.shoot();
      break;
    case 32:
      plane.shoot();
      break;
    default: return;
  }
});

function Plane (pos_x, pos_y) {
  this.pos_x = pos_x;
  this.pos_y = pos_y;
  this.rotation = 0;
  this.speed_x = 0;
  this.model_index = 0;
  this.models = [this.draw(), this.draw_in_motion()];
  this.fire_models = this.draw_fire();
  this.fire_model_index = 0;
  this.bullets = [];
}

Plane.prototype.get_model = function() {
  // this.model_index == 0 ? this.model_index = 1 : this.model_index = 0;
  this.speed_x == 0 ? this.model_index = 0: this.model_index = 1;
  var model = this.models[this.model_index];
  model.position.x = this.pos_x;
  model.position.y = this.pos_y;
  model.rotation = this.rotation;
  if (this.speed_x > 0) 
    model.scale.x = - 0.6;
  else
    model.scale.x = 0.6; 
  return model;
}

Plane.prototype.get_fire = function() {
  this.fire_model_index == 0 ? this.fire_model_index = 1 : this.fire_model_index = 0;
  this.fire_models[this.fire_model_index].position.x = this.pos_x;
  this.fire_models[this.fire_model_index].position.y = this.pos_y + 170;
  return this.fire_models[this.fire_model_index];
}

Plane.prototype.move = function() {
  this.update_position();
  this.update_bullets_position();
}

Plane.prototype.change_speed = function(direction) {
  this.direction = direction;
  this.speed_x += this.direction * SPEED_UP_STEP
  if (Math.abs(this.speed_x) > MAX_SPEED_X)
    this.speed_x = this.direction * MAX_SPEED_X;
}

Plane.prototype.shoot = function() {
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
      this.bullets.splice(i,i);
    }
  }
}

function IronMan(pos_x, pos_y) {
  this.pos_x = pos_x;
  this.pos_y = pos_y;
  this.model = this.draw();
  this.boom_model = this.boom_draw();
  this.boom_duration = 0;
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
    if (bullets[i].pos_x <= this.pos_x + 20 &&
        bullets[i].pos_x >= this.pos_x - 20 &&
        bullets[i].pos_y < UP_BORDER + 50)
      this.boom_duration += 1;
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
  return this.pos_y < UP_BORDER ? false : true;
}

Bullet.prototype.get_model = function() {
  this.model_index == 0 ? this.model_index = 1 : this.model_index = 0;
  this.models[this.model_index].position.x = this.pos_x;
  this.models[this.model_index].position.y = this.pos_y;
  return this.models[this.model_index];
}

Bullet.prototype.draw = function(variant) {
  var pos_x = 0;
  var pos_y = 0;
  var plane = new PIXI.Container();
  if (variant == 0) {
    var fire = new PIXI.Graphics();
    fire.lineStyle(5, 0xFF0000);
    fire.beginFill(0xFF9108);
    fire.moveTo(0,0);
    fire.lineTo(60, 20);
    fire.lineTo(40, 12);
    fire.lineTo(110, 35);
    fire.lineTo(80, 0);
    fire.lineTo(90, -25);
    fire.lineTo(40, -8);
    fire.lineTo(50, -20);
    fire.position.x = pos_x + 1;
    fire.position.y = pos_y + 200;
    fire.endFill();
    fire.scale.y = 1.5;
    fire.rotation = Math.PI / 2;
    plane.addChild(fire);
  } else {
    var fire = new PIXI.Graphics();
    fire.lineStyle(5, 0xFF0000);
    fire.beginFill(0xFF9108);
    fire.moveTo(0,0);
    fire.lineTo(50, 20);
    fire.lineTo(40, 8);
    fire.lineTo(90, 25);
    fire.lineTo(80, 0);
    fire.lineTo(110, -35);
    fire.lineTo(40, -12);
    fire.lineTo(60, -20);
    fire.position.x = pos_x - 1;
    fire.position.y = pos_y + 200;
    fire.scale.y = 1.5;
    fire.endFill();
    fire.rotation = rotation + Math.PI / 2;
    plane.addChild(fire);
  }

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

  plane.scale.x = 0.15;
  plane.scale.y = 0.15;

  return plane;
}

Plane.prototype.draw_fire = function(variant) {
  var pos_x = 0;
  var pos_y = 0;
  var fire1 = new PIXI.Graphics();
  fire1.lineStyle(5, 0xFF0000);
  fire1.beginFill(0xFF9108);
  fire1.moveTo(0,0);
  fire1.lineTo(60, 20);
  fire1.lineTo(40, 12);
  fire1.lineTo(110, 35);
  fire1.lineTo(80, 0);
  fire1.lineTo(90, -25);
  fire1.lineTo(40, -8);
  fire1.lineTo(50, -20);
  fire1.position.x = pos_x + 1;
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
  fire2.position.x = pos_x - 1;
  fire2.position.y = pos_y + 280;
  fire2.endFill();
  fire2.rotation = rotation + Math.PI / 2;

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
  ellipse.beginFill(0x00AAFF);
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

  // var star = new PIXI.Graphics();
  // star.beginFill(0xFF0000);
  // star.moveTo(0,0);
  // star.lineTo(10, 20);
  // star.lineTo(35, 20);
  // star.lineTo(15, 30);
  // star.lineTo(25, 50);
  // star.lineTo(0, 35);
  // star.lineTo(-25, 50);
  // star.lineTo(-15, 30);
  // star.lineTo(-35, 20);
  // star.lineTo(-10, 20);
  // star.position.x = pos_x - 65;
  // star.position.y = pos_y + 185;
  // star.scale.x = 0.55
  // star.scale.y = 0.55
  // star.endFill();

  // plane.addChild(star);

  // var star = star.clone();
  // star.scale.x = 0.55
  // star.scale.y = 0.55
  // star.position.x = pos_x + 70;
  // star.position.y = pos_y + 185;
  // plane.addChild(star);

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
  ellipse.beginFill(0x00AAFF);
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

  // var star = new PIXI.Graphics();
  // star.beginFill(0xFF0000);
  // star.moveTo(0,0);
  // star.lineTo(10, 20);
  // star.lineTo(35, 20);
  // star.lineTo(15, 30);
  // star.lineTo(25, 50);
  // star.lineTo(0, 35);
  // star.lineTo(-25, 50);
  // star.lineTo(-15, 30);
  // star.lineTo(-35, 20);
  // star.lineTo(-10, 20);
  // star.position.x = pos_x - 70;
  // star.position.y = pos_y + 175;
  // star.scale.x = 0.6
  // star.scale.y = 0.6
  // star.endFill();

  // plane.addChild(star);

  // var star = star.clone();
  // star.scale.x = 0.6
  // star.scale.y = 0.6
  // star.position.x = pos_x + 70;
  // star.position.y = pos_y + 175;
  // plane.addChild(star);

  plane.scale.x = 0.4;
  plane.scale.y = 0.6;
  return plane;
}

IronMan.prototype.boom_draw = function() {
  var pos_x = 0;
  var pos_y = 5.5 * this.boom_duration;
  var plane = new PIXI.Container();
  var star = new PIXI.Graphics();
  star.beginFill(0xFF9108);
  star.lineStyle(5, 0xFF0000);
  star.moveTo(0,0);
  star.lineTo(15, 20);
  star.lineTo(35, 15);
  star.lineTo(30, 30);
  star.lineTo(55, 50);
  star.lineTo(20, 45);
  star.lineTo(-5, 60);
  star.lineTo(-10, 40);
  star.lineTo(-35, 20);
  star.lineTo(-10, 15);
  star.scale.x = 1 + this.boom_duration / 90;
  star.scale.y = 1 + this.boom_duration / 90;
  star.position.y = pos_y;
  star.endFill();

  plane.addChild(star);

  return plane;
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



