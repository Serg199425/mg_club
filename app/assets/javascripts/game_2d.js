$(document).ready(function() {
  renderer = new PIXI.CanvasRenderer(window.innerWidth - 100, window.innerHeight - 100);

  document.body.appendChild(renderer.view);

  stage = new PIXI.Stage;

  pos_x = window.innerWidth / 2 - 150;
  pos_y = window.innerHeight / 2 - 150;
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


function draw_plane(pos_x, pos_y) {

  var ellipse = new PIXI.Graphics();
  ellipse.beginFill(0xFFFF00);
  ellipse.drawEllipse(0,0, 40, 10);
  ellipse.position.x = pos_x + 80;
  ellipse.position.y = pos_y - 5;
  stage.addChild(ellipse);

  var graphics3 = new PIXI.Graphics();
  graphics3.beginFill(0x0000FF);
  graphics3.moveTo(0,0);
  graphics3.lineTo(50, 0);
  graphics3.lineTo(50, -70);
  graphics3.position.x = pos_x + 200;
  graphics3.position.y = pos_y;
  graphics3.endFill();
  stage.addChild(graphics3);

  var graphics4 = new PIXI.Graphics();
  graphics4.beginFill(0x000FFF);
  graphics4.moveTo(0,0);
  graphics4.lineTo(0, 20);
  graphics4.lineTo(20, 15);
  graphics4.lineTo(20, 5);
  graphics4.position.x = pos_x + 250;
  graphics4.position.y = pos_y - 7;
  graphics4.endFill();
  stage.addChild(graphics4);


  var graphics1 = new PIXI.Graphics();
  graphics1.beginFill(0x00FF00);
  graphics1.moveTo(0,0);
  graphics1.lineTo(250, 20);
  graphics1.lineTo(250, -20);
  graphics1.position.x = pos_x;
  graphics1.position.y = pos_y;
  graphics1.endFill();
  stage.addChild(graphics1);

  var graphics2 = new PIXI.Graphics();
  graphics2.beginFill(0xFF0000);
  graphics2.moveTo(0,0);
  graphics2.lineTo(150, 0);
  graphics2.lineTo(250, 30);
  graphics2.position.x = pos_x + 50;
  graphics2.position.y = pos_y;
  graphics2.endFill();
  stage.addChild(graphics2);
}


function update_position() {
  pos_x += speed_x;
  pos_y += speed_y;
}

$(document).on('keydown', function(e) {

  switch(e.keyCode) {
    case 37:
      speed_x = -5;
      break;
    case 38:
      speed_y = -3;
      break;
    case 39:
      speed_x = 5;
      break;
    case 40:
      speed_y = 3;
      break;
    default:
      return;
  }
});

interval = setInterval(render, 10);
interval = setInterval(update_position, 30);



