// ==============================================
// STRETCHABLE CHARACTER WITH SHAKE EFFECTS
// ==============================================

// CHARACTER VARIABLES
let character;
let characterImages = {};
let currentCharacterImg;
let isStressed = false;
let stressCooldown = 0;

// Global shake and stress variables
let shakeIntensity = 0;
let stress = 0;
let displayStress = 0;

// Stress parameters
const STRESS_SHAKE_INCREASE = 8;
const STRESS_RECOVERY = 0.15;
const STRESS_PANIC_THRESHOLD = 70;
const STRESS_WARNING_THRESHOLD = 40;
const SHAKE_DECAY = 0.92;
const STRESS_VISUAL_INERTIA = 0.12;

// STRETCHING VARIABLES
let stretchFactor = 1;
let rotationAngle = 0;
let translateX = 0;
let translateY = 0;
let baseWidth = 300;
let baseHeight = 300;
let uniformScale = 1;

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

// Distance thresholds
const MIN_DISTANCE_THRESHOLD = 130;
const MAX_DISTANCE_THRESHOLD = 400;

// IDLE SYSTEM
let lastInteractionTime = 0;
let isIdleAnimation = false;
let idleStartTime = 0;
let idleTransitionTime = 0;

const IDLE_DELAY = 15000;   // 15 seconds until angry
const IDLE_DURATION = 5000; // 5 seconds angry
const IDLE_TRANSITION = 1000; // 1 second to transition back

// Character state management
let characterState = 'normal'; // normal, stressed, stretched, compressed, angry

// PRELOAD
function preload() {
  characterImages.normalRight = loadImage('sasha.jpg');
  characterImages.normalLeft = loadImage('sasha-back.jpg');
  characterImages.stressed = loadImage('sasha-crumple.png');
  characterImages.stretched = loadImage('sasha-front-ripped.png');
  characterImages.compressed = loadImage('sasha-rolled.png');
  characterImages.angry = loadImage('sasha-angry.gif');
}

// SETUP
function setup() {
  createCanvas(windowWidth, windowHeight);

  let canvasElement = document.querySelector('canvas');
  canvasElement.style.touchAction = 'none';
  
  // Add touch event listeners
  ['touchstart','touchmove','touchend','touchcancel'].forEach(ev => {
    canvasElement.addEventListener(ev, e => {
      e.preventDefault();
      lastInteractionTime = millis();
      
      // Cancel idle if tapping the character
      if (ev === 'touchstart' && touches.length > 0) {
        let t = touches[0];
        if (isTouchOnCharacter(t.x, t.y) && isIdleAnimation) {
          exitIdleAnimation();
        }
      }
    }, { passive: false });
  });

  textAlign(CENTER, CENTER);
  textSize(24);

  setupCharacter();
}

function setupCharacter() {
  character = { x: width / 2, y: height / 2 };
  currentCharacterImg = characterImages.normalRight;
  lastInteractionTime = millis();
}

// DRAW LOOP
function draw() {
  background(0);

  updateIdleSystem();
  updateShakeIntensity();
  updateStressParameter();
  updateStressState();
  updateStretching();
  updateStressJitter();
  updateCharacterAppearance();

  drawTransformedCharacter();
  
//   // Debug display
//   fill(255);
//   text(`State: ${characterState} | Idle: ${isIdleAnimation}`, width/2, 50);
}

// STRETCHING SYSTEM
function updateStretching() {
  if (touches && touches.length >= 2) {
    let t1 = touches[0];
    let t2 = touches[1];

    if (!t1 || !t2) return;

    if (areBothTouchesOnCharacter()) {
      if (!hasTwoTouches) {
        initialDistance = dist(t1.x, t1.y, t2.x, t2.y);
        initialAngle = atan2(t2.y - t1.y, t2.x - t1.x);
        initialMidX = (t1.x + t2.x) / 2;
        initialMidY = (t1.y + t2.y) / 2;
        hasTwoTouches = true;
      }

      touch1X = t1.x;
      touch1Y = t1.y;
      touch2X = t2.x;
      touch2Y = t2.y;

      touchDistance = dist(touch1X, touch1Y, touch2X, touch2Y);

      let currentMidX = (touch1X + touch2X) / 2;
      let currentMidY = (touch1Y + touch2Y) / 2;

      rotationAngle = atan2(touch2Y - touch1Y, touch2X - touch1X) - initialAngle;

      translateX = currentMidX - initialMidX;
      translateY = currentMidY - initialMidY;

      if (touchDistance > MAX_DISTANCE_THRESHOLD)
        stretchFactor = MAX_DISTANCE_THRESHOLD / initialDistance;
      else if (touchDistance < MIN_DISTANCE_THRESHOLD)
        stretchFactor = MIN_DISTANCE_THRESHOLD / initialDistance;
      else
        stretchFactor = touchDistance / initialDistance;
    }
  } else {
    hasTwoTouches = false;
    stretchFactor = 1;
    rotationAngle = 0;
    translateX = 0;
    translateY = 0;
  }
}

