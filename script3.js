// ==============================================
// STRETCHABLE CHARACTER WITH SHAKE EFFECTS
// (NO MOVEMENT — CHARACTER ALWAYS CENTERED)
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

// No movement allowed anymore
const BASE_WALK_SPEED = 0;

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

// Distance thresholds
const MIN_DISTANCE_THRESHOLD = 130;
const MAX_DISTANCE_THRESHOLD = 400;

// UI
let sensorsActive = false;

// ==============================================
// PRELOAD
// ==============================================
function preload() {
  characterImages.normalRight = loadImage('sasha.jpg');
  characterImages.normalLeft = loadImage('sasha-back.jpg');
  characterImages.stressed = loadImage('sasha-crumple.png');
  characterImages.stretched = loadImage('sasha-front-ripped.png');
  characterImages.compressed = loadImage('sasha-rolled.png');
}

// ==============================================
// SETUP
// ==============================================
function setup() {
  createCanvas(windowWidth, windowHeight);

  let canvasElement = document.querySelector('canvas');
  canvasElement.style.touchAction = 'none';
  lockGestures();
  enableGyroTap('Tap to enable shake detection');

  ['touchstart','touchmove','touchend','touchcancel'].forEach(ev=>{
    canvasElement.addEventListener(ev, e=>e.preventDefault(), { passive:false });
  });

  textAlign(CENTER, CENTER);
  textSize(24);

  setupCharacter();
}

function setupCharacter() {
  character = { x: width / 2, y: height / 2 }; // no Sprite needed
  currentCharacterImg = characterImages.normalRight;
}

// ==============================================
// DRAW LOOP
// ==============================================
function draw() {
  background(0);

  sensorsActive = window.sensorsEnabled || false;

  updateShakeIntensity();
  updateStressParameter();
  updateStressState();
  updateStretching();
  updateStressJitter();
  updateCharacterAppearance();

  drawTransformedCharacter();
}

// ==============================================
// STRETCHING SYSTEM
// ==============================================
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

// ==============================================
// IMAGE SELECTION
// ==============================================
function updateCharacterAppearance() {
  if (isStressed) currentCharacterImg = characterImages.stressed;
  else if (stretchFactor > 1.2) currentCharacterImg = characterImages.stretched;
  else if (stretchFactor < 0.8) currentCharacterImg = characterImages.compressed;
  else currentCharacterImg = characterImages.normalRight;
}

// ==============================================
// DRAW CHARACTER
// ==============================================
function drawTransformedCharacter() {
  let img = currentCharacterImg;

  let scaledW = baseWidth * stretchFactor; // stretch ONLY horizontally
  let scaledH = baseHeight;                // height stays fixed forever

  push();
  translate(character.x + translateX, character.y + translateY);
  rotate(rotationAngle);
  imageMode(CENTER);

  image(img, 0, -200, scaledW, scaledH/2);
  pop();
}



// ==============================================
// SHAKE + STRESS SYSTEM
// ==============================================
function deviceShaken() {
  if (!window.sensorsEnabled) return;
  shakeIntensity = constrain(shakeIntensity + 1.0, 0, 10);
  stress = constrain(stress + STRESS_SHAKE_INCREASE, 0, 100);
  triggerStressedState();
}

function triggerStressedState() {
  isStressed = true;
  stressCooldown = 60;
}

function updateStressState() {
  if (isStressed) {
    stressCooldown--;
    if (stressCooldown <= 0) isStressed = false;
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

// ==============================================
// TOUCH → CHARACTER CHECK
// ==============================================
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

// ==============================================
// WINDOW RESIZE
// ==============================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
