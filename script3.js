// ==============================================
// STRETCHABLE CHARACTER WITH SHAKE EFFECTS
// ==============================================

// ==============================================
// CHARACTER VARIABLES
// ==============================================
let character;
let characterImages = {};
let currentCharacterImg;
let isStressed = false;
let stressCooldown = 0;

// Global shake and stress variables
let shakeIntensity = 0;
let stress = 0;
let displayStress = 0;

// Character movement
const BASE_WALK_SPEED = 10;
let currentSpeed = BASE_WALK_SPEED;
let targetX = 0;
let targetY = 0;
let wanderTimer = 0;
const WANDER_INTERVAL = 120;
let jitterX = 0;
let jitterY = 0;
let characterDirection = 1;

// Stress parameters
const STRESS_SHAKE_INCREASE = 8;
const STRESS_RECOVERY = 0.15;
const STRESS_PANIC_THRESHOLD = 70;
const STRESS_WARNING_THRESHOLD = 40;
const SHAKE_DECAY = 0.92;
const STRESS_VISUAL_INERTIA = 0.12;

// ==============================================
// STRETCHING VARIABLES
// ==============================================
let stretchFactor = 1;
let rotationAngle = 0;
let translateX = 0;
let translateY = 0;
let baseWidth = 300;
let baseHeight = 300;

// Touch variables for stretching
let touch1X = 0;
let touch1Y = 0;
let touch2X = 0;
let touch2Y = 0;
let touchDistance = 0;
let initialDistance = 0;
let initialAngle = 0;
let initialMidX = 0;
let initialMidY = 0;
let hasTwoTouches = false;

// Distance thresholds for image switching
const MIN_DISTANCE_THRESHOLD = 130;
const MAX_DISTANCE_THRESHOLD = 400;

// UI
let showUI = true;
let sensorsActive = false;

// ==============================================
// PRELOAD - Load all character images
// ==============================================
function preload() {
  // Load all character states
  characterImages.normalRight = loadImage('sasha.jpg');
  characterImages.normalLeft = loadImage('sasha-back.jpg');
  characterImages.stressed = loadImage('sasha-crumple.png');
  characterImages.stretched = loadImage('sasha-front-ripped.png');
  characterImages.compressed = loadImage('sasha-rolled.png');
}

// ==============================================
// SETUP - Initialize character
// ==============================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  lockGestures();
  
  // Enable device motion sensors with tap
  enableGyroTap('Tap to enable shake detection');
  
  // Set text properties
  textAlign(CENTER, CENTER);
  textSize(24);
  
  // Initialize character
  setupCharacter();
}

function setupCharacter() {
  // Turn off physics gravity
  world.gravity.y = 0;
  
  // Create character sprite at center
  character = new Sprite(width / 2, height / 2);
  character.scale = 0.2;
  character.physics = 'kinematic';
  character.collider = 'none';
//   character.img = characterImages.normalRight;
  currentCharacterImg = characterImages.normalRight;
  
  // Set initial random target position for wandering
  chooseNewWanderTarget();
}

// ==============================================
// DRAW - Main game loop
// ==============================================
function draw() {
  background(0, 0, 0);
  
  // Check if sensors are enabled
  sensorsActive = window.sensorsEnabled || false;
  
  // Update all systems
  updateShakeIntensity();
  updateStressParameter();
  updateStressState();
  updateStretching();
  
  // Update character movement and appearance
  if (!isStressed) {
    updateWandering();
    updateMovementSpeed();
    moveCharacterToTarget();
  } else {
    // Apply jitter even when paused
    character.x += jitterX;
    character.y += jitterY;
  }
  
//   updateCharacterColor();
  updateStressJitter();
  updateCharacterAppearance();
  
  // Draw the transformed character
  drawTransformedCharacter();
  
  // Draw UI
  drawUI();
}

// ==============================================
// STRETCHING SYSTEM
// ==============================================
function updateStretching() {
  // Check if we have at least 2 touches
  if (touches.length >= 2) {
    if (!hasTwoTouches) {
      // First time we have two touches - store initial values
      initialDistance = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
      initialAngle = atan2(touches[1].y - touches[0].y, touches[1].x - touches[0].x);
      initialMidX = (touches[0].x + touches[1].x) / 2;
      initialMidY = (touches[0].y + touches[1].y) / 2;
      hasTwoTouches = true;
    }
    
    // Get the positions of the first 2 touches
    touch1X = touches[0].x;
    touch1Y = touches[0].y;
    touch2X = touches[1].x;
    touch2Y = touches[1].y;
    
    // Calculate distance between the two touches
    touchDistance = dist(touch1X, touch1Y, touch2X, touch2Y);
    
    // Calculate current midpoint
    let currentMidX = (touch1X + touch2X) / 2;
    let currentMidY = (touch1Y + touch2Y) / 2;
    
    // Calculate transformations
    rotationAngle = atan2(touch2Y - touch1Y, touch2X - touch1X) - initialAngle;
    translateX = currentMidX - initialMidX;
    translateY = currentMidY - initialMidY;
    
    // Check distance thresholds and control stretching
    if (touchDistance > MAX_DISTANCE_THRESHOLD) {
      stretchFactor = MAX_DISTANCE_THRESHOLD / initialDistance;
    } else if (touchDistance < MIN_DISTANCE_THRESHOLD) {
      stretchFactor = MIN_DISTANCE_THRESHOLD / initialDistance;
    } else {
      stretchFactor = touchDistance / initialDistance;
    }
    
  } else {
    hasTwoTouches = false;
    
    // Reset transformations when not touching
    stretchFactor = 1;
    rotationAngle = 0;
    translateX = 0;
    translateY = 0;
  }
}

