$(document).ready(function() {
  renderer = new PIXI.CanvasRenderer(window.innerWidth - 100, window.innerHeight - 100);
  renderer.backgroundColor = 0x00DDFF;

  document.body.appendChild(renderer.view);

  stage = new PIXI.Stage;

  pos_x = window.innerWidth - 500;
  pos_y = window.innerHeight / 2 - 150;
  rotation = 0;

  speed_x = 0;
  speed_y = 0;

  draw_plane(pos_x, pos_y);

  render(stage);
});


function render() { 
  renderer.render(stage);
  for (var i = stage.children.length - 1; i >= 0; i--)
    stage.removeChild(stage.children[i]);
  draw_plane(pos_x, pos_y);
}

var flag = true;

function draw_plane(pos_x, pos_y) {

  if (flag) {
    var fire = new PIXI.Graphics();
    fire.lineStyle(5, 0xFF0000);
    fire.beginFill(0xFF9108);
    fire.moveTo(0,0);
    fire.lineTo(50, 20);
    fire.lineTo(40, 8);
    fire.lineTo(100, 25);
    fire.lineTo(80, 0);
    fire.lineTo(90, -25);
    fire.lineTo(40, -8);
    fire.lineTo(50, -20);
    fire.position.x = pos_x + 260;
    fire.position.y = pos_y + 3;
    fire.endFill();
    fire.rotation = rotation;
    stage.addChild(fire);
    flag = false;
  } else {
    var fire = new PIXI.Graphics();
    fire.lineStyle(5, 0xFF0000);
    fire.beginFill(0xFF9108);
    fire.moveTo(0,0);
    fire.lineTo(50, 25);
    fire.lineTo(40, 12);
    fire.lineTo(90, 30);
    fire.lineTo(85, 0);
    fire.lineTo(100, -30);
    fire.lineTo(40, -12);
    fire.lineTo(50, -25);
    fire.position.x = pos_x + 260;
    fire.position.y = pos_y + 3;
    fire.rotation = rotation;
    fire.endFill();
    stage.addChild(fire);
    flag = true;
  }


  var ellipse = new PIXI.Graphics();
  ellipse.beginFill(0x00AAFF);
  ellipse.drawEllipse(0,0, 40, 10);
  ellipse.position.x = pos_x + 80;
  ellipse.position.y = pos_y - 5;
  stage.addChild(ellipse);

  var fire_source = new PIXI.Graphics();
  fire_source.beginFill(0xC4C4C4);
  fire_source.moveTo(0,0);
  fire_source.lineTo(0, 20);
  fire_source.lineTo(20, 15);
  fire_source.lineTo(20, 5);
  fire_source.position.x = pos_x + 250;
  fire_source.position.y = pos_y - 7;
  fire_source.rotation = rotation
  fire_source.endFill();
  stage.addChild(fire_source);


  var body = new PIXI.Graphics();
  body.beginFill(0xA0A0A0);
  body.moveTo(0,0);
  body.lineTo(250, 20);
  body.lineTo(250, -20);
  body.position.x = pos_x;
  body.position.y = pos_y;
  body.endFill();
  stage.addChild(body);

  var tail = new PIXI.Graphics();
  tail.beginFill(0xC0C0C0);
  tail.moveTo(0,0);
  tail.lineTo(50, 5);
  tail.lineTo(50, -40);
  tail.lineTo(30, -40);
  tail.position.x = pos_x + 200;
  tail.position.y = pos_y - 15;
  tail.endFill();
  stage.addChild(tail);

  var wing = new PIXI.Graphics();
  wing.beginFill(0xC0C0C0);
  wing.moveTo(0,0);
  wing.lineTo(150, 0);
  wing.lineTo(250, 25);
  wing.lineTo(180, 25);
  wing.position.x = pos_x + 50;
  wing.position.y = pos_y;
  wing.rotation = rotation
  wing.endFill();
  stage.addChild(wing);
}


function update_position() {
  if (direction < 0) {
    speed_y > -6 ? speed_y -= 2 : speed_y = -6;
    rotation = Math.PI / 100;
    direction = 0;
  } else {
    if (direction > 0) {
      speed_y < 6 ? speed_y += 2 : speed_y = 6;
      direction = 0;
      rotation = -Math.PI / 100;
    }
  }

  if (speed_y == 0)
    rotation = 0;
  pos_y += speed_y;
}

$(document).on('keydown', function(e) {

  switch(e.keyCode) {
    case 38: 
      direction = -1;
      break;
    case 40:
      direction = 1; 
    default: return;
  }
});

interval = setInterval(render, 10);
interval = setInterval(update_position, 30);



