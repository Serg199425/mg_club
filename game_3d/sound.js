$(document).ready(function() {
	soundManager.onready(function() {
		soundManager.createSound({
		  id: 'iron_man',
		  url: 'sounds/iron_man.mp3',
		  autoLoad: true,
		  autoPlay: false,
		  volume: 50
		});
		soundManager.createSound({
		  id: 'plane',
		  url: 'sounds/plane.mp3',
		  autoLoad: true,
		  autoPlay: false,
		  volume: 50
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