function updateCharacterAppearance() {
  // Determine which character image to use based on state
  if (isStressed) {
    currentCharacterImg = characterImages.stressed;
  } else {
    // Use stretched/compressed images based on stretch factor
    if (stretchFactor > 1.2) {
      currentCharacterImg = characterImages.stretched;
    } else if (stretchFactor < 0.8) {
      currentCharacterImg = characterImages.compressed;
    } else {
      // Use normal images based on direction
      if (characterDirection === 1) {
        currentCharacterImg = characterImages.normalRight;
      } else {
        currentCharacterImg = characterImages.normalLeft;
      }
    }
  }
}

function drawTransformedCharacter() {
  // Calculate character dimensions with stretching
  let charWidth = baseWidth * stretchFactor;
  let charHeight = baseHeight;
  
  // Use character's current position as base, modified by translation
  let charX = character.x + translateX;
  let charY = character.y + translateY;
  
  // Save the current transformation state
  push();
  
  // Apply transformations at character position
  translate(charX, charY);
  rotate(rotationAngle);
  
  // Draw the character centered at the transformation point
  imageMode(CENTER);
  image(currentCharacterImg, 0, 0, charWidth, charHeight/2);
  
  // Restore the transformation state
  pop();
}

// ==============================================
// CHARACTER CONTROLLER FUNCTIONS
// ==============================================
function deviceShaken() {
  if (window.sensorsEnabled) {
    shakeIntensity += 1.0;
    shakeIntensity = constrain(shakeIntensity, 0, 10);
    
    stress += STRESS_SHAKE_INCREASE;
    stress = constrain(stress, 0, 100);
    
    triggerStressedState();
  }
}

function triggerStressedState() {
  isStressed = true;
  stressCooldown = 60;
  
  targetX = character.x;
  targetY = character.y;
}

function updateStressState() {
  if (isStressed) {
    stressCooldown--;
    if (stressCooldown <= 0) {
      isStressed = false;
      chooseNewWanderTarget();
    }
  }
}

function updateShakeIntensity() {
  shakeIntensity *= SHAKE_DECAY;
  if (shakeIntensity < 0.01) shakeIntensity = 0;
}

function updateStressParameter() {
  stress -= STRESS_RECOVERY;
  stress = constrain(stress, 0, 100);
  displayStress = lerp(displayStress, stress, STRESS_VISUAL_INERTIA);
}

function updateWandering() {
  if (!isStressed) {
    wanderTimer++;
    if (wanderTimer >= WANDER_INTERVAL) {
      chooseNewWanderTarget();
      wanderTimer = 0;
    }
  }
}

function chooseNewWanderTarget() {
  targetX = random(80, width - 80);
  targetY = random(100, height - 100);
}

// function updateCharacterColor() {
//   let r = map(displayStress, 0, 100, 100, 255);
//   let g = map(displayStress, 0, 100, 255, 50);
//   let b = 100;
//   // Apply color tint to character (will be used in draw)
//   tint(r, g, b);
// }

function updateStressJitter() {
  let jitterAmount = 0;
  if (stress >= STRESS_PANIC_THRESHOLD) {
    jitterAmount = map(stress, STRESS_PANIC_THRESHOLD, 100, 3, 8);
    jitterAmount += shakeIntensity * 0.5;
  } else if (stress >= STRESS_WARNING_THRESHOLD) {
    jitterAmount = map(stress, STRESS_WARNING_THRESHOLD, STRESS_PANIC_THRESHOLD, 0, 3);
    jitterAmount += shakeIntensity * 0.3;
  }
  jitterX = random(-jitterAmount, jitterAmount);
  jitterY = random(-jitterAmount, jitterAmount);
}

function updateMovementSpeed() {
  if (!isStressed) {
    if (stress >= STRESS_PANIC_THRESHOLD) {
      currentSpeed = BASE_WALK_SPEED * 1.8;
    } else if (stress >= STRESS_WARNING_THRESHOLD) {
      currentSpeed = BASE_WALK_SPEED * 1.2;
    } else {
      currentSpeed = BASE_WALK_SPEED;
    }
  }
}

