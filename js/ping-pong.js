export function startPingPong(container, level, onWin) {
    container.innerHTML = `
        <div style="text-align:center; color:white;">
            <div style="margin-bottom:10px; font-weight:bold; color:#cbd5e1;">Level ${level} - Keep the ball in play!</div>
            <canvas id="pongCanvas" width="600" height="400" style="background:#0f172a; display:block; margin:auto; border:4px solid #334155; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.5);"></canvas>
            <p style="color:#94a3b8; margin-top:10px; font-size:0.9rem;">Use ⬆️ and ⬇️ Arrow Keys to move the paddle.</p>
            <div id="pong-overlay" style="display:none; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.9); padding:20px; border-radius:10px; text-align:center;"></div>
        </div>
    `;
    
    const canvas = document.getElementById('pongCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('pong-overlay');

    // Game State
    let animationId;
    let isGameOver = false;
    let score = 0;
    const targetScore = 5 + (level * 2); // Difficulty scaling

    // Entities
    let ball = { 
        x: canvas.width / 2, 
        y: canvas.height / 2, 
        dx: 4 + (level * 0.5), 
        dy: 4 + (level * 0.5), 
        radius: 8 
    };
    
    let paddle = { 
        w: 12, 
        h: Math.max(40, 100 - (level * 5)), // Paddle shrinks with level
        x: 20, 
        y: (canvas.height / 2) - 40, 
        speed: 8 
    };

    // Controls
    let upPressed = false;
    let downPressed = false;

    function draw() {
        if (isGameOver) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Net
        ctx.strokeStyle = "#334155";
        ctx.setLineDash([10, 15]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Score
        ctx.font = "bold 40px Inter, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.textAlign = "center";
        ctx.fillText(score + " / " + targetScore, canvas.width / 2, canvas.height / 2 + 15);

        // Draw Ball
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
        ctx.fill();

        // Draw Paddle
        ctx.fillStyle = "#60a5fa";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#3b82f6";
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.shadowBlur = 0;

        // Move Paddle
        if (upPressed && paddle.y > 0) paddle.y -= paddle.speed;
        if (downPressed && paddle.y < canvas.height - paddle.h) paddle.y += paddle.speed;

        // Move Ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Bounce Top/Bottom
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
            ball.dy *= -1;
        }

        // Bounce Right Wall
        if (ball.x + ball.radius > canvas.width) {
            ball.dx *= -1;
        }

        // Paddle Collision logic
        // Check x bounds
        if (ball.x - ball.radius < paddle.x + paddle.w && ball.x + ball.radius > paddle.x) {
            // Check y bounds
            if (ball.y > paddle.y && ball.y < paddle.y + paddle.h) {
                // Hit!
                // Calculate relative hit position for angle variance
                let collidePoint = ball.y - (paddle.y + paddle.h/2);
                collidePoint = collidePoint / (paddle.h/2);
                
                let angleRad = (Math.PI/4) * collidePoint;
                
                // Increase speed slightly
                let speed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy) + 0.5;
                
                ball.dx = speed * Math.cos(angleRad);
                ball.dy = speed * Math.sin(angleRad);
                
                // Ensure dx is positive (moving right)
                ball.dx = Math.abs(ball.dx);

                score++;
                
                if(score >= targetScore) {
                    endGame(true);
                    return;
                }
            }
        }

        // Game Over (Missed Left Wall)
        if (ball.x - ball.radius < 0) {
            endGame(false);
            return;
        }

        animationId = requestAnimationFrame(draw);
    }

    function endGame(win) {
        isGameOver = true;
        cancelAnimationFrame(animationId);
        
        overlay.style.display = 'block';
        if (win) {
            overlay.innerHTML = `
                <h2 style="color:#4ade80; margin:0 0 10px 0;">Level Complete!</h2>
                <p style="color:white;">Score: ${score}</p>
                <button id="pong-continue" class="play-btn" style="margin-top:10px;">Continue</button>
            `;
            document.getElementById('pong-continue').onclick = () => onWin(100 + (score * 5));
        } else {
            overlay.innerHTML = `
                <h2 style="color:#f87171; margin:0 0 10px 0;">Game Over</h2>
                <button id="pong-retry" class="play-btn" style="margin-top:10px; background:#e2e8f0; color:#0f172a;">Try Again</button>
            `;
            document.getElementById('pong-retry').onclick = () => {
                startPingPong(container, level, onWin); // Restart
            };
        }
    }

    // Event Listeners
    const keyDownHandler = (e) => {
        if(e.key === 'ArrowUp') upPressed = true;
        if(e.key === 'ArrowDown') downPressed = true;
        // Prevent scrolling
        if(['ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    };

    const keyUpHandler = (e) => {
        if(e.key === 'ArrowUp') upPressed = false;
        if(e.key === 'ArrowDown') downPressed = false;
    };

    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);

    // Initial draw
    draw();

    // Cleanup function
    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener('keyup', keyUpHandler);
    };
}
