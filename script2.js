// ==============================================
// CHARACTER CONTROLLER TEMPLATE: SHAKE DETECTION + TOUCH STRETCH
// ==============================================
// This example demonstrates how DEVICE SHAKE can affect a parameter.
// 
// CONCEPT: "Shake Stress" - Device motion affects character state
// - Shaking the device INCREASES stress (negative effect)
// - Keeping device still allows stress recovery
// - Shake intensity tracked via global variable
// - High stress causes visual distortion and affects movement
// - Two-finger touch changes image and stretches character
//
// PATTERN: INPUT → PARAMETER → OUTPUT
// - INPUT: deviceShaken() sensor + Two-finger touch
// - PARAMETER: stress (0-100) + shakeIntensity (global variable)
// - OUTPUT: Color shift, position jitter, movement speed, image stretch
//
// ==============================================

// ==============================================
// GLOBAL VARIABLE: Shake Intensity
// ==============================================
let shakeIntensity = 0;  // Global variable: 0 (calm) to positive values (shaking)
                         // This can be positive or negative to affect stress differently

// ==============================================
// PARAMETER: Stress Level
// ==============================================
let stress = 0;  // Current stress level (0 = calm, 100 = maximum stress)

// Parameter configuration
const STRESS_SHAKE_INCREASE = 8;    // How much stress each shake adds (reduced from 25)
const STRESS_RECOVERY = 0.15;       // How fast stress decreases naturally
const STRESS_PANIC_THRESHOLD = 70;  // When character becomes very jittery
const STRESS_WARNING_THRESHOLD = 40; // When visual effects start

// Shake intensity decay
const SHAKE_DECAY = 0.92;  // How quickly shake intensity fades (0-1, lower = faster fade)

// Smoothing for visual changes
let displayStress = 0;  // Smoothed version for visual feedback
const STRESS_VISUAL_INERTIA = 0.12;  // How smoothly visuals change

// ==============================================
// CHARACTER SYSTEM
// ==============================================
let character;
let characterImageRight;
let characterImageLeft;
let stressedImageRight;
let stressedImageLeft;
let stretchedImage; // New stretched image
let isStressed = false;
let isStretched = false; // New stretched state
let stressCooldown = 0;
let stretchCooldown = 0; // New stretch cooldown

// Touch stretching variables
let touchDistance = 0;
let isTouchingCharacter = false;
let baseScale = 0.2;
let maxStretchScale = 1.5; // Maximum stretch scale
let minStretchScale = 0.1; // Minimum squeeze scale

// Movement settings - Autonomous wandering
const BASE_WALK_SPEED = 2.5;
let currentSpeed = BASE_WALK_SPEED;
let targetX = 0;
let targetY = 0;

// Wandering AI
let wanderTimer = 0;
const WANDER_INTERVAL = 120;  // Frames between choosing new destinations (2 seconds at 60fps)

// Jitter effect for high stress
let jitterX = 0;
let jitterY = 0;

// Character direction
let characterDirection = 1; // 1 for right, -1 for left

// UI Display
let showUI = true;
let sensorsActive = false;

// ==============================================
// PRELOAD - Load images before setup
// ==============================================
function preload() {
  // Load normal and stressed character images for both directions
  characterImageRight = loadImage('sasha.jpg'); // Replace with your normal right-facing image
  characterImageLeft = loadImage('sasha-back.jpg'); // Replace with your normal left-facing image
  stressedImageRight = loadImage('sasha-crumple.png'); // Replace with your stressed right-facing image
  stressedImageLeft = loadImage('sasha-crumple.png'); // Replace with your stressed left-facing image
  stretchedImage = loadImage('sasha-crumple.png'); // Replace with your stretched image
}

