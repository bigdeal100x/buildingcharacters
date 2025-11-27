// ==============================================
// IMAGE STRETCHING WITH TOUCH
// ==============================================
// This example allows stretching, translating, and rotating an image
// by touching two points and moving them
// ==============================================

// Variables to store touch information
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

// Image and transformation variables
let img1, img2, img3;
let currentImg;
let stretchFactor = 1;
let rotationAngle = 0;
let translateX = 0;
let translateY = 0;
let baseWidth = 700;
let baseHeight = 300;

// Distance thresholds for image switching
const MIN_DISTANCE_THRESHOLD = 130;
const MAX_DISTANCE_THRESHOLD = 250;

function preload() {
  // Load your images here - replace with your image paths
  img1 = loadImage('sasha.jpg');
  img2 = loadImage('sasha-front-ripped.png');
  img3 = loadImage('sasha-rolled.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Lock mobile gestures to prevent scrolling, zooming, etc.
  lockGestures();
  
  // Set text properties
  textAlign(CENTER, CENTER);
  textSize(24);
  
  // Set initial image
  currentImg = img1;
}

function draw() {
  background(240, 240, 240);
  
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
    
    // Check distance thresholds and switch images
    if (touchDistance > MAX_DISTANCE_THRESHOLD) {
      currentImg = img2; // Switch to second image when distance > 250px
    } else if (touchDistance < MIN_DISTANCE_THRESHOLD) {
      currentImg = img3; // Switch to third image when distance < 130px
    } else {
      currentImg = img1; // Default image when between thresholds
    }
    
    // Calculate current midpoint
    let currentMidX = (touch1X + touch2X) / 2;
    let currentMidY = (touch1Y + touch2Y) / 2;
    
    // Calculate transformations
    stretchFactor = touchDistance / initialDistance;
    rotationAngle = atan2(touch2Y - touch1Y, touch2X - touch1X) - initialAngle;
    translateX = currentMidX - initialMidX;
    translateY = currentMidY - initialMidY;
    
    // Draw the transformed image
    drawTransformedImage();
    
    // Draw a line between the two touches
    stroke(100, 100, 100);
    strokeWeight(3);
    line(touch1X, touch1Y, touch2X, touch2Y);
    
    // Draw circles at each touch point
    fill(255, 0, 0);
    noStroke();
    circle(touch1X, touch1Y, 30);
    circle(touch2X, touch2Y, 30);
    
    // Draw distance text in the middle of the line
    let midX = (touch1X + touch2X) / 2;
    let midY = (touch1Y + touch2Y) / 2;
    
    fill(0, 0, 0);
    textSize(20);
    text(Math.round(touchDistance) + " pixels", midX, midY - 30);
    
    // Display coordinates and transformation info
    textAlign(LEFT, TOP);
    textSize(18);
    fill(0);
    text("Touch 1: (" + Math.round(touch1X) + ", " + Math.round(touch1Y) + ")", 20, 20);
    text("Touch 2: (" + Math.round(touch2X) + ", " + Math.round(touch2Y) + ")", 20, 50);
    text("Distance: " + Math.round(touchDistance) + " pixels", 20, 80);
    text("Stretch: " + stretchFactor.toFixed(2) + "x", 20, 110);
    text("Rotation: " + degrees(rotationAngle).toFixed(1) + "°", 20, 140);
    text("Translation: (" + Math.round(translateX) + ", " + Math.round(translateY) + ")", 20, 170);
    
    // Display current image state
    let imageState = "Default Image";
    if (currentImg === img2) {
      imageState = "Stretched Image (>250px)";
      fill(0, 150, 0); // Green for stretched state
    } else if (currentImg === img3) {
      imageState = "Compressed Image (<130px)";
      fill(150, 0, 0); // Red for compressed state
    } else {
      fill(0, 0, 150); // Blue for default state
    }
    text("State: " + imageState, 20, 200);
    
  } else {
    hasTwoTouches = false;
    
    // Reset transformations when not touching
    stretchFactor = 1;
    rotationAngle = 0;
    translateX = 0;
    translateY = 0;
    
    // Reset to default image when no touches
    currentImg = img1;
    
    // Draw the untransformed image
    drawTransformedImage();
    
    // Instructions when not enough touches
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(100, 100, 100);
    text("Touch 2 points on the screen to transform", width/2, height/2 + 200);
    
    // Display threshold info
    textAlign(LEFT, TOP);
    textSize(16);
    fill(0);
    text("Distance Thresholds:", 20, 20);
    text("• < 130px: Switch to compressed image", 20, 45);
    text("• 130-250px: Default image", 20, 70);
    text("• > 250px: Switch to stretched image", 20, 95);
  }
}

function drawTransformedImage() {
  // Calculate image dimensions with stretching on X-axis only
  let imgWidth = baseWidth * stretchFactor;
  let imgHeight = baseHeight;
  
  // Calculate center position with translation
  let centerX = windowWidth / 2 + translateX;
  let centerY = windowHeight / 2 + translateY;
  
  // Save the current transformation state
  push();
  
  // Apply transformations
  translate(centerX, centerY);
  rotate(rotationAngle);
  
  // Draw the image centered at the transformation point
  imageMode(CENTER);
  image(currentImg, 0, 0, imgWidth/2, imgHeight/2);
  
  // Restore the transformation state
  pop();
}

// Touch event functions
function touchStarted() {
  return false;
}

function touchEnded() {
  return false;
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}