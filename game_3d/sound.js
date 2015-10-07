$(document).ready(function() {
	soundManager.onready(function() {
		soundManager.createSound({
		  id: 'iron_man',
		  url: 'sounds/iron_man.mp3',
		  autoLoad: true,
		  autoPlay: false,
		  volume: 100,
	      onfinish: function() { 
	      	soundManager.sounds.iron_man.play();
	      }
		});
		soundManager.createSound({
		  id: 'plane',
		  url: 'sounds/plane.mp3',
		  autoLoad: true,
		  autoPlay: false,
		  volume: 100,
		  onfinish:function() { 
	      	soundManager.sounds.plane.play();
	      }
		});
		soundManager.createSound({
		  id: 'main',
		  url: 'sounds/main.mp3',
		  autoLoad: true,
		  autoPlay: false,
		  volume: 100,
		  onfinish:function() { 
	      	soundManager.sounds.main.play();
	      }
		});
		soundManager.createSound({
		  id: 'shoot',
		  url: 'sounds/shoot.wav',
		  autoLoad: true,
		  autoPlay: false,
		  volume: 50
		});
		soundManager.createSound({
		  id: 'boom',
		  url: 'sounds/boom.wav',
		  autoLoad: true,
		  autoPlay: false,
		  volume: 50
		});
		soundManager.createSound({
		  id: 'hit',
		  url: 'sounds/hit.wav',
		  autoLoad: true,
		  autoPlay: false,
		  volume: 50
		});
	});
});