// ==============================================
// SETUP - Runs once when page loads
// ==============================================
function setup() {
  // Create portrait canvas (9:16 aspect ratio for mobile)
  createCanvas(windowWidth, windowHeight);
  
  // Lock mobile gestures (prevent zoom/refresh)
  lockGestures();
  
  // Enable device motion sensors with tap
  enableGyroTap('Tap to enable shake detection');
  
  // Turn off physics gravity
  world.gravity.y = 0;
  
  // Create character sprite at center
  character = new Sprite(width / 2, height / 2);
  character.scale = baseScale;
  character.physics = 'kinematic';
  character.collider = 'none';
  
  // Set the initial character image (facing right)
  character.img = characterImageRight;
  
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
  
  // Update systems
  updateShakeIntensity();
  updateStressParameter();
  updateStressState();
  updateStretchState(); // New stretch state management
  updateTouchStretching(); // New touch stretching system
  
  // Only update wandering and movement if not stressed AND not stretched
  if (!isStressed && !isStretched) {
    updateWandering();
    updateMovementSpeed();
    moveCharacterToTarget();
  } else {
    // Apply jitter even when paused (if stressed)
    if (isStressed) {
      character.x += jitterX;
      character.y += jitterY;
    }
  }
  
  updateCharacterColor();
  updateStressJitter();
  
  // Visual elements
  drawStressBar();
  drawShakeIndicator();
  drawTouchIndicator(); // New touch indicator
  
  // UI overlay
  if (showUI) {
    drawUI();
  }
}

// ==============================================
// NEW: TOUCH STRETCHING SYSTEM
// ==============================================
function updateTouchStretching() {
  // Only measure when there are exactly 2 touches AND character is being touched
  if (touches.length === 2 && isTouchingCharacter) {
    // Get positions of both touches
    let x1 = touches[0].x;
    let y1 = touches[0].y;
    let x2 = touches[1].x;
    let y2 = touches[1].y;
    
    // Calculate distance using Pythagorean theorem
    touchDistance = dist(x1, y1, x2, y2);
    
    // Trigger stretched state if not already stretched
    if (!isStretched) {
      triggerStretchedState();
    }
    
    // Calculate stretch scale based on touch distance
    // Use a base distance of 100 pixels for normal scale
    let stretchScale = map(touchDistance, 50, 300, minStretchScale, maxStretchScale);
    stretchScale = constrain(stretchScale, minStretchScale, maxStretchScale);
    
    // Apply stretch to character
    character.scale = stretchScale;
    
  } else if (touches.length !== 2 && isStretched) {
    // End stretch when not using two fingers
    endStretchedState();
  }
  
  // Update touch detection
  updateTouchCharacterDetection();
}

function updateTouchCharacterDetection() {
  isTouchingCharacter = false;
  
  // Check if any touch is on the character
  for (let touch of touches) {
    let distance = dist(touch.x, touch.y, character.x, character.y);
    // Consider it touching if within character bounds (adjust based on scale)
    let touchRadius = (character.width * character.scale) / 2;
    if (distance < touchRadius) {
      isTouchingCharacter = true;
      break;
    }
  }
}

function triggerStretchedState() {
  isStretched = true;
  stretchCooldown = 5; // Short cooldown to prevent flickering
  
  // Change to stretched image
  character.img = stretchedImage;
  
  // Stop movement
  targetX = character.x;
  targetY = character.y;
  
  console.log('🔴 STRETCHED STATE: Movement paused, image changed to stretched');
}

function endStretchedState() {
  isStretched = false;
  
  // Return to appropriate image based on direction and stress state
  if (isStressed) {
    if (characterDirection === 1) {
      character.img = stressedImageRight;
    } else {
      character.img = stressedImageLeft;
    }
  } else {
    if (characterDirection === 1) {
      character.img = characterImageRight;
    } else {
      character.img = characterImageLeft;
    }
  }
  
  // Reset scale
  character.scale = baseScale;
  
  // Resume wandering if not stressed
  if (!isStressed) {
    chooseNewWanderTarget();
  }
  
  console.log('🔵 STRETCH ENDED: Returning to normal');
}

function updateStretchState() {
  if (isStretched) {
    stretchCooldown--;
  }
}

// ==============================================
// INPUT DETECTION: Device Shake Event
// ==============================================
function deviceShaken() {
  // Only respond if sensors are enabled
  if (window.sensorsEnabled) {
    // Increase global shake intensity variable
    shakeIntensity += 1.0;
    
    // Cap shake intensity
    shakeIntensity = constrain(shakeIntensity, 0, 10);
    
    // Add stress based on shake
    stress += STRESS_SHAKE_INCREASE;
    stress = constrain(stress, 0, 100);
    
    // Trigger stressed state
    triggerStressedState();
    
    console.log('🔔 SHAKE DETECTED! Intensity:', shakeIntensity.toFixed(2), 'Stress:', stress.toFixed(1));
  }
}

