$(document).ready(function() {

// SET VARIABLES -------------------------------------------------------------------------- //
// [ 0=name 1=waveMinSize 2=waveMaxSize 3=hitPoints 4=moveSpeed 5=flying ]
var creatureType = [
	["Scout Ship", 13,  15,  8,   2, 0],
	["Steam Ship",  8,  10, 13, 1.7, 0],
	["War Ship",    3,   4, 35, 1.5, 0],
	["Fire Bat",   14,  16, 10,   3, 1],
	["Gryphon",    10,  13, 18, 2.5, 1],
	["Sea Dragon",  1,   1, 60,   1, 1]
	];

// [ 0=name 1=fireInterval 2=groundDamage 3=flyingDamage 4=range 5=cost 6=sellCost] + 2 Upgrades
var towerType = [
	["Archer",   30,  2,   6, 50,  80, 40,   "CrossBow",   30,  1,   1, 50,  80, 40,      "Sniper",   30,  1,   1, 50,  80, 40 ],
	["Cannon",   50,  6,   0, 50, 100, 40, "MegaCannon",   50,  7,   0, 50, 100, 40, "UltraCannon",   50,  7,   0, 50, 100, 40 ],
	[  "Mage",  150, 13,   7, 60, 120, 40,     "Wizard",  150, 15,  10, 50, 120, 40,     "Sorcery",  150, 15,  10, 50, 120, 40 ],
	[ "Storm",   50, 70,  70, 50,  80, 40,  "Whirlwind",   50, 75,  75, 50,  80, 40,     "Cyclone",   50,100, 100, 50,  80, 40 ]
	];	

// MAP 2D ARRAYS ---------------------------------------------------------------------------- //
// Mission Setup 2D Aray.
// [ 0=cannonMaxUpgrade 1=archerMaxUpgrade 2=mageMaxUpgrade 3=cycloneMaxUpgrade 4=coins 5=hearts 6=mapDifficulty 7=mapName ]
var missionSetup = [];
	
// Creature Move 2D array. Each creature is loaded based on the creatureWave array and 
// assigned a route from the routePath and routeStart arrays before the map play begins.
// [ 0=route#     1=total_paths  2=current_path    3=distance         4=direction   5=howFarWalked  6=positionX
//   7=positionY  8=type         9=hitPointsLeft  10=totalHitPoints  11=moveSpeed  12=flying        13=name ]
var creatureMove = [];	
	
// Route Paths 2D array. This stores all routes which the creatures can walk along. 
// For each route there are series of Paths each with two values: [ 0=distance(in pixels)  1=direction ]
// Directions are: 0=up, 1=right, 2=down, 3=left
var routePath = [];
	
// Route Starting points 2D array. [ 0=beginX  1=beginY ]
var routeStart = [];

// Creature Wave 2D array. Each wave is planned in advance. 
// [ 0=CreatureType  1=WaveSize  2=density  3=secondsBeforeNextWave ] 
var creatureWave = [];

// Towers 2D array. If Type == -1 then there is no tower at that location,
// but the player can activate towers at these locations during the game.
// [ 0=positionX  1=positionY  2=Type  3=currentUpgradeLevel  4=Direction 5=firing? 6=fireInterval 7=groundDamage 8=flyingDamage ]
var towers = [];

// OTHER GAME VARIABLES ---------------------------------------------------------------------- //
// Tower selected array. Stores tower info when a tower is selected.
var towerSelected = [];
var sel = -1;

// Plot values for drawing the red "x" on top of the Tower SELECT buttons if the player has insufficient funds.  
// [ [x-values 0-3, last x-value is for OPTION:Upgrade] [y-values 0-3, last y-value is for OPTION:Upgrade] ]  
// 0=SELECT:archer 1=SELECT:cannon 2=SELECT:mage 3=SELECT:storm 4=OPTION:Upgrade
var plotRedX = [ [-60, 20, -60, 20, -18], [-58, -58, 19, 19, -58] ];
	
// Hit List 2D array. Keeps track of hit animations whenever a tower hits a creature. 
// [ 0=originX 1=originY 2=targetX 3=targetY 4=towerType 5=currentFrame 6=totalFrames 7=whichTowerIsFiring 8=whichCreature]
var hitList = [];
	 
// Variables to calculate the distance between two coordinates (for towers)
var distance;
var distance_x;
var distance_y;

// hit animation temp variables
var position = 0;
var hitX = 0;
var hitY = 0;

// Convert degrees to radians
var TO_RADIANS = Math.PI / 180;

// For storing any temp. random numbers
var rand = 0;
// Temp array for route
var newRoute = [];

// Frame counter. Resets every 60 frames
var frame = 0;

// Keeps track of which animation sprite is being drawn
var animSprite = 0;

// Temp. parameter variables for loading creatureMove and hitList arrays
var cr0 = cr1 = cr2 = cr3 = cr4 = cr5 = cr6 = cr7 = cr8 = cr9 = cr10 = cr11 = cr12 = cr13 = cr14 = cr15 = 0;
var type = 0;
var distDir = [];

// Keeps track of the last route deployed in addWave()
var lastRoute = 0;

// The "deployed" variable is set to 1 whenever we bring a creature on-screen; 
// Only one creature comes on-screen in a given frame.
var deployed = 0;
// frame-counting variable to keep creatures spaced out.
var creatureDensity = 0;

// Mouse event X and Y positions.
var clickedX = 0;
var clickedY = 0;

// Records how much damage the tower can do to the creature, flying or not
var damage = 0;

// Counter for the number of seconds since the last creature wave was deployed
var nextWave = 0;
// Counts the number of waves total
var wave = 0;

// Game Setup Variables
var map = 1;
var hearts = 0;
var coins = 0;

// Used for drawing numbers as images on the screen
var numString = [];
var digit = 0;

// These are for tracking the tower's hitAnimation end point 
// (anticipating where the creature will be when the shot hits)
var toEndOfPath = 0;
var trackAhead = 0;
var aroundTheCorner = 0;

// Game Mode can be "play", "pause", "settings" or "defeated"
var gameMode = "";
// Setup Mode is at the begining of the game but before creature waves begin.
// Can be "true" or "false"
var setupMode = "";

// Canvas scale
var scale = 1;

var offsetLeft = 0;
var offsetTop = 0;
var font = "";
var bgkSize = "";

// Create Sound Effects Containers & Timers
var arrowFireAudio  = document.createElement('audio');
var cannonFireAudio = document.createElement('audio');
var magicFireAudio  = document.createElement('audio');
var windFireAudio   = document.createElement('audio');
var arrowFireTimer  = 0;
var cannonFireTimer = 0;
var magicFireTimer  = 0;
var windFireTimer   = 0;
// Background Music
var myAudio = new Audio('sound/NowOrNever.mp3');

// Loop the background Music
$(myAudio).bind('ended', function()  {
    myAudio.currentTime = 0;
    myAudio.play();
});

// Play the background Music
myAudio.play();

// Initialize Sound Effects
arrowFireAudio.setAttribute('src', 'sound/Arrow_Swoosh.mp3');
cannonFireAudio.setAttribute('src', 'sound/cannon_x.mp3');
magicFireAudio.setAttribute('src', 'sound/Fireball.mp3');
windFireAudio.setAttribute('src', 'sound/windAtk.mp3');

// Scale Canvas Function
function scaleCanvas() {
	// get scale value - canvas to window
	var newScale = 1;
	var scaleTest = 1;
	if ($(window).innerWidth() < 1300) {
	newScale = $(window).innerWidth() / 1300;
	}
	if ($(window).innerHeight() < 700) {
		scaleTest = $(window).innerHeight() / 700;
	}
	if (scaleTest < newScale) {
		newScale = scaleTest;
	}
	// calculate the canvas scale AS A PERCENTAGE of the currewnt scale
	// (.scale always considers the current canvas scale to be '1' even if it was scaled already)
	var canvasScale = newScale / scale;
	// Scale canvas
	context.scale(canvasScale, canvasScale);
	// Update current scale
	scale = newScale;
	// Scale CSS elements
	$("#pause").css       ( {width:  385 * scale, height: 177 * scale, top:  262 * scale, left: 458 * scale} );
	$("#settings").css    ( {width:  385 * scale, height: 538 * scale, top: -550 * scale, left: 458 * scale} );
	$("#defeated").css    ( {width:  385 * scale, height: 477 * scale, top: -550 * scale, left: 458 * scale} );
	$("#nextmission").css ( {width:  478 * scale, height: 667 * scale, top: -700 * scale, left: 407 * scale} );
	font = (1.6 * scale) + "em";
	$("#score").css       ( {width:  307 * scale, height:  51 * scale, top:   84 * scale, left:  85 * scale} );
	$("#mission-ID").css  ( {width:  478 * scale, height:  60 * scale, top:  145 * scale, fontSize: font} );
	font = (2.4 * scale) + "em";
	$("#mission-name").css( {width:  478 * scale, height:  60 * scale, top:  170 * scale, fontSize: font} );
	font = (1.5 * scale) + "em";
	$("#mission-up").css  ( {width:  478 * scale, height:  60 * scale, top:  262 * scale, fontSize: font} );
	$("#mission-up0").css ( { left:  102 * scale} );
	$("#mission-up1").css ( { left:  182 * scale} );
	$("#mission-up2").css ( { left:  262 * scale} );
	$("#mission-up3").css ( { left:  342 * scale} );
	$("#content").css     ( {width: 1300 * scale, height: 700 * scale} );
	$("#shadow").css      ( {width: 1300 * scale, height: 700 * scale} );
	$("#new").css         ( {width: 1300 * scale, height: 700 * scale} );
	$("#site-div").css    ( {width: 1300 * scale, height: 700 * scale} );
	// Set offset variables for calculating event handler positions
	offsetLeft = $("#canvas").offset().left;
	offsetTop  = $("#canvas").offset().top;
	// Draw background at new scale
	context.drawImage(mapImage, 0, 0);
}


// CREATE CANVAS ----------------------------------------------------------------------------- //
var canvas = $("#canvas")[0];
if (canvas.getContext) {
	var context = canvas.getContext("2d");
	canvas.setAttribute('width', '1300');
	canvas.setAttribute('height', '700');
	// Initialize Background Map Object Container
	var mapImage = new Image();
	// Load spritesheet
	var spritesheet = new Image();
	spritesheet.src="images/spritesheet2.png";
	scaleCanvas();
} else {
	// Browser doesn't support CANVAS
}
// For some reason we have to scale it twice initially to eliminate padding.
scaleCanvas();

// Recalculate offsewt id window is resize after game starts. This keeps 
$(window).resize(function () {
	scaleCanvas();
	switch (gameMode) {
		case 'settings':
			$("#settings").animate( {top: 81 * scale}, 300);
			break;
		case 'nextmission':
			$("#nextmission").animate( {top: 10 * scale}, 300);
			break;
		case 'defeated':
			$("#defeated").animate( {top: 112 * scale}, 300);
			break;
		default:
			// Do nothing
			break;
	}
});

// CREATE FRAME TIMER ----------------------------------------------------------------------- //
// Create frame timer for all browsers, with fallback to setTimeout
// if requestAnimationFrame is not supported by the browser. 60 frames per second. 
window.requestframe = function() {
    return function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
}();

// INITIALIZE GAME -------------------------------------------------------------------------- //
// This starts the game at 60 fps and initalizes the game loop
function runGame() {
	requestframe( runGame );
	if (gameMode == "play") {
		// Run gameLoop()
		gameLoop();
	} else {
		// Wait For playClick(), settingsClick(), pauseClick() or defeatedClick() mouse event
	}
}

// EVENT LISTENERS --------------------------------------------------------------------------- //
// In-game Canvas Event Listener
function canvasClick(e) {
	// We just record the mouse positions; in the runGame loop we check these values 
	clickedX = (e.pageX - offsetLeft) / scale;
	clickedY = (e.pageY - offsetTop) / scale;
};

// Play Screen Event Listener
function playClick(e) {
	// Did the player click "PLAY"?
	clickedX = (e.pageX - offsetLeft) / scale;
	clickedY = (e.pageY - offsetTop) / scale;
	if (clickedX > 467 && clickedX < 815 && clickedY > 433 && clickedY < 578) {
		// Restore event listeners & CSS
		$("#new").hide();
		$("#new").off();
		// Load the map arrays.
		map = 1;
		loadMap(map);
		// Set "Next Mission" event listeners & CSS
		$("#shadow").show();
		$("#nextmission").css( {backgroundImage: "url(images/newgame.png)"} );
		$("#score").hide();
		$("#nextmission").animate( {top: 10 * scale}, 300);
		$("#nextmission").on("click", nextMissionClick);
		// Set up Mission Display Text Boxes
		if (map == 1) {
			$("#mission-ID").html("FIRST MISSION");
		} else {
			$("#mission-ID").html("NEXT MISSION: " + map);
		}
		$("#mission-name").html("\"" + missionSetup[7] + "\"");
		$("#mission-up0").html("+" + missionSetup[0]);
		$("#mission-up1").html("+" + missionSetup[1]);
		$("#mission-up2").html("+" + missionSetup[2]);
		$("#mission-up3").html("+" + missionSetup[3]);
		// Mode Settings
		gameMode = "nextmission";
		setupMode = "true";
	}
};

// Pause-game Event Listener
function pauseClick(e) {
	// Un-pause the game
	$("#shadow").hide();
	$("#pause").hide();			
	$("#pause").off();
	$("#canvas").on("click", canvasClick);
	// Mode Settings
	gameMode = "play";
};

// Settings Menu Event Listener
function settingsClick(e) {
	// Did the player click "Restart"?
	clickedY = (e.pageY - offsetTop) / scale;
	if (clickedY > 473) {
		// Restore event listeners & CSS
		$("#shadow").hide();
		$("#settings").animate( {top: -550 * scale}, 200 );
		$("#settings").off();
		$("#canvas").on("click", canvasClick);
		// Load the map arrays.
		loadMap(map);
		// Mode Settings
		gameMode = "play";
		setupMode = "true";
	// Did the player click "Quit"?
	} else if (clickedY > 333) {
		// Yes - go to "new game" screen
		// Restore event listeners & CSS
		$("#shadow").hide();
		$("#settings").css( {top: -550 * scale}, 200 );
		$("#settings").off();
		// Start "Play" screen event listener
		$("#new").show();
		$("#new").on("click", playClick);
		// Load the map arrays.
		loadMap(map);
		// Mode Settings
		gameMode = "new";
		setupMode = "true";
	// Did the player click "Resume"?
	} else if (clickedY > 193) {	
		// Yes - Unpause
		// Turn of settings event listener
		$("#shadow").hide();
		$("#settings").css( {top: -550 * scale} );
		$("#settings").off();
		$("#canvas").on("click", canvasClick);
		// Mode Settings
		gameMode = "play";
	}
};

// Defeated Menu Event Listener
function defeatedClick(e) {
	clickedY = (e.pageY - offsetTop) / scale;
	// Did the player click "Quit"?
	if (clickedY > 457) {
		// Yes - go to "New Game" screen
		// Restore event listeners & CSS
		$("#shadow").hide();
		$("#defeated").css( {top: -550 * scale} );
		$("#defeated").off();
		// Start "Play" screen event listener
		$("#new").show();
		$("#new").on("click", playClick);
		// Mode Settings
		gameMode = "new";
		setupMode = "true";
		
	// Did the player click "Replay Mission"?
	} else if (clickedY > 225) {
		// Restore event listeners & CSS
		$("#shadow").hide();
		$("#defeated").css( {top: -550 * scale} );
		$("#defeated").off();
		$("#canvas").on("click", canvasClick);
		// Load the map arrays.
		loadMap(map);
		// Mode Settings
		gameMode = "play";
		setupMode = "true";
	}
};

// Next Mission Event Listener
function nextMissionClick(e) {
	// Did the player click "Quit"?
	clickedX = (e.pageX - offsetLeft) / scale;
	clickedY = (e.pageY - offsetTop) / scale;
	if (clickedX > 460 && clickedX < 828 && clickedY > 548 && clickedY < 665) {
		// Yes - go to "New Game" screen
		// Restore event listeners & CSS
		$("#shadow").hide();
		$("#nextmission").css( {top: -700 * scale} );
		$("#nextmission").off();
		// Start "Play" screen event listener
		$("#new").show();
		$("#new").on("click", playClick);
		// Mode Settings
		gameMode = "new";
	// Did the player click "Continue"?
	} else if (clickedX > 460 && clickedX < 828 && clickedY > 409 && clickedY < 528) {
		// Restore event listeners & CSS
		$("#shadow").hide();
		$("#nextmission").css( {top: -700 * scale} );
		$("#nextmission").off();
		$("#canvas").on("click", canvasClick);
		// Mode Settings
		gameMode = "play";
		setupMode = "true";
		// Reset Mouse Event X and Y positions.
		clickedX = 0;
		clickedY = 0;
	}
};
/*
// Next Mission Event Listener
function completedClick(e) {
	
	clickedX = (e.pageX - offsetLeft) / scale;
	clickedY = (e.pageY - offsetTop) / scale;
	// Did the player click "Quit"?
	if (clickedX > 460 && clickedX < 828 && clickedY > 548 && clickedY < 665) {
		// Yes - go to "New Game" screen
		// Restore event listeners & CSS
		$("#shadow").hide();
		$("#completed").css( {top: -700 * scale} );
		$("#completed").off();
		// Start "Play" screen event listener
		$("#new").show();
		$("#new").on("click", playClick);
		// Mode Settings
		gameMode = "new";
	// Did the player click "Continue"?
	} else if (clickedX > 460 && clickedX < 828 && clickedY > 409 && clickedY < 528) {
		// Restore event listeners & CSS
		$("#completed").css( {top: -700 * scale} );
		$("#completed").off();
		// Load the map arrays.
		loadMap(map);
		// Set "Next Mission" event listeners & CSS
		$("#shadow").show();
		$("#nextmission").animate( {top: 10 * scale}, 300);
		$("#nextmission").on("click", nextMissionClick);
		// Set up Mission Display Text Boxes
		if (map == 1) {
			$("#mission-ID").html("FIRST MISSION");
		} else {
			$("#mission-ID").html("NEXT MISSION: " + map);
		}
		$("#mission-name").html("\"" + missionSetup[7] + "\"");
		$("#mission-up0").html("+" + missionSetup[0]);
		$("#mission-up1").html("+" + missionSetup[1]);
		$("#mission-up2").html("+" + missionSetup[2]);
		$("#mission-up3").html("+" + missionSetup[3]);
		// Mode Settings
		gameMode = "new";
		setupMode = "true";
	}
};
*/


// Start "Play" screen event listener
$("#new").on("click", playClick);
gameMode = "new";
// Run Game Loop
runGame();

// GAME LOOP -------------------------------------------------------------------------------- //
function gameLoop() {
 
	// Re-draw background image
	context.drawImage(mapImage, 0, 0);
		
	if (setupMode == "false") {	
	
		// Reset deployed to zero
		deployed = 0;
		
		// Creature Loop
		for (var i = 0; i < creatureMove.length; i++) {

			// Is creature on-screen?
			// (creatureMove[i][5] will be set to -100 if the creature has not yet started.)
			if (creatureMove[i][5] >= 0) {
        // Yes - Has this creature been slowed and are we on an even frame? 
        if (creatureMove[i][14] > 0 && frame % 2 == 0) {
          // Yes - Do not move the creature on this frame
          // Draw the creature on the canvas
          drawCreature(i);
          // Rotate and draw the Storm
          context.save();
          context.translate(creatureMove[i][6], creatureMove[i][7]);
          context.rotate(creatureMove[i][14] * 20 * TO_RADIANS); 
          context.drawImage(spritesheet, 400, 100, 100, 100, -50, -50, 100, 100);
          context.restore();	
          // Reduce the creature's "slow" meter
          creatureMove[i][14]--;
        } else {
          // Is creature at the end of his current path?
          if (creatureMove[i][5] >= creatureMove[i][3]) {
            // Yes - is this the final path?
            if ((creatureMove[i][2] + 1) == creatureMove[i][1] ) {
              // Yes - creature has walked off-screen; delete him from the array
              creatureMove.splice(i, 1);
              // Update Hearts
              hearts -=1;
              // Are there no hearts left
              if (hearts <= 0) {
                // end of game!
                hearts = 0;
                gameMode = "defeated";
                $("#canvas").off();
                $("#shadow").show();
                $("#defeated").animate( {top: 112 * scale}, 300);
                $("#defeated").on("click", defeatedClick);
              }
              // Skip to next creature
              continue;
            } else {
              // No - creature has more paths to walk
              // add one to current path
              creatureMove[i][2]++;
              // Extract new Distance & Direction from Route array
              distDir = routePath[(creatureMove[i][0])][(creatureMove[i][2])].split(":");
              // load new path distance
              creatureMove[i][3] = parseInt(distDir[0]);
              // load new path direction
              creatureMove[i][4] = parseInt(distDir[1]);
              // Reset HowFarWalked to 0.
              creatureMove[i][5] = 0;
            }
          }
          // Set new position based on current Path direction ( creatureMove[i][4] )
          // Directions are: 0=up, 1=right, 2=down, 3=left
          switch(creatureMove[i][4])
          {
            case 0:
              creatureMove[i][7]-=creatureMove[i][11];
              break;
            case 1:
              creatureMove[i][6]+=creatureMove[i][11];
              break;
            case 2:
              creatureMove[i][7]+=creatureMove[i][11];
              break;
            case 3:
              creatureMove[i][6]-=creatureMove[i][11];
              break;
            default:
              // do nothing
          }
          // Draw the creature on the canvas
          drawCreature(i);
          // Is this creatue being slowed?
          if (creatureMove[i][14] > 0) {
            // Rotate and draw the Storm
            context.save();
            context.translate(creatureMove[i][6], creatureMove[i][7]);
            context.rotate(creatureMove[i][14] * 20 * TO_RADIANS); 
            context.drawImage(spritesheet, 400, 100, 100, 100, -50, -50, 100, 100);
            context.restore();
          }
          // update how far the creature has walked along the path
          creatureMove[i][5]+=creatureMove[i][11];
        }
				
			// Has creature not yet started?
			} else if (creatureMove[i][5] == -100) {
				// Not started yet - Is it the correct frame? (only add ONE new creature to the screen every x frames)
				
				if (deployed == 0 && creatureDensity >= creatureWave[wave][2]) {
					creatureDensity = 0;
					// Yes - activate the creature
					creatureMove[i][5] = 0;
					// Draw the creature on the canvas
					drawCreature(i);
					// No more creatures can come on-screen during this frame
					deployed = 1;
				}	
			}	
		} // end Creature Loop
		
			
		// Draw creatures' Health Meters above their heads
		for (var i = 0; i < creatureMove.length; i++) {
			// Calculate percent of health left & convert to a number 0-10 
			health = Math.round(creatureMove[i][9] / creatureMove[i][10] * 10);
			// Draw meter above the creature
			context.drawImage(spritesheet, health * 22, 0, 22, 4, creatureMove[i][6] - 11, creatureMove[i][7] - 35, 22, 4);
		}

		// run hitAnimation (before drawing towers, so the projectiles plot beneath the towers)
		hitAnimation();
	
	} // end if setupMode == "false"
	
	// Tower Loop
	for (var j = 0; j < towers.length; j++) {

		// Is the tower active? (If towers[j][2] = -1, it is not active)
		if (towers[j][2] != -1) {
			// Is the tower firing? Is game in setup mode?
			if (towers[j][5] == 0 && setupMode == "false") {
				// No - See if the tower can do damage to this creature
				for (var k = 0; k < creatureMove.length; k++) {
					// ( creatureMove[k][12] = flying? 1/0  towers[j][7] = groundDamage towers[j][8] = flyingDamage )
					damage = towers[j][(7 + creatureMove[k][12])];
          // Is this a Storm Tower and has the unit already been slowed?
          if (towers[j][2] == 3 && creatureMove[k][14] > 0) {
            // Yes - do not hit it again.
            damage = 0;
					}
					// Q1: Can this tower do any damage to this type of creature (flying or not)?
					// Q2: Does the creature have any hit points left?
					if ( damage > 0 && creatureMove[k][9] > 0 ) {
						// Yes & Yes - calculate distance between the tower the creature's future position					
						// 2=targetX, 3=targetY. We need to compensate for the creature's movement rate.
						// Calculate the tower's hitAnimation end point; start with creature's current location
						cr2 = creatureMove[k][6];
						cr3 = creatureMove[k][7];
						
						// Anticipate where the creature will be when the shot hits
						trackAhead = 20 * creatureMove[k][11];
						// Get distance to end of creature's current path 
						// (We must account for the creature turning corners)
						toEndOfPath = creatureMove[k][3] - creatureMove[k][5];
						// Is the distance to the end of path < trackAhead?
						if (toEndOfPath < trackAhead) {
							// Yes - we will do the balance of the movement on the next route, if there is one
							// Is this the final path?
							if ((creatureMove[k][2] + 1) == creatureMove[k][1] ) {
								// Yes - use the current path direction & full trackAhead (do nothing)
							} else {
								// No - creature has more paths to walk
								aroundTheCorner = trackAhead - toEndOfPath
								trackAhead = toEndOfPath;
								// Extract next path Distance & Direction from Route array
								distDir = routePath[(creatureMove[k][0])][(creatureMove[k][2] + 1)].split(":");
								// load new path direction
								newDirection = parseInt(distDir[1]);

								// Add movement around the corner
								switch(newDirection) {
									case 0:
										cr3 -= aroundTheCorner;
										break;
									case 1:
										cr2 += aroundTheCorner;
										break;
									case 2:
										cr3 += aroundTheCorner;
										break;
									case 3:
										cr2 -= aroundTheCorner;
										break;
									default:
									// do nothing
								}
							}
						}
						
						// Add track ahead movement
						switch(creatureMove[k][4]) {
							case 0:
								cr3 -= trackAhead;
								break;
							case 1:
								cr2 += trackAhead;
								break;
							case 2:
								cr3 += trackAhead;
								break;
							case 3:
								cr2 -= trackAhead;
								break;
							default:
								// do nothing
						}
						
						// Formula to calculate distance: sqrt((x2-x1)^2 + (y2-y1)^2)
						distance_x = cr2 - towers[j][0];
						distance_y = cr3 - towers[j][1];
						distance = Math.sqrt( Math.pow((distance_x), 2) + Math.pow((distance_y), 2));
						
						// Is creature within striking distance, based on future position?
						if ( distance < 150 ) {
							// Add a new row to the hitList array for hit animation (projectiles flying toward the creature)
							// 0=originX
							cr0 = towers[j][0]
							// 1=originY 
							cr1 = towers[j][1]
							// 4=type
							cr4 = towers[j][2];
							// 5=currentFrame
							cr5 = 1;
							// 6=totalFrames
							cr6 = 10;
							// 7=whichTowerIsFiring
							cr7 = j;
							// 8=whichCreature
							cr8 = k;
							// 9=firingAngle: Calculate the angle at which the tower is firing
							distance_x = cr2 - towers[j][0];
							distance_y = cr3 - towers[j][1];
							cr9 = Math.atan2(distance_y, distance_x) * 180 / Math.PI;
							// Store damage, to be applied after hitAnimation completes
							cr10 = damage;
							// Push the parameters onto hitList as a new row
							hitList.push( [cr0, cr1, cr2, cr3, cr4, cr5, cr6, cr7, cr8, cr9, cr10] );
							
							// Set tower to "firing" status.
							towers[j][5] = 1;
							// Copy the firing angle to the tower array
							towers[j][4] = cr9;
							
							// play sound effect
							if (arrowFireTimer >= 30 && towers[j][2] == 0) {
								arrowFireAudio.load();
								arrowFireAudio.play();
								arrowFireTimer = 0;
							}	
							if (cannonFireTimer >= 55 && towers[j][2] == 1 ) {
								cannonFireAudio.load();
								cannonFireAudio.play();
								cannonFireTimer = 0;
							}		
							if (magicFireTimer >= 60 && towers[j][2] == 2) {
								magicFireAudio.load();
								magicFireAudio.play();
								magicFireTimer = 0;
							}
							if (windFireTimer >= 60 && towers[j][2] == 3) {
								windFireAudio.load();
								windFireAudio.play();
								windFireTimer = 0;
							}
							
							// We have a hit so break out of the creature loop 
							break;
						}
					}
				} // end for loop
				
			} else {
				// Increment tower's firing interval counter
				towers[j][5]++;
				// Is interval equal to max interval?
				if (towers[j][5] >= towers[j][6]) {
					// Yes - reset tower to "not firing" so it can fire again
					towers[j][5] = 0;
				}
			} // end if tower firing?

			// Draw tower parts
			context.save();
			context.translate(towers[j][0], towers[j][1]);
			// First draw tower base
			context.drawImage(spritesheet, 500 + (towers[j][2] * 200), 600, 100, 100, -50, -50, 100, 100);
			context.rotate(towers[j][4] * TO_RADIANS); 
			// Then draw firing part of tower, rotated
			context.drawImage(spritesheet, 600 + (towers[j][2] * 200), 600, 100, 100, -50, -50, 100, 100);
			context.restore();	
		} // end if (tower is active)
	} // end Tower Loop

	// Draw Score
	drawNumber(Math.round(coins), 58, 13);
	
	// Draw number of Hearts
	drawNumber(hearts, 213, 13);
	
	// Draw number of Creature Waves
	digit = 0;
	if (wave + 1 > 9) {
		digit = 24;
	}
	// Draw number of waves
	drawNumber(wave + 1, 330, 13);
	// Draw divide sign
	context.drawImage(spritesheet, 10 * 24, 4, 24, 36, 351 + digit, 13, 24, 36);
	// Draw total waves in this mission
	drawNumber(creatureWave.length, 364 + digit, 13);
	
	// Draw selected mouse-event items
	if (towerSelected.length > 0) {
		// draw tower highlight circles
		// towerSelected = [ 0=positionX  1=positionY  2=Type  3=Level 4=whichTower 5=OPT/SEL ]
		if (towerSelected[5] == 0) {
			// Yes - draw SELECT button
			context.drawImage(spritesheet, 37, 237, 126, 142, towerSelected[0] - 63, towerSelected[1] - 63, 126, 142);
			// Draw an "x" on each SELECT button where player has insufficient funds to buy it
			for (var i = 0; i < 4; i++) {
				if (Math.round(coins) < towerType[i][5]) {
          // display a Red "x"
					// var plotRedX = [ [-63, 18, -63, 18, -23], [-63, -63, 18, 18, -63] ];
					context.drawImage(spritesheet, 0, 400, 40, 40, towerSelected[0] + plotRedX[0][i], towerSelected[1] + plotRedX[1][i], 40, 40);
				}
			}
		} else {
			// No - draw OPTION button
      // Is this the Storm Tower? (It has a different Option menu)
      if (towerSelected[2] == 3) {
        // Yes, draw Storm Option menu
          context.drawImage(spritesheet, 163, 437, 136, 142, towerSelected[0] - 63, towerSelected[1] - 63, 136, 142);
      } else {
        // No, draw standard Option menu
        context.drawImage(spritesheet, 163, 237, 126, 142, towerSelected[0] - 63, towerSelected[1] - 63, 126, 142);
      }
			// Can the player afford an UPGRADE? Is the next upgrade available on this mission? 
			if ( Math.round(coins) < towerType[3][5 + 7 + (towers[sel][3] * 7)] ||
          // No, so display a Red "x"
						 towers[sel][3] >= missionSetup[(towers[sel][2])] ) {
				context.drawImage(spritesheet, 0, 400, 40, 40, towerSelected[0] + plotRedX[0][4], towerSelected[1] + plotRedX[1][4], 40, 40);
			}
		}
	}
	// Setup mode?
	if (setupMode == "true") {
		// Yes - draw Start button
		context.drawImage(spritesheet, 0, 48, 178, 52, 561, 5, 178, 52);
	}
	

	// ------------------------------------------------------------------------------------------------------ //
	// Mouse Events - Did the player click on the screen?
	if (clickedX > 0 || clickedY > 0) {
		// Did the player click on a pause or settings button?
		if (clickedX > 1190 && clickedY < 60) {
			// Yes - was it the settings button?
			if (clickedX > 1244) {
				// Yes - Set Settings variable
				gameMode = "settings";
				$("#canvas").off();
				$("#shadow").show();
				$("#settings").animate( {top: 81 * scale}, 300);
				$("#settings").on("click", settingsClick);

			} else {
				// No - Set Pause variable
				gameMode = "pause";
				$("#canvas").off();
				$("#shadow").show();
				$("#pause").show();
				$("#pause").on("click", pauseClick);
			}
		// Did player click on the Start button?
		} else if (setupMode == "true" && clickedX > 560 && clickedX < 740 && clickedY > 4 && clickedY < 57) {
			// Yes - Clear start button
			setupMode = "false";
		
		// Is a tower select window open?
		} else if (towerSelected.length > 0) {
			// Is it an OPTION or SELECT button?
			if (towerSelected[5] == 0) {
				// SELECT:
				if (clickedX > towerSelected[0] - 62 && clickedX < towerSelected[0] - 18 && 
					clickedY > towerSelected[1] - 62 && clickedY < towerSelected[1] - 18) {
					// Clicked on ARROW tower
					// Can the player afford an ARROW Tower?
					if (Math.round(coins) >= towerType[0][5]) {
						// Yes - Create the tower
						// 2=Type
						towers[sel][2] = 0;
						// 3=Level
						towers[sel][3] = 0;
						// 6=fireInterval
						towers[sel][6] = towerType[0][1];
						// 7=groundDamage
						towers[sel][7] = towerType[0][2];
						// 8=flyingDamage
						towers[sel][8] = towerType[0][3];
						towerSelected = [];
						coins -= towerType[0][5];
					} else {
						// Insufficient funds
					}
					
					
				} else if (clickedX > towerSelected[0] + 17 && clickedX < towerSelected[0] + 63 &&
						   clickedY > towerSelected[1] - 62 && clickedY < towerSelected[1] - 18) {
					// Clicked on CANNON tower
					// Can the player afford an CANNON Tower?
					if (Math.round(coins) >= towerType[1][5]) {
						// Yes - Create the tower
						// 2=Type
						towers[sel][2] = 1;
						// 3=Level
						towers[sel][3] = 0;
						// 6=fireInterval
						towers[sel][6] = towerType[1][1];
						// 7=groundDamage
						towers[sel][7] = towerType[1][2];
						// 8=flyingDamage
						towers[sel][8] = towerType[1][3];
						towerSelected = [];
						coins -= towerType[1][5];
					} else {
						// Insufficient funds
					}
					
				} else if (clickedX > towerSelected[0] - 62 && clickedX < towerSelected[0] - 18 && 
						   clickedY > towerSelected[1] + 17 && clickedY < towerSelected[1] + 63) {
					// Clicked on MAGE tower
					// Can the player afford an MAGE Tower?
					if (Math.round(coins) >= towerType[2][5]) {
						// Yes - Create the tower
						// 2=Type
						towers[sel][2] = 2;
						// 3=Level
						towers[sel][3] = 0;
						// 6=fireInterval
						towers[sel][6] = towerType[2][1];
						// 7=groundDamage
						towers[sel][7] = towerType[2][2];
						// 8=flyingDamage
						towers[sel][8] = towerType[2][3];
						towerSelected = [];
						coins -= towerType[2][5];
					} else {
						// Insufficient funds
					}
					
				} else if (clickedX > towerSelected[0] + 17 && clickedX < towerSelected[0] + 63 && 
						   clickedY > towerSelected[1] + 17 && clickedY < towerSelected[1] + 63) {
					// Clicked on CYCLONE tower
					// Can the player afford an MAGE Tower?
					if (Math.round(coins) >= towerType[3][5]) {
						// Yes - Create the tower
						// 2=Type
						towers[sel][2] = 3;
						// 3=Level
						towers[sel][3] = 0;
						// 6=fireInterval
						towers[sel][6] = towerType[3][1];
						// 7=groundDamage
						towers[sel][7] = towerType[3][2];
						// 8=flyingDamage
						towers[sel][8] = towerType[3][3];
						towerSelected = [];
						coins -= towerType[3][5];
					} else {
						// Insufficient funds
					}
				} else {
					// Did not click on an SELECT button
					towerSelected = [];
					clickOnTower();
				}
				
			} else {
				// OPTION:
				if (clickedX > towerSelected[0] - 25 && clickedX < towerSelected[0] + 25 && 
					clickedY > towerSelected[1] - 62 && clickedY < towerSelected[1] - 18) {
					// Clicked on UPGRADE
					// Can the player afford an UPGRADE? Is the next upgrade available on this mission? 
					towers[sel][3] < missionSetup[(towers[sel][2])] 
					if ( Math.round(coins) >= towerType[3][5 + 7 + (towers[sel][3] * 7)] && 
						 towers[sel][3] < missionSetup[(towers[sel][2])] ) {
						// Yes - Create the tower
						// 3=Level
						towers[sel][3]++;
						towerSelected = [];
						coins -= towerType[3][5 + (towers[sel][3] * 7)];
					} else {
						// Insufficient funds OR Upgrade not available 
					}

				} else if (clickedX > towerSelected[0] - 25 && clickedX < towerSelected[0] + 25 && 
						   clickedY > towerSelected[1] + 17 && clickedY < towerSelected[1] + 63) {
					// Clicked on SELL & DESTROY tower
					// 2=Type
					coins += towerType[(towers[sel][2])][6];
					// Coins can never be more than 4 digits
					if (coins > 9999) {
						coins = 9999;
					}
					towerSelected = [];
					towers[sel][2] = -1;
				} else {
					// Did not click on an OPTION button
					towerSelected = [];
					clickOnTower();
				}
			}
		} else {
			// Did the player click on a Tower spot?
			clickOnTower();
		}

	} // end If clicked on screen
	
	// Reset mouse variables to zero
	clickedX = 0;
	clickedY = 0;
	// ------------------------------------------------------------------------------------------------------ //
	
	
	if (setupMode == "false") {
	
		// Audio Timers. These prevent sounds from overlapping
		cannonFireTimer++;
		arrowFireTimer++;
		magicFireTimer++;
		windFireTimer++;
	
		// Is it time to bring on the next wave of creatures?
		if (nextWave >= creatureWave[wave][3]) {
			// Yes - Update wave
			wave++;
			// Is this the last wave?
			if (wave >= creatureWave.length) {
				// Yes - Are there any creatures still alive?
				if (creatureMove.length > 0) {
					// Yes - Do nothing
					wave--;
				} else {
					// No - Wave Completed!
					// Set "Next Mission" event listeners & CSS
					$("#canvas").off();
					// Set "Next Mission" event listeners & CSS
					$("#nextmission").css( {backgroundImage: "url(images/nextmission.png)"} );
					$("#score").show();
					$("#shadow").show();
					$("#nextmission").animate( {top: 10 * scale}, 300);
					$("#nextmission").on("click", nextMissionClick);

					// Show percentage of stars equal to percant of hearts left
					digit = Math.ceil(hearts / missionSetup[5] * 6);
					// Display the score as 1-6 stars by inserting the correct 
					// scoreX.png and adjusting for image width
					$("#score").css({backgroundImage: "url(images/score" + digit + ".png)", width: ((digit * 51) - 2) * scale});
					// Set up Mission Display Text Boxes
					// Update the map
					map++;
					// Load the map arrays.
					loadMap(map);
					$("#mission-ID").html("NEXT MISSION: " + map);
					$("#mission-name").html("\"" + missionSetup[7] + "\"");
					$("#mission-up0").html("+" + missionSetup[0]);
					$("#mission-up1").html("+" + missionSetup[1]);
					$("#mission-up2").html("+" + missionSetup[2]);
					$("#mission-up3").html("+" + missionSetup[3]);
						
					// Mode Settings
					gameMode = "nextmission";
					setupMode = "true";




				}
			} else {
				// Not the last wave - Add a new wave
				addWave();
				// Reset nextWave so we can count seconds from zero
				nextWave = 0;
			}
		}
		
		// Count frames
		frame++;
		creatureDensity++;
		if (frame >= 60) {
			// Reset frames every second
			frame = 0;
			// Update nextWave (nextWave is counted in seconds)
			nextWave++;
		}
	} // end if setupMode == "false"
	
	
} // end gameLoop

// CLICK ON TOWER ------------------------------------------------------------------------ //
function clickOnTower() {
	// Did the player click on a tower?
	// Loop thru towers to se if player clicked on one.
	sel = -1;
	for (var j = 0; j < towers.length; j++) {
		// Did the player click on a tower?
		if ( (clickedX > towers[j][0] - 50 && clickedX < towers[j][0] + 50) && (clickedY > towers[j][1] - 50 && clickedY < towers[j][1] + 50) ) {
			// Yes - Remember it.
			sel = j;
			break;
		}
	} // end Loop thru towers
	if (sel != -1) {
		// Yes - is it already active?
		if (towers[sel][2] != -1) {
			// Yes - set tower OPTION button
			// [ 0=positionX  1=positionY  2=Type  3=Level 4=whichTower 5=OPT/SEL ]
			towerSelected = [ towers[sel][0], towers[sel][1], towers[sel][2], towers[sel][3], sel, 1 ];
		} else {
			// No - set tower SELECT button
			towerSelected = [ towers[sel][0], towers[sel][1], towers[sel][2], towers[sel][3], sel, 0 ];
		}
	} 
}


// ADD WAVE ------------------------------------------------------------------------------ //
function addWave() {
	// Assign paths to creatures
	for (var i = 0; i < creatureWave[wave][1]; i++) {
		// Is this a massive creature that can only fit on the middle path?
		if (creatureWave[wave][0] == 2 || creatureWave[wave][0] == 5) {
			// Yes - assign it to the middle path.
			rand = creatureWave[wave][4] + 1;
		} else {
			// No - Choose random path
			rand = Math.floor((Math.random() * 3) + creatureWave[wave][4]);
			// Never put two consecutive creatures on the same route
			while (rand == lastRoute) {
				rand = Math.floor((Math.random() * 3) + creatureWave[wave][4]);
			}
		}
		// Keep track of the last route that was selected
		lastRoute = rand;
		// 0=route# 
		cr0 = rand;
		// 1=totalPaths
		cr1 = Math.floor(routePath[rand].length);
		// 2=currentPath
		cr2 = 0;
		// Extract Distance & Direction from Route array
		distDir = routePath[rand][0].split(":");
		// 3=distance for current path
		cr3 = parseInt(distDir[0]);
		// 4=direction for current path
		cr4 = parseInt(distDir[1]);
		// 5=howFarWalked. We initialize at -100 to indicate that the creature is not yet on the screen 
		cr5 = -100;
		// 6=positionX
		cr6 = routeStart[rand][0];
		// 7=positionY
		cr7 = routeStart[rand][1];
		// Temp variable for creature Type
		type = creatureWave[wave][0];
		// 8=type
		cr8 = type;
		// 9=hitPointsLeft
		cr9  = creatureType[type][3];
		// 10=totalHitPoints
		cr10 = creatureType[type][3];
		// 11=moveSpeed
		cr11 = creatureType[type][4];
		// 12=flying? (1:yes, 0:no)
		cr12 = creatureType[type][5];
		// 13=name
		cr13 = creatureType[type][0];
		// 14=slowed (by Storm Tower)
		cr14 = 0;
		// cr15=animationFrame 0-7
		cr15 = Math.floor((Math.random() * 8));
		// Add creatures to array
		if (cr12 == 0) {
			// Add Ground creatures to the TOP of array (so it plots first, and appears beneath flying creatures)
			creatureMove.unshift( [cr0, cr1, cr2, cr3, cr4, cr5, cr6, cr7, cr8, cr9, cr10, cr11, cr12, cr13, cr14, cr15] );
		} else {
			// Add Flying creatures to the BOTTOM of array (so it plots last, and appears above ground creatures)
			creatureMove.push( [cr0, cr1, cr2, cr3, cr4, cr5, cr6, cr7, cr8, cr9, cr10, cr11, cr12, cr13, cr14, cr15] );
		}
	}
}

// DRAW CREATURE ------------------------------------------------------------------------------ //
function drawCreature(i) {
	// Draw a different animation sprite every 15 frames. There are four sprites for each creature. 
	creatureMove[i][15] += 0.2;
	if (creatureMove[i][15] > 7) {
		creatureMove[i][15] = 0;
	}
	// Draw creature
	//context.drawImage(spritesheet, 700 + (animSprite * 100), 0, 100, 100, creatureMove[i][6] - 50, creatureMove[i][7] - 50, 100, 100);
	// Draw creature rotated in the proper direction
	context.save();
	context.translate(creatureMove[i][6], creatureMove[i][7]);
	context.rotate( (creatureMove[i][4] - 1) * 90 * TO_RADIANS); 
	context.drawImage(spritesheet, 500 + (Math.round(creatureMove[i][15])* 100), creatureMove[i][8] * 100, 100, 100, -50, -50, 100, 100);
	context.restore();

}

// HIT LIST ANIMATION ------------------------------------------------------------------------- //
function hitAnimation() {
	
	if (hitList.length != 0) {
		for (var i = 0; i < hitList.length; i++) {
			// calculate new plot positions
			position = hitList[i][5] / hitList[i][6];
			hitX = Math.round( hitList[i][0] + ((hitList[i][2] - hitList[i][0]) * position) );
			hitY = Math.round( hitList[i][1] + ((hitList[i][3] - hitList[i][1]) * position) );
			// Draw projectile
			// Is this a cannonball? (we don't need to rotate cannonballs)
			if (hitList[i][4] == 1) {
				// Yes -  We don't need to rotate it
				context.drawImage(spritesheet, hitList[i][4] * 100, 100, 100, 100, hitX - 50, hitY - 50, 100, 100);
			} else {
        // No - it's an arrow, fireball or storm. rotate and draw the projectile
				context.save();
				context.translate(hitX, hitY);
				context.rotate(hitList[i][9] * TO_RADIANS); 
				context.drawImage(spritesheet, hitList[i][4] * 100, 100, 100, 100, -50, -50, 100, 100);
				context.restore();	
			}

			// Is this the last animation Frame?
			if (hitList[i][5] >= hitList[i][6]) {
				// Yes - does the creature still exist (may have already been deleted by previous tower's hitAnimation)
				if (creatureMove[( hitList[i][8] )] != undefined) {
          // Yes - Was the creature hit by a Storm Bolt?
          if (hitList[i][4] == 3) {
            // Yes - Add slow points to character
            creatureMove[( hitList[i][8] )][14] = hitList[i][10];
          } else {
            // No - Creature takes damage
            creatureMove[( hitList[i][8] )][9] -= hitList[i][10];
            // Update score
            coins += creatureMove[( hitList[i][8] )][10] / 10;
            // Coins can never be more than 4 digits
            if (coins > 9999) {
              coins = 9999;
            }
            // Yes - does the creature have no hit points left?
            if (creatureMove[( hitList[i][8] )][9] <= 0) {
              // Yes - Delete the creature row from the creatureMove array
              creatureMove.splice(hitList[i][8], 1);
            }
          }
				}
				// This hitAnimation is completed - Delete the row from the hitAnimation array
				hitList.splice(i, 1);
			} else {			
				// Not the last frame - update currentFrame
				hitList[i][5]+= 0.4;
			}
		}
	}
}

// DRAW NUMBER -------------------------------------------------------------------------------- //
// Draw number at specified location
function drawNumber (number, posX, posY) {
	// Convert number to an array of characters
	numString = number.toString().split("");
	// Loop through each digit in the number 
	for (var i = 0; i < numString.length; i++) {
		// Convert string array digit back to a number
		digit = parseInt(numString[i]);
		// Draw each number from spritesheet
		context.drawImage(spritesheet, digit * 24, 4, 24, 36, posX + (i * 24), posY, 24, 36);
	}
}

// ------------------------------------------------------------------------------------- //
// LOAD MAPS --------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------------- //

function loadMap(which) {
	switch (which) {
		case 1: {
			mapImage.src="images/map1.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map1MissionSetup);
			creatureWave   = $.extend(true, [], map1CreatureWave);
			towers         = $.extend(true, [], map1Towers);
			routeStart     = $.extend(true, [], map1RouteStart);
			routePath      = $.extend(true, [], map1RoutePath);
			break;
		}
		case 2: {
			mapImage.src="images/map2.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map2MissionSetup);
			creatureWave   = $.extend(true, [], map2CreatureWave);
			towers         = $.extend(true, [], map2Towers);
			routeStart     = $.extend(true, [], map2RouteStart);
			routePath      = $.extend(true, [], map2RoutePath);
			break;
		}
		case 3: {
			mapImage.src="images/map1.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map3MissionSetup);
			creatureWave   = $.extend(true, [], map3CreatureWave);
			towers         = $.extend(true, [], map3Towers);
			routeStart     = $.extend(true, [], map3RouteStart);
			routePath      = $.extend(true, [], map3RoutePath);
			break;
		}
		case 4: {
			mapImage.src="images/map2.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map4MissionSetup);
			creatureWave   = $.extend(true, [], map4CreatureWave);
			towers         = $.extend(true, [], map4Towers);
			routeStart     = $.extend(true, [], map4RouteStart);
			routePath      = $.extend(true, [], map4RoutePath);
			break;
		}
		case 5: {
			mapImage.src="images/map1.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map5MissionSetup);
			creatureWave   = $.extend(true, [], map5CreatureWave);
			towers         = $.extend(true, [], map5Towers);
			routeStart     = $.extend(true, [], map5RouteStart);
			routePath      = $.extend(true, [], map5RoutePath);
			break;
		}
		case 6: {
			mapImage.src="images/map2.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map6MissionSetup);
			creatureWave   = $.extend(true, [], map6CreatureWave);
			towers         = $.extend(true, [], map6Towers);
			routeStart     = $.extend(true, [], map6RouteStart);
			routePath      = $.extend(true, [], map6RoutePath);
			break;
		}
		case 7: {
			mapImage.src="images/map1.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map7MissionSetup);
			creatureWave   = $.extend(true, [], map7CreatureWave);
			towers         = $.extend(true, [], map7Towers);
			routeStart     = $.extend(true, [], map7RouteStart);
			routePath      = $.extend(true, [], map7RoutePath);
			break;
		}
		case 8: {
			mapImage.src="images/map2.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map8MissionSetup);
			creatureWave   = $.extend(true, [], map8CreatureWave);
			towers         = $.extend(true, [], map8Towers);
			routeStart     = $.extend(true, [], map8RouteStart);
			routePath      = $.extend(true, [], map8RoutePath);
			break;
		}
		case 9: {
			mapImage.src="images/map1.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map9MissionSetup);
			creatureWave   = $.extend(true, [], map9CreatureWave);
			towers         = $.extend(true, [], map9Towers);
			routeStart     = $.extend(true, [], map9RouteStart);
			routePath      = $.extend(true, [], map9RoutePath);
			break;
		}
		case 10: {
			mapImage.src="images/map2.png";
			context.drawImage(mapImage, 0, 0);
			missionSetup   = $.extend(true, [], map10MissionSetup);
			creatureWave   = $.extend(true, [], map10CreatureWave);
			towers         = $.extend(true, [], map10Towers);
			routeStart     = $.extend(true, [], map10RouteStart);
			routePath      = $.extend(true, [], map10RoutePath);
			break;
		}
	}
	
	// Reset the re-usable 2D Arrays
	creatureMove.length = 0;
	towerSelected.length = 0;
	hitList.length = 0;
	creatureDensity = 0;
	
	
	// Score
	coins  = missionSetup[4];
	hearts = missionSetup[5];		
	// Reset Wave Variables
	nextWave = 0;
	wave = 0;
	// set up first wave of creatures
	addWave();
	// Reset Mouse Event X and Y positions.
	clickedX = 0;
	clickedY = 0;
}

// ------------------------------------------------------------------------------------- //
// MAP DATA ---------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------------- //

// Mission Setup Arrays
// [ 0=cannonMaxUpgrade 1=archerMaxUpgrade 2=mageMaxUpgrade 3=cycloneMaxUpgrade 4=coins 5=hearts 6=mapDifficulty 7=mapName ]
var map1MissionSetup  = [ 0, 0, 0, 0,  400, 10, 0, "Go with the Flow" ];
var map2MissionSetup  = [ 0, 0, 0, 0,  500, 10, 0, "Pirate Attack" ];
var map3MissionSetup  = [ 0, 0, 0, 0,  600, 10, 0, "Bats out of Hell" ];
var map4MissionSetup  = [ 0, 0, 0, 0,  750, 10, 0, "What Next?" ];
var map5MissionSetup  = [ 0, 0, 0, 0,  750, 10, 0, "Boat Battle" ];
var map6MissionSetup  = [ 0, 0, 0, 0,  800, 10, 0, "Where's the Dragon?" ];
var map7MissionSetup  = [ 0, 0, 0, 0,  800, 10, 0, "Fighting Fire" ];
var map8MissionSetup  = [ 0, 0, 0, 0,  900, 10, 0, "It's Getting Hot!" ];
var map9MissionSetup  = [ 0, 0, 0, 0,  900, 10, 0, "Penultimate Level" ];
var map10MissionSetup = [ 0, 0, 0, 0, 1000, 10, 0, "The Dragon Comes!" ];

// Route Path Arrays 
// [ 0=distance(in pixels)  1=direction ]  (0=up, 1=right, 2=down, 3=left)
var map1RoutePath = [ 
	["330:1", "200:2", "240:1", "200:0", "460:1", "400:2", "300:1"],
	["300:1", "200:2", "300:1", "200:0", "400:1", "400:2", "330:1"],
	["270:1", "200:2", "360:1", "200:0", "340:1", "400:2", "360:1"],
	["470:1", "200:0", "100:1", "200:0", "460:1", "400:2", "300:1"],
	["500:1", "200:0", "100:1", "200:0", "400:1", "400:2", "330:1"],
	["530:1", "200:0", "100:1", "200:0", "340:1", "400:2", "360:1"]
	];
var map2RoutePath = [ 
	[ "630:1", "100:2", "400:1", "100:2", "300:1"],
	[ "600:1", "100:2", "400:1", "100:2", "330:1"],
	[ "570:1", "100:2", "400:1", "100:2", "360:1"],
	[ "970:1", "200:0", "360:1"],
	["1000:1", "200:0", "330:1"],
	["1030:1", "200:0", "300:1"],
	[ "570:1", "300:0", "430:1", "100:2", "330:1"],
	[ "600:1", "300:0", "400:1", "100:2", "330:1"],
	[ "630:1", "300:0", "370:1", "100:2", "330:1"]
	];	
var map3RoutePath = [ 
	["330:1", "200:2", "240:1", "200:0", "460:1", "400:2", "300:1"],
	["300:1", "200:2", "300:1", "200:0", "400:1", "400:2", "330:1"],
	["270:1", "200:2", "360:1", "200:0", "340:1", "400:2", "360:1"],
	["470:1", "200:0", "100:1", "200:0", "460:1", "400:2", "300:1"],
	["500:1", "200:0", "100:1", "200:0", "400:1", "400:2", "330:1"],
	["530:1", "200:0", "100:1", "200:0", "340:1", "400:2", "360:1"]
	];	
var map4RoutePath = [ 
	[ "630:1", "100:2", "400:1", "100:2", "300:1"],
	[ "600:1", "100:2", "400:1", "100:2", "330:1"],
	[ "570:1", "100:2", "400:1", "100:2", "360:1"],
	[ "970:1", "200:0", "360:1"],
	["1000:1", "200:0", "330:1"],
	["1030:1", "200:0", "300:1"],
	[ "570:1", "300:0", "430:1", "100:2", "330:1"],
	[ "600:1", "300:0", "400:1", "100:2", "330:1"],
	[ "630:1", "300:0", "370:1", "100:2", "330:1"]
	];
var map5RoutePath = [ 
	["330:1", "200:2", "240:1", "200:0", "460:1", "400:2", "300:1"],
	["300:1", "200:2", "300:1", "200:0", "400:1", "400:2", "330:1"],
	["270:1", "200:2", "360:1", "200:0", "340:1", "400:2", "360:1"],
	["470:1", "200:0", "100:1", "200:0", "460:1", "400:2", "300:1"],
	["500:1", "200:0", "100:1", "200:0", "400:1", "400:2", "330:1"],
	["530:1", "200:0", "100:1", "200:0", "340:1", "400:2", "360:1"]
	];
var map6RoutePath = [ 
	[ "630:1", "100:2", "400:1", "100:2", "300:1"],
	[ "600:1", "100:2", "400:1", "100:2", "330:1"],
	[ "570:1", "100:2", "400:1", "100:2", "360:1"],
	[ "970:1", "200:0", "360:1"],
	["1000:1", "200:0", "330:1"],
	["1030:1", "200:0", "300:1"],
	[ "570:1", "300:0", "430:1", "100:2", "330:1"],
	[ "600:1", "300:0", "400:1", "100:2", "330:1"],
	[ "630:1", "300:0", "370:1", "100:2", "330:1"]
	];
var map7RoutePath = [ 
	["330:1", "200:2", "240:1", "200:0", "460:1", "400:2", "300:1"],
	["300:1", "200:2", "300:1", "200:0", "400:1", "400:2", "330:1"],
	["270:1", "200:2", "360:1", "200:0", "340:1", "400:2", "360:1"],
	["470:1", "200:0", "100:1", "200:0", "460:1", "400:2", "300:1"],
	["500:1", "200:0", "100:1", "200:0", "400:1", "400:2", "330:1"],
	["530:1", "200:0", "100:1", "200:0", "340:1", "400:2", "360:1"]
	];	
var map8RoutePath = [ 
	[ "630:1", "100:2", "400:1", "100:2", "300:1"],
	[ "600:1", "100:2", "400:1", "100:2", "330:1"],
	[ "570:1", "100:2", "400:1", "100:2", "360:1"],
	[ "970:1", "200:0", "360:1"],
	["1000:1", "200:0", "330:1"],
	["1030:1", "200:0", "300:1"],
	[ "570:1", "300:0", "430:1", "100:2", "330:1"],
	[ "600:1", "300:0", "400:1", "100:2", "330:1"],
	[ "630:1", "300:0", "370:1", "100:2", "330:1"]
	];	
var map9RoutePath = [ 
	["330:1", "200:2", "240:1", "200:0", "460:1", "400:2", "300:1"],
	["300:1", "200:2", "300:1", "200:0", "400:1", "400:2", "330:1"],
	["270:1", "200:2", "360:1", "200:0", "340:1", "400:2", "360:1"],
	["470:1", "200:0", "100:1", "200:0", "460:1", "400:2", "300:1"],
	["500:1", "200:0", "100:1", "200:0", "400:1", "400:2", "330:1"],
	["530:1", "200:0", "100:1", "200:0", "340:1", "400:2", "360:1"]
	];
var map10RoutePath = [ 
	[ "630:1", "100:2", "400:1", "100:2", "300:1"],
	[ "600:1", "100:2", "400:1", "100:2", "330:1"],
	[ "570:1", "100:2", "400:1", "100:2", "360:1"],
	[ "970:1", "200:0", "360:1"],
	["1000:1", "200:0", "330:1"],
	["1030:1", "200:0", "300:1"],
	[ "570:1", "300:0", "430:1", "100:2", "330:1"],
	[ "600:1", "300:0", "400:1", "100:2", "330:1"],
	[ "630:1", "300:0", "370:1", "100:2", "330:1"]
	];
	
// Route Start Arrays 
// [ 0=beginX  1=beginY ]
var map1RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580] ];
var map2RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580], [-53, 520], [-53, 550], [-53, 580] ];
var map3RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580] ];
var map4RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580], [-53, 520], [-53, 550], [-53, 580] ];
var map5RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580] ];
var map6RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580], [-53, 520], [-53, 550], [-53, 580] ];
var map7RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580] ];
var map8RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580], [-53, 520], [-53, 550], [-53, 580] ];
var map9RouteStart  = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580] ];
var map10RouteStart = [ [-53, 120], [-53, 150], [-53, 180], [-53, 520], [-53, 550], [-53, 580], [-53, 520], [-53, 550], [-53, 580] ];

