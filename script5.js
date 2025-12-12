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

// SOUND VARIABLES
let shakeSound;
let angrySound;
let angrySoundPlaying = false; // Track if angry sound is already playing
let soundEnabled = true;

// Distance thresholds
const MIN_DISTANCE_THRESHOLD = 130;
const MAX_DISTANCE_THRESHOLD = 400;

// IDLE SYSTEM
let lastInteractionTime = 0;
let isIdleAnimation = false;
let idleStartTime = 0;

const IDLE_DELAY = 15000;   // 15 seconds until angry
const IDLE_DURATION = 5000; // 5 seconds angry

// Device motion variables
let lastAccelerationX = 0;
let lastAccelerationY = 0;
let lastAccelerationZ = 0;
let sensorsEnabled = false;



// PRELOAD
function preload() {
  characterImages.normalRight = loadImage('sasha.jpg');
  characterImages.normalLeft = loadImage('sasha-back.jpg');
  characterImages.stressed = loadImage('sasha-crumple.png');
  characterImages.stretched = loadImage('sasha-front-ripped.png');
  characterImages.compressed = loadImage('sasha-rolled.png');
  characterImages.angry = loadImage('sasha-angry.gif');

  shakeSound = loadSound('sasha-crumple.mp3');
  angrySound = loadSound('sasha-angry.mp3'); 
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
        exitIdleAnimation(); // This will stop the angry sound
      }
    }
  }, { passive: false });
});

  textAlign(CENTER, CENTER);
  textSize(24);

  setupCharacter();
  
  // Initialize device motion
  initDeviceMotion();
}

function setupCharacter() {
  character = { x: width / 2, y: height / 2 };
  currentCharacterImg = characterImages.normalRight;
  lastInteractionTime = millis();
}

// INITIALIZE DEVICE MOTION
function initDeviceMotion() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    // iOS 13+ requires permission
    let permissionBtn = createButton('Enable Shake Detection');
    permissionBtn.position(width/2 - 100, height/2 + 200);
    permissionBtn.style('font-size', '20px');
    permissionBtn.style('padding', '15px 30px');
    permissionBtn.style('background-color', '#4CAF50');
    permissionBtn.style('color', 'white');
    permissionBtn.style('border', 'none');
    permissionBtn.style('border-radius', '5px');
    permissionBtn.mousePressed(requestMotionPermission);
  } else {
    // Android or non-iOS devices
    window.addEventListener('devicemotion', handleDeviceMotion);
    sensorsEnabled = true;
  }
}

function requestMotionPermission() {
  DeviceMotionEvent.requestPermission()
    .then(permissionState => {
      if (permissionState === 'granted') {
        window.addEventListener('devicemotion', handleDeviceMotion);
        sensorsEnabled = true;
        document.querySelector('button').remove();
        console.log('Shake detection enabled!');
      }
    })
    .catch(console.error);
}

// HANDLE DEVICE MOTION FOR SHAKE DETECTION
function handleDeviceMotion(event) {
  if (!sensorsEnabled) return;
  
  let acceleration = event.acceleration;
  if (!acceleration) return;
  
  let accX = acceleration.x || 0;
  let accY = acceleration.y || 0;
  let accZ = acceleration.z || 0;
  
  // Calculate change in acceleration
  let deltaX = Math.abs(accX - lastAccelerationX);
  let deltaY = Math.abs(accY - lastAccelerationY);
  let deltaZ = Math.abs(accZ - lastAccelerationZ);
  
  // Update last values
  lastAccelerationX = accX;
  lastAccelerationY = accY;
  lastAccelerationZ = accZ;
  
  // Check if device is being shaken (threshold can be adjusted)
  let shakeThreshold = 15; // Higher = need harder shake
  
  if (deltaX > shakeThreshold || deltaY > shakeThreshold || deltaZ > shakeThreshold) {
    // Simulate deviceShaken() function
    shakeDetected();
  }
}

// SHAKE DETECTED - called from device motion handler
function shakeDetected() {
  if (!sensorsEnabled) return;
  
  shakeIntensity = constrain(shakeIntensity + 1.0, 0, 10);
  stress = constrain(stress + STRESS_SHAKE_INCREASE, 0, 100);
  triggerStressedState();
  lastInteractionTime = millis();
  
  // PLAY SHAKE SOUND
  if (soundEnabled && shakeSound) {
    // Set volume based on shake intensity
    let volume = map(min(shakeIntensity, 10), 0, 10, 0.3, 1.0);
    shakeSound.setVolume(volume);
    
    // Optional: Add some randomness to pitch for variety
    let rate = random(0.9, 1.1);
    shakeSound.rate(rate);
    
    // Play sound (stop first to avoid overlapping sounds)
    shakeSound.stop();
    shakeSound.play();
  }
  
  // Cancel idle if active
  if (isIdleAnimation) {
    exitIdleAnimation();
  }
  
  console.log("Shake detected! Stress:", stress);
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
  
  // Debug display
  fill(255);
  text(`Stretch: ${stretchFactor.toFixed(2)} | Stress: ${stress.toFixed(1)} | Shake: ${shakeIntensity.toFixed(2)}`, width/2, 50);
  text(`Idle: ${isIdleAnimation} | Sensors: ${sensorsEnabled}`, width/2, 80);
  
  // Show enable button if sensors not enabled
  if (!sensorsEnabled && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    fill(255, 0, 0);
  }
}