// ==============================================
// STRESS STATE MANAGEMENT
// ==============================================
function triggerStressedState() {
  isStressed = true;
  stressCooldown = 60; // 1 second at 60fps
  
  // Change to stressed image based on current direction
  if (characterDirection === 1) {
    character.img = stressedImageRight;
  } else {
    character.img = stressedImageLeft;
  }
  
  // Stop movement by clearing target
  targetX = character.x;
  targetY = character.y;
  
  console.log('😫 STRESSED STATE: Movement paused, image changed');
}

function updateStressState() {
  if (isStressed) {
    stressCooldown--;
    
    // Return to normal state when cooldown ends
    if (stressCooldown <= 0) {
      isStressed = false;
      
      // Return to normal image based on current direction
      if (characterDirection === 1) {
        character.img = characterImageRight;
      } else {
        character.img = characterImageLeft;
      }
      
      // Resume wandering by choosing new target
      chooseNewWanderTarget();
      
      console.log('😌 RETURNED TO NORMAL: Movement resumed');
    }
  }
}

// ==============================================
// PARAMETER UPDATE: Shake Intensity
// ==============================================
function updateShakeIntensity() {
  // Shake intensity naturally decays over time
  shakeIntensity *= SHAKE_DECAY;
  
  // Clamp to zero if very small
  if (shakeIntensity < 0.01) {
    shakeIntensity = 0;
  }
}

// ==============================================
// PARAMETER UPDATE: Stress System
// ==============================================
function updateStressParameter() {
  // Natural stress recovery (always happening)
  stress -= STRESS_RECOVERY;
  stress = constrain(stress, 0, 100);
  
  // Update smooth display value
  displayStress = lerp(displayStress, stress, STRESS_VISUAL_INERTIA);
}

// ==============================================
// CHARACTER AI: Autonomous Wandering
// ==============================================
function updateWandering() {
  // Only wander if not stressed AND not stretched
  if (!isStressed && !isStretched) {
    // Timer to choose new destinations
    wanderTimer++;
    
    if (wanderTimer >= WANDER_INTERVAL) {
      chooseNewWanderTarget();
      wanderTimer = 0;
    }
  }
}

function chooseNewWanderTarget() {
  // Pick random point on screen (with margins)
  targetX = random(80, width - 80);
  targetY = random(100, height - 100);
}

// ==============================================
// OUTPUT FUNCTION: Character Color
// ==============================================
function updateCharacterColor() {
  // Map stress to color: Green (calm) → Yellow → Red (stressed)
  let r = map(displayStress, 0, 100, 100, 255);
  let g = map(displayStress, 0, 100, 255, 50);
  let b = 100;
  
  character.color = color(r, g, b);
}

// ==============================================
// OUTPUT FUNCTION: Stress Jitter
// ==============================================
function updateStressJitter() {
  // High stress causes position jitter
  // Combine stress and current shake intensity for maximum effect
  let jitterAmount = 0;
  
  if (stress >= STRESS_PANIC_THRESHOLD) {
    // Panic level - extreme jitter
    jitterAmount = map(stress, STRESS_PANIC_THRESHOLD, 100, 3, 8);
    // Add extra jitter based on current shake intensity
    jitterAmount += shakeIntensity * 0.5;
  } else if (stress >= STRESS_WARNING_THRESHOLD) {
    // Warning level - mild jitter
    jitterAmount = map(stress, STRESS_WARNING_THRESHOLD, STRESS_PANIC_THRESHOLD, 0, 3);
    jitterAmount += shakeIntensity * 0.3;
  }
  
  jitterX = random(-jitterAmount, jitterAmount);
  jitterY = random(-jitterAmount, jitterAmount);
}

// ==============================================
// OUTPUT FUNCTION: Movement Speed
// ==============================================
function updateMovementSpeed() {
  // Only update speed if not stressed AND not stretched
  if (!isStressed && !isStretched) {
    // Stress affects movement speed
    if (stress >= STRESS_PANIC_THRESHOLD) {
      // Panicked - erratic fast movement
      currentSpeed = BASE_WALK_SPEED * 1.8;
    } else if (stress >= STRESS_WARNING_THRESHOLD) {
      // Anxious - slightly faster
      currentSpeed = BASE_WALK_SPEED * 1.2;
    } else {
      // Calm - normal speed
      currentSpeed = BASE_WALK_SPEED;
    }
  }
}