// IMAGE SELECTION
function updateCharacterAppearance() {
  // IDLE (ANGRY) STATE - highest priority
  if (characterState === 'angry') {
    currentCharacterImg = characterImages.angry;
    return;
  }
  
  // STRETCHED STATE
  if (stretchFactor > 1.2) {
    characterState = 'stretched';
    currentCharacterImg = characterImages.stretched;
    return;
  }
  
  // COMPRESSED STATE
  if (stretchFactor < 0.8) {
    characterState = 'compressed';
    currentCharacterImg = characterImages.compressed;
    return;
  }
  
  // STRESSED STATE
  if (isStressed) {
    characterState = 'stressed';
    currentCharacterImg = characterImages.stressed;
    return;
  }
  
  // NORMAL STATE
  characterState = 'normal';
  currentCharacterImg = characterImages.normalRight;
}

// DRAW CHARACTER
function drawTransformedCharacter() {
  let img = currentCharacterImg;
  if (!img) return; // Safety check

  let scaledW = baseWidth * stretchFactor;
  let scaledH = baseHeight;

  push();
  translate(character.x + translateX, character.y + translateY);
  rotate(rotationAngle);
  scale(uniformScale);
  imageMode(CENTER);
  
  // Draw character image
  image(img, 0, -200, scaledW * 1.2, scaledH / 1.8);
  
  pop();
}

// SHAKE + STRESS SYSTEM
function deviceShaken() {
  shakeIntensity = constrain(shakeIntensity + 1.0, 0, 10);
  stress = constrain(stress + STRESS_SHAKE_INCREASE, 0, 100);
  triggerStressedState();
  lastInteractionTime = millis();
  
  // Cancel idle if active
  if (isIdleAnimation) {
    exitIdleAnimation();
  }
}

function triggerStressedState() {
  isStressed = true;
  stressCooldown = 60;
}

function updateStressState() {
  if (isStressed) {
    stressCooldown--;
    if (stressCooldown <= 0) {
      isStressed = false;
    }
  }
}

function updateShakeIntensity() {
  shakeIntensity *= SHAKE_DECAY;
  if (shakeIntensity < 0.01) shakeIntensity = 0;
}

function updateStressParameter() {
  if (characterState !== 'angry') {
    stress -= STRESS_RECOVERY;
    stress = constrain(stress, 0, 100);
  }
  displayStress = lerp(displayStress, stress, STRESS_VISUAL_INERTIA);
}

let jitterX = 0;
let jitterY = 0;

function updateStressJitter() {
  let j = 0;
  if (stress >= STRESS_PANIC_THRESHOLD) j = map(stress, 70, 100, 3, 8);
  else if (stress >= STRESS_WARNING_THRESHOLD) j = map(stress, 40, 70, 0, 3);

  j += shakeIntensity * 0.5;

  jitterX = random(-j, j);
  jitterY = random(-j, j);

  character.x = width/2 + jitterX;
  character.y = height/2 + jitterY;
}

// IDLE SYSTEM
function updateIdleSystem() {
  let now = millis();
  
  // Check if user is interacting (touching or shaking)
  let interacting = touches.length > 0 || shakeIntensity > 0.5;
  
  // If interacting and not currently in angry state, reset idle timer
  if (interacting && characterState !== 'angry') {
    lastInteractionTime = now;
  }
  
  // Check if we should ENTER idle (angry) state
  if (!isIdleAnimation && characterState !== 'angry' && now - lastInteractionTime > IDLE_DELAY) {
    enterIdleAnimation();
  }
  
  // Check if we should EXIT idle (angry) state
  if (isIdleAnimation && now - idleStartTime > IDLE_DURATION) {
    exitIdleAnimation();
  }
  
  // Apply idle effects if in angry state
  if (characterState === 'angry') {
    uniformScale = 1.35;
    shakeIntensity = 4;
  } else {
    uniformScale = 1;
  }
}

function enterIdleAnimation() {
  console.log("Entering idle (angry) state");
  isIdleAnimation = true;
  idleStartTime = millis();
  characterState = 'angry';
  isStressed = true;
  stress = 100;
  stressCooldown = 999; // Keep stressed while angry
}

function exitIdleAnimation() {
  console.log("Exiting idle (angry) state");
  isIdleAnimation = false;
  characterState = 'normal';
  isStressed = false;
  stress = 0;
  stressCooldown = 0;
  shakeIntensity = 0;
  uniformScale = 1;
  lastInteractionTime = millis(); // Reset interaction timer
}

// TOUCH → CHARACTER CHECK
function isTouchOnCharacter(x, y) {
  let charWidth = baseWidth * stretchFactor;
  let charHeight = baseHeight;

  let cx = character.x + translateX;
  let cy = character.y + translateY;

  let localX = x - cx;
  let localY = y - cy;

  let cosA = cos(-rotationAngle);
  let sinA = sin(-rotationAngle);
  let rx = localX * cosA - localY * sinA;
  let ry = localX * sinA + localY * cosA;

  return abs(rx) <= charWidth / 2 && abs(ry) <= charHeight / 2;
}

function areBothTouchesOnCharacter() {
  if (touches.length < 2) return false;
  return isTouchOnCharacter(touches[0].x, touches[0].y) &&
         isTouchOnCharacter(touches[1].x, touches[1].y);
}

// WINDOW RESIZE
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  character.x = width / 2;
  character.y = height / 2;
}

// UI FUNCTIONS (stubs - add your actual implementations)
function lockGestures() {
  // Your gesture locking implementation
}

function enableGyroTap(message) {
  // Your gyro tap implementation
}