// Creature Wave Arrays.
// [ 0=CreatureType  1=WaveSize  2=density  3=secondsBeforeNextWave 4=whichRoad (set of 3 routes)]
// whichRoad can be 0,3,6 
var map1CreatureWave = [
	[0,   4, 40,  7, 0],
	[1,   6, 50,  4, 3],
	[0,   8, 40,  3, 0],
	[1,   9, 50,  0, 3]
	];
var map2CreatureWave = [
	[0,   3, 15,  5, 0],
	[3,   4, 20,  5, 6],
	[1,   3, 30,  5, 3],
	[0,   4, 15,  5, 0],
	[1,   6, 20,  5, 3],
	[3,   12, 30, 11, 6],
	[0,   4, 60, 13, 3],
	[1,   6, 30, 15, 0]
	];
var map3CreatureWave = [
	[0,   5, 15,  8, 0],
	[3,   4, 20,  8, 3],
	[3,   3, 30,  8, 0],
	[0,   2, 30,  8, 3]
	];
var map4CreatureWave = [
	[0,   3, 15,  8, 0],
	[3,   4, 20, 12, 6],
	[0,   3, 30, 10, 3],
	[3,   4, 15,  7, 0],
	[0,   6, 20,  9, 3],
	[3,   5, 30, 11, 6],
	[0,   4, 60, 13, 3],
	[3,   6, 30, 15, 0]
	];