// ==============================================
// OUTPUT FUNCTION: Character Movement
// ==============================================
function moveCharacterToTarget() {
  // Only move if not stressed AND not stretched
  if (!isStressed && !isStretched) {
    // Calculate distance to target
    let distance = dist(character.x, character.y, targetX, targetY);
    
    // Update character direction based on movement
    let oldDirection = characterDirection;
    if (targetX > character.x) {
      characterDirection = 1; // Moving right
    } else if (targetX < character.x) {
      characterDirection = -1; // Moving left
    }
    
    // Change image if direction changed
    if (oldDirection !== characterDirection) {
      if (characterDirection === 1) {
        character.img = characterImageRight;
      } else {
        character.img = characterImageLeft;
      }
    }
    
    // Always keep moving (autonomous wandering)
    if (distance > 10) {
      // Use p5play's moveTo method for smooth movement
      character.moveTo(targetX, targetY, currentSpeed);
      
      // Apply stress jitter by offsetting position slightly
      if (jitterX !== 0 || jitterY !== 0) {
        character.x += jitterX;
        character.y += jitterY;
      }
    } else {
      // Reached target - pick a new one immediately to keep moving
      chooseNewWanderTarget();
    }
  }
}

// ==============================================
// INPUT HANDLING: Touch/Click
// ==============================================
function touchStarted() {
  return false;  // Prevents default behavior
}

function touchEnded() {
  return false;  // Prevents default behavior
}

function mousePressed() {
  return false;  // Prevent default
}

// Toggle UI with keyboard
function keyPressed() {
  if (key === ' ') {
    showUI = !showUI;
  }
}

// ==============================================
// VISUAL FEEDBACK: Stress Bar
// ==============================================
function drawStressBar() {
  // Background bar
  push();
  noStroke();
  fill(50, 50, 60);
  rect(20, 20, width - 40, 30, 5);
  
  // Stress level bar
  let barWidth = map(displayStress, 0, 100, 0, width - 40);
  let r = map(displayStress, 0, 100, 100, 255);
  let g = map(displayStress, 0, 100, 255, 50);
  fill(r, g, 100);
  rect(20, 20, barWidth, 30, 5);
  
  // Text label
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(`STRESS: ${floor(stress)}`, width / 2, 35);
  pop();
}

// ==============================================
// VISUAL FEEDBACK: Shake Indicator
// ==============================================
function drawShakeIndicator() {
  push();
  
  // Draw shake intensity meter
  let meterX = 20;
  let meterY = 70;
  let meterWidth = 150;
  let meterHeight = 20;
  
  // Background
  noStroke();
  fill(40, 40, 50);
  rect(meterX, meterY, meterWidth, meterHeight, 3);
  
  // Shake intensity level
  let intensityWidth = map(shakeIntensity, 0, 10, 0, meterWidth);
  fill(255, 150, 0);
  rect(meterX, meterY, intensityWidth, meterHeight, 3);
  
  // Label
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(12);
  text('Shake:', meterX, meterY - 10);
  text(shakeIntensity.toFixed(2), meterX + meterWidth + 10, meterY + meterHeight / 2);
  
  pop();
}

// ==============================================
// NEW: TOUCH INDICATOR
// ==============================================
function drawTouchIndicator() {
  if (touches.length > 0) {
    push();
    
    let indicatorX = 20;
    let indicatorY = height - 100;
    
    // Background
    fill(0, 0, 0, 180);
    noStroke();
    rect(indicatorX - 10, indicatorY - 10, 200, 80, 5);
    
    // Title
    fill(255, 200, 100);
    textAlign(LEFT, TOP);
    textSize(14);
    text('👆 TOUCH STATUS', indicatorX, indicatorY);
    indicatorY += 20;
    
    // Touch info
    fill(255);
    textSize(12);
    text(`Touches: ${touches.length}/2`, indicatorX, indicatorY);
    indicatorY += 16;
    
    if (touches.length === 2) {
      text(`Distance: ${int(touchDistance)}px`, indicatorX, indicatorY);
      indicatorY += 16;
      text(`Scale: ${character.scale.toFixed(2)}x`, indicatorX, indicatorY);
      indicatorY += 16;
      text(`State: ${isStretched ? 'STRETCHED' : 'Normal'}`, indicatorX, indicatorY);
    } else {
      text('Use 2 fingers on character', indicatorX, indicatorY);
    }
    
    pop();
  }
}

