// Global vars
var canvas, context, maxWidth, maxHeight, halfWidth, halfHeight;
var PI2 = Math.PI*2;

// Canvas setup
canvas = document.createElement('canvas');
context = canvas.getContext('2d');
document.body.appendChild(canvas);

var isolation = false;
var toggleButton = document.getElementById('toggle');

// Main vars that affect interaction
// a.k.a. "Social Rules"
var lovedPeople = [];
var randomPeople = [];
var crowd = 80; // Amount of random people
var user, socialDistancing, minDistance, pullRange, peopleRadius, peopleSize, mobileFlag;
var yStartOffsetPercentage = 2.14;




/////////////////////////////////////////////////////////////////
////////////////// SETUP VARIABLES /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
function setSocialRules() {
	if (maxWidth > 768) { 
		mobileFlag = false;
	} else {
		mobileFlag = true;
	}
	
	peopleRadius = maxWidth * 0.0156;
	peopleSize = peopleRadius * 2;
	socialDistancing = maxWidth * 0.312;
	minDistance = maxWidth * 0.0546;
	pullRange = maxWidth * 0.1092;
}


// Mouse update handler, functions and other helpers
function setupCanvasSize() {
	maxWidth = window.innerWidth;
	maxHeight = window.innerHeight;
	halfWidth = maxWidth / 2;
	halfHeight = maxHeight / 2;
	
	canvas.width = maxWidth;
	canvas.height = maxHeight;
}


function updateMouse(e) {
	if (e.touches) e = e.touches[0];
	mouse = {
		x: e.clientX,
		y: e.clientY
	}
}


function onResizeWindow() {
	setupCanvasSize();
	
	setSocialRules();

	rebootCharacters();
}


function rebootCharacters(){
	lovedPeople = [];
	setupLovedPeople();

	randomPeople = [];
	setupRandomPeople();
	
}


// Grid 'AFTER'
function setupLovedPeople(){
	for(var i = peopleSize; i < maxWidth; i+= socialDistancing) {
		var _counter = 0;

		for(var j = peopleSize * yStartOffsetPercentage; j < maxHeight; j+= socialDistancing * 0.5) {
			var _odd = _counter % 2;
			var _x;
			var _y = j;

			(_odd == 0) ? _x = i : _x = i + (socialDistancing / 2);

			var _chance = Math.random()*10;
			if (_chance) {
				var _person = new Particle({
					xStop: _x,
					yStop: _y
				});
				lovedPeople.push(_person);
			}

			_counter++;
		}
	}
}

// Passing by 'BEFORE'
function setupRandomPeople(){
	for(var i = 0; i < crowd; i++) {
		var _person = new Noise();
		randomPeople.push(_person)
	}
}


// Performance optimization
function throttle(fn, minDelay, scope) {
	var lastCall = 0;
	return function() {
		var now = +new Date();
		if (now - lastCall < minDelay) {
			return;
		}
		lastCall = now;
		fn.apply(scope, arguments);
	};
}

function calcHypotenuse(a, b) {
	return( Math.sqrt( (a * a) + (b * b) ) );
}


// Objects and classes
var mouse = {
	x: halfWidth,
	y: halfHeight
};

var userCharacter = function(args) {
	if(!args) args = {};
	
	this.x = halfWidth,
	this.y = halfHeight;
	this.cof = 0.1;
	this.radius = 20;
	this.width = 3;
	this.strokeColor = "#000";
	this.fillColor = "#fff";
	this.alpha = 1;
	
	this.update = function() {
		this.x += (mouse.x - this.x) * this.cof;
		this.y += (mouse.y - this.y) * this.cof;
		this.draw();
	};
	
	this.draw = function() {
		context.beginPath();
		context.globalAlpha= this.alpha;
		context.lineWidth= this.width;
		context.arc(this.x, this.y, peopleRadius, 0, PI2, false);
		context.strokeStyle = this.strokeColor;
		context.stroke();
		context.fillStyle = this.fillColor;
		context.fill();
		context.closePath();
	};
	
	this.render = function(){
		this.update();
	}
};