// STRETCHING SYSTEM
function updateStretching() {
  if (touches && touches.length >= 2) {
    let t1 = touches[0];
    let t2 = touches[1];

    if (!t1 || !t2) return;

    if (!hasTwoTouches) {
      // Start new pinch gesture
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

    // Calculate stretch factor based on distance
    let newStretch = touchDistance / initialDistance;
    
    // Apply constraints
    if (touchDistance > MAX_DISTANCE_THRESHOLD) {
      stretchFactor = MAX_DISTANCE_THRESHOLD / initialDistance;
    } else if (touchDistance < MIN_DISTANCE_THRESHOLD) {
      stretchFactor = MIN_DISTANCE_THRESHOLD / initialDistance;
    } else {
      stretchFactor = newStretch;
    }
    
    // Update interaction time for idle system
    lastInteractionTime = millis();
  } else {
    hasTwoTouches = false;
    // Slowly return to normal when no touches
    stretchFactor = lerp(stretchFactor, 1, 0.1);
    rotationAngle = lerp(rotationAngle, 0, 0.1);
    translateX = lerp(translateX, 0, 0.1);
    translateY = lerp(translateY, 0, 0.1);
    
    if (abs(stretchFactor - 1) < 0.01) stretchFactor = 1;
    if (abs(rotationAngle) < 0.01) rotationAngle = 0;
    if (abs(translateX) < 0.5) translateX = 0;
    if (abs(translateY) < 0.5) translateY = 0;
  }
}

// IMAGE SELECTION
function updateCharacterAppearance() {
  // IDLE (ANGRY) STATE - highest priority, but check if idle is active
  if (isIdleAnimation) {
    currentCharacterImg = characterImages.angry;
    return;
  }
  
  // STRETCHED STATE - check stretching first (if user is actively stretching)
  if (stretchFactor > 1.2) {
    currentCharacterImg = characterImages.stretched;
    return;
  }
  
  // COMPRESSED STATE
  if (stretchFactor < 0.8) {
    currentCharacterImg = characterImages.compressed;
    return;
  }
  
  // STRESSED STATE
  if (isStressed) {
    currentCharacterImg = characterImages.stressed;
    return;
  }
  
  // NORMAL STATE
  currentCharacterImg = characterImages.normalRight;
}

// DRAW CHARACTER
function drawTransformedCharacter() {
  let img = currentCharacterImg;
  if (!img) {
    // Fallback if image not loaded
    fill(255, 0, 0);
    ellipse(width/2, height/2, 100, 100);
    return;
  }

  let scaledW = baseWidth * stretchFactor;
  let scaledH = baseHeight;

  push();
  translate(character.x + translateX, character.y + translateY);
  rotate(rotationAngle);
  scale(uniformScale);
  imageMode(CENTER);
  
  // Draw character image
  image(img, 0, -200, scaledW*1.2, scaledH/1.7);
  
  pop();
}

// STRESS SYSTEM FUNCTIONS
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
  if (!isIdleAnimation) {
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
  
  // If interacting and not currently idle, reset idle timer
  if (interacting && !isIdleAnimation) {
    lastInteractionTime = now;
  }
  
  // Check if we should ENTER idle (angry) state
  if (!isIdleAnimation && now - lastInteractionTime > IDLE_DELAY) {
    enterIdleAnimation();
  }
  
  // Check if we should EXIT idle (angry) state
  if (isIdleAnimation && now - idleStartTime > IDLE_DURATION) {
    exitIdleAnimation();
  }
  
  // Apply idle effects if in angry state
  if (isIdleAnimation) {
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
  isStressed = true;
  stress = 100;
  stressCooldown = 999; // Keep stressed while angry
  
  // PLAY ANGRY SOUND
  if (soundEnabled && angrySound && !angrySoundPlaying) {
    angrySound.setVolume(0.7);
    angrySound.loop(); // Loop the angry sound
    angrySoundPlaying = true;
    console.log("Angry sound started");
  }
}

function exitIdleAnimation() {
  console.log("Exiting idle (angry) state");
  isIdleAnimation = false;
  isStressed = false;
  stress = 0;
  stressCooldown = 0;
  shakeIntensity = 0;
  uniformScale = 1;
  lastInteractionTime = millis(); // Reset interaction timer
  
  // STOP ANGRY SOUND
  if (angrySound && angrySoundPlaying) {
    angrySound.stop();
    angrySoundPlaying = false;
    console.log("Angry sound stopped");
  }
}

// TOUCH → CHARACTER CHECK
function isTouchOnCharacter(x, y) {
  // Simple circle collision
  let charRadius = 150;
  let dx = x - (character.x + translateX);
  let dy = y - (character.y + translateY);
  return dx * dx + dy * dy < charRadius * charRadius;
}

// WINDOW RESIZE
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  character.x = width / 2;
  character.y = height / 2;
}

// FALLBACK SHAKE FUNCTION FOR NON-MOBILE (keyboard testing)
function keyPressed() {
  if (key === 's' || key === 'S') {
    // Simulate shake with 'S' key for testing on desktop
    shakeDetected();
  }
}