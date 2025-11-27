// Variables for touch information
        let touch1X = 0;
        let touch1Y = 0;
        let touch2X = 0;
        let touch2Y = 0;
        let touchDistance = 0;
        let initialDistance = 0;
        
        // Image variables
        let img1, img2;
        let currentImage = 1;
        let stretchFactor = 1;
        let transitionProgress = 0;
        let isTransitioning = false;
        let hasTwoTouches = false;
        
        // Preload images
        function preload() {
            // Using placeholder images - replace with your own images
            img1 = loadImage('sasha.jpg');
            img2 = loadImage('sasha-front-stretched.png');
        }
        
        function setup() {
            createCanvas(windowWidth, windowHeight);
            
            // Set text properties
            textAlign(CENTER, CENTER);
            textSize(24);
            
            // Lock mobile gestures to prevent scrolling, zooming, etc.
            if (typeof lockGestures === 'function') {
                lockGestures();
            }
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
                
                // Start transition if stretch factor is high enough
                if (stretchFactor > 1.5 && !isTransitioning) {
                    isTransitioning = true;
                    transitionProgress = 0;
                }
                
                // Draw the image with stretching
                drawStretchedImage();
                
                // Draw a line between the two touches
                stroke(100, 100, 100);
                strokeWeight(3);
                line(touch1X, touch1Y, touch2X, touch2Y);
                
                // Draw circles at each touch point
                fill(255, 0, 0);  // Red circles
                noStroke();
                circle(touch1X, touch1Y, 30);
                circle(touch2X, touch2Y, 30);
                
                // Draw distance text in the middle of the line
                let midX = (touch1X + touch2X) / 2;
                let midY = (touch1Y + touch2Y) / 2;
                
                fill(0, 0, 0);  // Black text
                textSize(20);
                text(Math.round(touchDistance) + " pixels", midX, midY - 30);
                
                // Display coordinates at the top of screen
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
                if (!isTransitioning) {
                    stretchFactor = 1;
                }
                
                // Draw the current image without stretching
                drawStretchedImage();
                
                // Instructions when not enough touches
                textAlign(CENTER, CENTER);
                textSize(32);
                fill(100, 100, 100);
                text("Touch 2 points on the screen", width/2, height/2);
            }
            
            // Update transition if active
            if (isTransitioning) {
                transitionProgress += 0.02;
                if (transitionProgress >= 1) {
                    transitionProgress = 1;
                    isTransitioning = false;
                    currentImage = 2; // Switch to second image
                    stretchFactor = 1; // Reset stretch
                }
            }
        }
        
        function drawStretchedImage() {
            // Calculate image dimensions
            let imgWidth = 400 * stretchFactor;
            let imgHeight = 300;
            let imgX = (width - imgWidth) / 2;
            let imgY = (height - imgHeight) / 2;
            
            // Draw the appropriate image based on transition state
            if (isTransitioning) {
                // During transition, blend between the two images
                tint(255, 255 * (1 - transitionProgress));
                image(img1, imgX, imgY, imgWidth, imgHeight);
                
                tint(255, 255 * transitionProgress);
                image(img2, imgX, imgY, imgWidth, imgHeight);
                
                // Reset tint
                tint(255, 255);
            } else {
                // Draw the current image
                if (currentImage === 1) {
                    image(img1, imgX, imgY, imgWidth, imgHeight);
                } else {
                    image(img2, imgX, imgY, imgWidth, imgHeight);
                }
            }
            
            // Draw a border around the image
            noFill();
            stroke(150);
            strokeWeight(2);
            rect(imgX, imgY, imgWidth, imgHeight);
        }
        
        // Touch event functions
        function touchStarted() {
            // Touch positions will be updated in draw() function
            return false;
        }
        
        function touchEnded() {
            // Touch positions will be updated in draw() function
            return false;
        }
        
        // Handle window resize
        function windowResized() {
            resizeCanvas(windowWidth, windowHeight);
        }