// Loved people: Particle class
var Particle = function(args) {
	if(!args) args = {};
	var _self= this;
	
	this.x = args.xStop;
	this.y = args.yStop;
	this.xStop = args.xStop;
	this.yStop = args.yStop;
	this.dx = 0;
	this.dy = 0;
	
	this.xMove = (Math.random() * 10) - 5;
	this.yMove = (Math.random() * 10) - 5;
	
	this.xPush = 0;
	this.yPush = 0;
	
	this.cof = 0.1;
	this.radius = 20;
	this.color = "#000";
	this.alpha = 1;
	this.update = function() {
		if (isolation) { // Line up & Repulse pull
			var _distancePullRange = calcHypotenuse( (mouse.x - this.xStop), (mouse.y - this.yStop) );
			if (_distancePullRange < pullRange) {
				// Distance
					// Per axis
					if(mobileFlag) {
						this.dx = user.x - this.x;
						if (this.dx == 0) this.dx = 1;

						this.dy = user.y - this.y;
						if (this.dy == 0) this.dy = 1;
						
					} else {
						this.dx = mouse.x - this.x;
						if (this.dx == 0) this.dx = 1;

						this.dy = mouse.y - this.y;
						if (this.dy == 0) this.dy = 1;
					}

					// Linear distance
					var _distance = calcHypotenuse(this.dx, this.dy);
					//console.log("distance: " + _distance);

				// Displacement
				var _displacement = _distance - minDistance;
				//console.log("Displacement intensity: " + _displacement + "px");

				// Angle
				var _angleRad = Math.atan2(this.dy, this.dx);
				//console.log("Repulsion angle: " + _angleRad);

				// Push & direction
				this.xPush = (Math.cos(_angleRad) * _displacement);
				this.yPush = (Math.sin(_angleRad) * _displacement);
				//console.log("_xPush: " + this.xPush + ". _yPush: " + this.yPush);


				// Apply displacement
				this.x += ( this.xStop - (this.xStop - this.xPush) ) * this.cof;
				this.y += ( this.yStop - (this.yStop - this.yPush) ) * this.cof;

			} else {
				// Place dot in its grid position
				this.x += (this.xStop - this.x) * this.cof;
				this.y += (this.yStop - this.y) * this.cof;
			}
			
		} else { // Random bouncing
			this.x += this.xMove;
			this.y += this.yMove;
			
			// Bounce when hitting canvas limits
			if(this.x > maxWidth || this.x < 0) this.xMove *= -1;
			if(this.y > maxHeight || this.y < 0) this.yMove *= -1;
		}
		
		
		this.draw();
	};
	
	this.draw = function() {
		// test shape
		/*
		context.beginPath();
		context.globalAlpha= this.alpha;
		context.arc(this.xStop, this.yStop, pullRange, 0, PI2, false);
		context.fillStyle = "#00f";
		context.fill();
		context.closePath();
		*/
		
		// interactive shape
		context.beginPath();
		context.globalAlpha= this.alpha;
		context.arc(this.x, this.y, peopleRadius, 0, PI2, false);
		//(isolation) ? context.fillStyle = onColor : context.fillStyle = offColor;
		context.fillStyle = this.color;
		context.fill();
		context.closePath();
	};
	
	this.init = function() {
		this.draw();
		//console.log("this.xStop: " + this.xStop + ". this.yStop: " + this.yStop);
	}
	
	this.render = function() {
		this.update();
	}
};

// Random people: Noise class
var Noise = function(args) {
	if(!args) args = {};
	var _self= this;
	
	this.x = Math.random() * maxWidth;
	this.y = Math.random() * maxHeight;
	this.xStop = halfWidth;
	this.yStop = 0 - peopleSize;
	//this.yStop = halfHeight; // Happy accident
	
	this.xMove = (Math.random() * 6) - 3;
	this.yMove = (Math.random() * 6) - 3;
	
	this.cof = 0.1;
	this.radius = 20;
	this.color = "#000";
	this.alpha = 1;
	this.update = function() {
		if (isolation) { // Line up
			// Place dot in its grid position
			this.x += (this.xStop - this.x) * this.cof;
			this.y += (this.yStop - this.y) * this.cof;
			
		} else { // Random movement
			this.x += this.xMove;
			this.y += this.yMove;
			
			// Insert in the opposite side again when surpassed canvas limits
			if(this.x > maxWidth + peopleSize ) {
				this.x = -peopleRadius;
			} else if(this.x < -peopleSize ) {
				this.x = maxWidth + peopleRadius;
			}
			
			if(this.y > maxHeight + peopleSize ) {
				this.y = -peopleRadius;
			} else if(this.y < -peopleSize ) {
				this.y = maxHeight + peopleRadius;
			}
		}
		
		
		this.draw();
	};
	
	this.draw = function() {
		// test shape
		/*
		context.beginPath();
		context.globalAlpha= this.alpha;
		context.arc(this.xStop, this.yStop, this.radius, 0, PI2, false);
		context.fillStyle = "#00f";
		context.fill();
		context.closePath();
		*/
		
		// interactive shape
		context.beginPath();
		context.globalAlpha= this.alpha;
		context.arc(this.x, this.y, peopleRadius, 0, PI2, false);
		//(isolation) ? context.fillStyle = onColor : context.fillStyle = offColor;
		context.fillStyle = this.color;
		context.fill();
		context.closePath();
	};
	
	this.init = function() {
		this.draw();
		//console.log("this.xStop: " + this.xStop + ". this.yStop: " + this.yStop);
	}
	
	this.render = function(){
		this.update();
	}
};



IS.create({
	// app.init()
	onInit: ({author, title, width, height, state,}) => {
		// console.log("api onInit");

		setSocialRules();
		
		mouse.x = halfWidth;
		mouse.y = halfHeight;


		// Custom listeners 
			// Touch events
			document.addEventListener('touchstart', updateMouse.bind(this), false);
			document.addEventListener('touchmove', throttle(updateMouse.bind(this), 50), false);


		// Create User cursor
		user = new userCharacter();

		// Passing by 'BEFORE'
		// Grid 'AFTER'
		rebootCharacters();
	},

	onChangeState: (state) => {
		(state) ? isolation = true : isolation = false;
	},

	onResize: ({width, height,}) => {
		onResizeWindow();
	},

	// RAF
	onTick: ({x, y, width, height, isPointerInside, state, timestamp,}) => {
		// Clear canvas
		context.clearRect(0, 0, maxWidth, maxHeight);
		context.fillStyle = "#fff";
		context.fillRect(0, 0, maxWidth, maxHeight);

		// Update mouse position
		mouse = {
			x: x,
			y: y
		};


		// Animate particles that will be aligned
		for(var i = 0; i < lovedPeople.length; i++) {
			lovedPeople[i].render();
		}

		// Animate particles that leave the screen
		for(var i = 0; i < randomPeople.length; i++) {
			randomPeople[i].render();
		}

		// Animate user
		user.render();
	}
})