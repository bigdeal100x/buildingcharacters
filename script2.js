// ==============================================
// IMAGE STRETCHING WITH TOUCH
// ==============================================
// This example allows stretching an image horizontally
// by touching two points and moving them apart/closer
// ==============================================

// Variables to store touch information
let touch1X = 0;
let touch1Y = 0;
let touch2X = 0;
let touch2Y = 0;
let touchDistance = 0;
let initialDistance = 0;
let hasTwoTouches = false;

// Image and stretching variables
let img;
let stretchFactor = 1;
let baseWidth = 700;
let baseHeight = 300;

function preload() {
  // Load your image here - replace with your image path
  img = loadImage('sasha.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Lock mobile gestures to prevent scrolling, zooming, etc.
  lockGestures();
  
  // Set text properties
  textAlign(CENTER, CENTER);
  textSize(24);
}

function draw() {
  background(240, 240, 240);
  
  // Check if we have at least 2 touches
  if (touches.length >= 2) {
    if (!hasTwoTouches) {
      // First time we have two touches - store initial distance
      initialDistance = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
      hasTwoTouches = true;
    }
    
    // Get the positions of the first 2 touches
    touch1X = touches[0].x;
    touch1Y = touches[0].y;
    touch2X = touches[1].x;
    touch2Y = touches[1].y;
    
    // Calculate distance between the two touches
    touchDistance = dist(touch1X, touch1Y, touch2X, touch2Y);
    
    // Calculate stretch factor based on initial distance
    stretchFactor = touchDistance / initialDistance;
    
    // Draw the stretched image
    drawStretchedImage();
    
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
    
    // Display coordinates and stretch info
    textAlign(LEFT, TOP);
    textSize(18);
    fill(0);
    text("Touch 1: (" + Math.round(touch1X) + ", " + Math.round(touch1Y) + ")", 20, 20);
    text("Touch 2: (" + Math.round(touch2X) + ", " + Math.round(touch2Y) + ")", 20, 50);
    text("Distance: " + Math.round(touchDistance) + " pixels", 20, 80);
    text("Stretch: " + stretchFactor.toFixed(2) + "x", 20, 110);
    
  } else {
    hasTwoTouches = false;
    
    // Reset stretch factor when not touching
    stretchFactor = 1;
    
    // Draw the unstretched image
    drawStretchedImage();
    
    // Instructions when not enough touches
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(100, 100, 100);
    text("Touch 2 points on the screen to stretch", width/2, height/2 + 200);
  }
}

function drawStretchedImage() {
  // Calculate image dimensions with stretching on X-axis only
  let imgWidth = baseWidth * stretchFactor;
  let imgHeight = baseHeight;
  let imgX = (width - imgWidth) / 2;
  let imgY = (height - imgHeight) / 2;
  
  // Draw the stretched image
  image(img, imgX, imgY, imgWidth, imgHeight);
  
  // Draw a border around the image
  noFill();
  stroke(150);
  strokeWeight(2);
  rect(imgX, imgY, imgWidth, imgHeight);
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