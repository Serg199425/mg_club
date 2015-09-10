$(document).ready(function() {
  renderer = new PIXI.CanvasRenderer(window.innerWidth - 100, window.innerHeight - 100);
  renderer.backgroundColor = 0x00DDFF;

  document.body.appendChild(renderer.view);

  pos_x = window.innerWidth / 2;
  pos_y = window.innerHeight / 2 + 80;
  rotation = 0;

  speed_x = 0;
  speed_y = 0;

  planes = [draw_plane(0, 0, 0), draw_plane(0, 0, 1)]
});

var MAX_SPEED_X = 10;
var SPEED_UP_STEP = 2;
var direction = 0;
var planes_index = 0;


function render() {
  var current_plane = planes[planes_index];
  current_plane.position.x = pos_x;
  current_plane.position.y = pos_y;
  current_plane.rotation = rotation;
  planes_index == 0 ? planes_index = 1 : planes_index = 0;
  renderer.render(current_plane);
}

function draw_plane(pos_x, pos_y, variant) {
  var plane = new PIXI.DisplayObjectContainer();
  if (variant == 0) {
    var fire = new PIXI.Graphics();
    fire.lineStyle(5, 0xFF0000);
    fire.beginFill(0xFF9108);
    fire.moveTo(0,0);
    fire.lineTo(50, 20);
    fire.lineTo(40, 12);
    fire.lineTo(100, 35);
    fire.lineTo(80, 0);
    fire.lineTo(90, -25);
    fire.lineTo(40, -8);
    fire.lineTo(50, -20);
    fire.position.x = pos_x + 1;
    fire.position.y = pos_y + 280;
    fire.endFill();
    fire.rotation = Math.PI / 2;
    plane.addChild(fire);
    flag = false;
  } else {
    var fire = new PIXI.Graphics();
    fire.lineStyle(5, 0xFF0000);
    fire.beginFill(0xFF9108);
    fire.moveTo(0,0);
    fire.lineTo(50, 20);
    fire.lineTo(40, 8);
    fire.lineTo(90, 25);
    fire.lineTo(80, 0);
    fire.lineTo(100, -35);
    fire.lineTo(40, -12);
    fire.lineTo(50, -20);
    fire.position.x = pos_x - 1;
    fire.position.y = pos_y + 280;
    fire.endFill();
    fire.rotation = rotation + Math.PI / 2;
    plane.addChild(fire);
    flag = true;
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
  star.position.y = pos_y + 175;
  star.scale.x = 0.6
  star.scale.y = 0.6
  star.endFill();

  plane.addChild(star);

  var star = star.clone();
  star.scale.x = 0.6
  star.scale.y = 0.6
  star.position.x = pos_x + 70;
  star.position.y = pos_y + 175;
  plane.addChild(star);

  plane.scale.x = 0.6;
  plane.scale.y = 0.8;
  return plane;
}

function draw_iron_man() {
  
}


function update_position() {
  if (direction != 0) {
    Math.abs(speed_x) < MAX_SPEED_X ? speed_x += direction * SPEED_UP_STEP : speed_x = direction * MAX_SPEED_X;
  } else {
      if (speed_x !=0)
        speed_x > 0 ? speed_x -= SPEED_UP_STEP / 2 : speed_x += SPEED_UP_STEP / 2
  }
  direction = 0;
  pos_x += speed_x;
}

$(document).on('keydown', function(e) {

  switch(e.keyCode) {
    case 37: 
      direction = -1;
      break;
    case 39:
      direction = 1; 
    default: return;
  }
});

interval = setInterval(render, 10);
interval = setInterval(update_position, 30);