// ==============================================
// UI: Debug Information
// ==============================================
function drawUI() {
  push();
  
  let x = 20;
  let y = 120;
  let lineHeight = 18;
  
  // Semi-transparent background
  fill(0, 0, 0, 180);
  noStroke();
  rect(x - 10, y - 10, 370, 320, 5);
  
  // Title
  fill(255, 200, 0);
  textAlign(LEFT, TOP);
  textSize(16);
  text('⚡ SHAKE + TOUCH CONTROLS', x, y);
  y += lineHeight * 1.5;
  
  // Global Variable Section
  fill(100, 255, 100);
  textSize(14);
  text('GLOBAL VARIABLE:', x, y);
  y += lineHeight;
  
  fill(255);
  textSize(12);
  text(`  shakeIntensity = ${shakeIntensity.toFixed(2)}`, x, y);
  y += lineHeight;
  text(`  (Positive values increase stress)`, x, y);
  y += lineHeight * 1.3;
  
  // Parameter Section
  fill(255, 200, 100);
  textSize(14);
  text('PARAMETER:', x, y);
  y += lineHeight;
  
  fill(255);
  textSize(12);
  text(`  stress = ${stress.toFixed(1)}`, x, y);
  y += lineHeight * 1.3;
  
  // Input Section
  fill(100, 200, 255);
  textSize(14);
  text('INPUT CONTROLS:', x, y);
  y += lineHeight;
  
  fill(255);
  textSize(12);
  text(`  Sensors: ${sensorsActive ? 'ENABLED ✓' : 'DISABLED ✗'}`, x, y);
  y += lineHeight;
  text(`  Shake adds: +${STRESS_SHAKE_INCREASE} stress`, x, y);
  y += lineHeight;
  text(`  2-Finger Touch: Stretches character`, x, y);
  y += lineHeight * 1.3;
  
  // Thresholds
  fill(255, 150, 150);
  textSize(14);
  text('THRESHOLDS:', x, y);
  y += lineHeight;
  
  fill(255);
  textSize(12);
  text(`  Warning: ${STRESS_WARNING_THRESHOLD} (jitter starts)`, x, y);
  y += lineHeight;
  text(`  Panic: ${STRESS_PANIC_THRESHOLD} (extreme jitter)`, x, y);
  y += lineHeight * 1.3;
  
  // Current State
  fill(200, 200, 255);
  textSize(14);
  text('CURRENT STATE:', x, y);
  y += lineHeight;
  
  fill(255);
  textSize(12);
  text(`  Character: ${isStressed ? 'STRESSED 😫' : (isStretched ? 'STRETCHED 🔴' : 'Normal 😌')}`, x, y);
  y += lineHeight;
  text(`  Movement: ${(isStressed || isStretched) ? 'PAUSED' : 'Wandering'}`, x, y);
  text(`  Direction: ${characterDirection === 1 ? 'Right →' : 'Left ←'}`, x, y);
  y += lineHeight;
  text(`  Speed: ${currentSpeed.toFixed(2)}x`, x, y);
  y += lineHeight;
  text(`  Scale: ${character.scale.toFixed(2)}x`, x, y);
  y += lineHeight;
  text(`  Jitter: ${(abs(jitterX) + abs(jitterY)).toFixed(2)}`, x, y);
  y += lineHeight;
  text(`  Stress Cooldown: ${stressCooldown > 0 ? stressCooldown + ' frames' : 'None'}`, x, y);
  y += lineHeight * 1.3;
  
  // Instructions
  fill(200);
  textSize(11);
  if (!sensorsActive) {
    text('Tap screen to enable motion sensors', x, y);
    y += lineHeight;
  }
  text('Shake device to stress character!', x, y);
  y += lineHeight;
  text('Use 2 fingers on character to stretch it', x, y);
  y += lineHeight;
  text('Character pauses during stress/stretch', x, y);
  y += lineHeight;
  text('Space: Toggle UI', x, y);
  
  pop();
}
// ==============================================
// END OF CODE - Added missing closing bracket
// ==============================================