var map5CreatureWave = [
	[0,   5, 15,  8, 0],
	[3,   4, 20,  8, 3],
	[3,   3, 30,  8, 0],
	[0,   2, 30,  8, 3]
	];
var map6CreatureWave = [
	[0,   3, 15,  8, 0],
	[3,   4, 20, 12, 6],
	[0,   3, 30, 10, 3],
	[3,   4, 15,  7, 0],
	[0,   6, 20,  9, 3],
	[3,   5, 30, 11, 6],
	[0,   4, 60, 13, 3],
	[3,   6, 30, 15, 0]
	];
var map7CreatureWave = [
	[0,   5, 15,  8, 0],
	[3,   4, 20,  8, 3],
	[3,   3, 30,  8, 0],
	[0,   2, 30,  8, 3]
	];
var map8CreatureWave = [
	[0,   3, 15,  8, 0],
	[3,   4, 20, 12, 6],
	[0,   3, 30, 10, 3],
	[3,   4, 15,  7, 0],
	[0,   6, 20,  9, 3],
	[3,   5, 30, 11, 6],
	[0,   4, 60, 13, 3],
	[3,   6, 30, 15, 0]
	];
var map9CreatureWave = [
	[0,   5, 15,  8, 0],
	[3,   4, 20,  8, 3],
	[3,   3, 30,  8, 0],
	[0,   2, 30,  8, 3]
	];