function moveCharacterToTarget() {
  if (!isStressed) {
    let distance = dist(character.x, character.y, targetX, targetY);
    let oldDirection = characterDirection;
    
    if (targetX > character.x) {
      characterDirection = 1;
    } else if (targetX < character.x) {
      characterDirection = -1;
    }
    
    if (oldDirection !== characterDirection) {
      // Direction change handled in updateCharacterAppearance
    }
    
    if (distance > 10) {
      character.moveTo(targetX, targetY, currentSpeed);
      if (jitterX !== 0 || jitterY !== 0) {
        character.x += jitterX;
        character.y += jitterY;
      }
    } else {
      chooseNewWanderTarget();
    }
  }
}

// ==============================================
// UI FUNCTIONS
// ==============================================
function drawUI() {
  if (!showUI) return;
  
  drawStressBar();
  drawShakeIndicator();
  drawStretchUI();
  drawCharacterUI();
}

function drawStretchUI() {
  // Only show stretch UI when actively touching
  if (touches.length >= 2) {
    push();
    textAlign(LEFT, TOP);
    textSize(14);
    fill(255);
    
    let yPos = 120;
    text("Touch 1: (" + Math.round(touch1X) + ", " + Math.round(touch1Y) + ")", 20, yPos);
    yPos += 20;
    text("Touch 2: (" + Math.round(touch2X) + ", " + Math.round(touch2Y) + ")", 20, yPos);
    yPos += 20;
    text("Distance: " + Math.round(touchDistance) + " pixels", 20, yPos);
    yPos += 20;
    text("Stretch: " + stretchFactor.toFixed(2) + "x", 20, yPos);
    yPos += 20;
    text("Rotation: " + degrees(rotationAngle).toFixed(1) + "°", 20, yPos);
    yPos += 20;
    text("Translation: (" + Math.round(translateX) + ", " + Math.round(translateY) + ")", 20, yPos);
    yPos += 25;
    
    // Display current character state
    let charState = "Normal";
    let stateColor = [100, 100, 255];
    
    if (isStressed) {
      charState = "Stressed";
      stateColor = [255, 100, 100];
    } else if (stretchFactor > 1.2) {
      charState = "Stretched";
      stateColor = [100, 255, 100];
    } else if (stretchFactor < 0.8) {
      charState = "Compressed";
      stateColor = [255, 200, 100];
    }
    
    fill(stateColor[0], stateColor[1], stateColor[2]);
    text("Character: " + charState, 20, yPos);
    pop();
  } else {
    // Show instructions when not touching
    push();
    textAlign(CENTER, CENTER);
    textSize(16);
    fill(250, 250, 250);
    text("Touch 2 points to stretch character", width/2, height - 100);
    text("Shake device to stress character", width/2, height - 70);
    pop();
  }
}

function drawCharacterUI() {
  push();
  let x = width - 200;
  let y = 120;
  let lineHeight = 18;
  
  fill(0, 0, 0, 180);
  noStroke();
  rect(x - 10, y - 10, 190, 120, 5);
  
  fill(255, 200, 0);
  textAlign(LEFT, TOP);
  textSize(14);
  text('CHARACTER STATE', x, y);
  y += lineHeight * 1.5;
  
  fill(255);
  textSize(12);
  text(`Stress: ${isStressed ? 'STRESSED 😫' : 'Normal 😌'}`, x, y);
  y += lineHeight;
  text(`Movement: ${isStressed ? 'PAUSED' : 'Wandering'}`, x, y);
  y += lineHeight;
  text(`Direction: ${characterDirection === 1 ? 'Right →' : 'Left ←'}`, x, y);
  y += lineHeight;
  text(`Speed: ${currentSpeed.toFixed(2)}x`, x, y);
  y += lineHeight;
  text(`Stretch: ${stretchFactor.toFixed(2)}x`, x, y);
  
  pop();
}

function drawStressBar() {
  push();
  noStroke();
  fill(50, 50, 60);
  rect(20, 20, width - 40, 30, 5);
  
  let barWidth = map(displayStress, 0, 100, 0, width - 40);
  let r = map(displayStress, 0, 100, 100, 255);
  let g = map(displayStress, 0, 100, 255, 50);
  fill(r, g, 100);
  rect(20, 20, barWidth, 30, 5);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(`STRESS: ${floor(stress)}`, width / 2, 35);
  pop();
}

function drawShakeIndicator() {
  push();
  let meterX = 20;
  let meterY = 70;
  let meterWidth = 150;
  let meterHeight = 20;
  
  noStroke();
  fill(40, 40, 50);
  rect(meterX, meterY, meterWidth, meterHeight, 3);
  
  let intensityWidth = map(shakeIntensity, 0, 10, 0, meterWidth);
  fill(255, 150, 0);
  rect(meterX, meterY, intensityWidth, meterHeight, 3);
  
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(12);
  text('Shake:', meterX, meterY - 10);
  text(shakeIntensity.toFixed(2), meterX + meterWidth + 10, meterY + meterHeight / 2);
  
  pop();
}

// ==============================================
// INPUT HANDLING
// ==============================================
function keyPressed() {
  if (key === ' ') {
    showUI = !showUI;
    return false;
  }
}

function mousePressed() {
  return false;
}

function touchStarted() {
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}