var map10CreatureWave = [
	[0,   3, 15,  8, 0],
	[3,   4, 20, 12, 6],
	[0,   3, 30, 10, 3],
	[3,   4, 15,  7, 0],
	[0,   6, 20,  9, 3],
	[3,   5, 30, 11, 6],
	[0,   4, 60, 13, 3],
	[3,   6, 30, 15, 0]
	];

// Towers Arrays.
// [ 0=positionX  1=positionY  2=Type  3=currentUpgradeLevel  4=Direction 5=firing? 6=fireInterval 7=groundDamage 8=flyingDamage ]
var map1Towers = [	
	[  50, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[1050, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0], 
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 550, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 650, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 650, -1, 0, 0, 0, 0, 0, 0]
	];
var map2Towers = [	
	[ 650, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 950, 150, -1, 0, 0, 0, 0, 0, 0],
	[1050, 150, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[1150, 250, -1, 0, 0, 0, 0, 0, 0],
	
	[ 450, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 350, -1, 0, 0, 0, 0, 0, 0], 
	[ 850, 350, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 450, -1, 0, 0, 0, 0, 0, 0],
	
	[ 650, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[1150, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 550, -1, 0, 0, 0, 0, 0, 0]
	];
var map3Towers = [	
	[  50, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[1050, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0], 
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 550, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 650, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 650, -1, 0, 0, 0, 0, 0, 0]
	];
var map4Towers = [	
	[ 650, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 950, 150, -1, 0, 0, 0, 0, 0, 0],
	[1050, 150, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[1150, 250, -1, 0, 0, 0, 0, 0, 0],
	
	[ 450, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 350, -1, 0, 0, 0, 0, 0, 0], 
	[ 850, 350, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 450, -1, 0, 0, 0, 0, 0, 0],
	
	[ 650, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[1150, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 550, -1, 0, 0, 0, 0, 0, 0]
	];
var map5Towers = [	
	[  50, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[1050, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0], 
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 550, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 650, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 650, -1, 0, 0, 0, 0, 0, 0]
	];
var map6Towers = [	
	[ 650, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 950, 150, -1, 0, 0, 0, 0, 0, 0],
	[1050, 150, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[1150, 250, -1, 0, 0, 0, 0, 0, 0],
	
	[ 450, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 350, -1, 0, 0, 0, 0, 0, 0], 
	[ 850, 350, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 450, -1, 0, 0, 0, 0, 0, 0],
	
	[ 650, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[1150, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 550, -1, 0, 0, 0, 0, 0, 0]
	];
var map7Towers = [	
	[  50, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[1050, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0], 
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 550, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 650, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 650, -1, 0, 0, 0, 0, 0, 0]
	];
var map8Towers = [	
	[ 650, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 950, 150, -1, 0, 0, 0, 0, 0, 0],
	[1050, 150, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[1150, 250, -1, 0, 0, 0, 0, 0, 0],
	
	[ 450, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 350, -1, 0, 0, 0, 0, 0, 0], 
	[ 850, 350, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 450, -1, 0, 0, 0, 0, 0, 0],
	
	[ 650, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[1150, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 550, -1, 0, 0, 0, 0, 0, 0]
	];
var map9Towers = [	
	[  50, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 150, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[1050, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0], 
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 550, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 650, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 650, -1, 0, 0, 0, 0, 0, 0]
	];
var map10Towers = [	
	[ 650, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 150, -1, 0, 0, 0, 0, 0, 0],
	[ 950, 150, -1, 0, 0, 0, 0, 0, 0],
	[1050, 150, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 250, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 250, -1, 0, 0, 0, 0, 0, 0],
	[1050, 250, -1, 0, 0, 0, 0, 0, 0],
	[1150, 250, -1, 0, 0, 0, 0, 0, 0],
	
	[ 450, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 650, 350, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 350, -1, 0, 0, 0, 0, 0, 0], 
	[ 850, 350, -1, 0, 0, 0, 0, 0, 0],
	
	[ 150, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 250, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 350, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 450, 450, -1, 0, 0, 0, 0, 0, 0],
	
	[ 650, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 750, 450, -1, 0, 0, 0, 0, 0, 0],
	[ 850, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 450, -1, 0, 0, 0, 0, 0, 0],
	[1150, 450, -1, 0, 0, 0, 0, 0, 0],
	[1050, 550, -1, 0, 0, 0, 0, 0, 0]
	];


}); // end $(document).ready



