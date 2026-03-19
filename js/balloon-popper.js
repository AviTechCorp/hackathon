export function startBalloonPopper(container, level, onWin) {
    let score = 0;
    const targetScore = 10;
    let spawnInterval;
    let balloons = [];

    container.innerHTML = `
        <div style="position:relative; width:100%; height:500px; background: linear-gradient(to bottom, #bfdbfe, #e2e8f0); overflow:hidden; border-radius:12px; border:2px solid #cbd5e1; cursor:crosshair;">
            <div style="position:absolute; top:15px; left:15px; font-weight:bold; color:#1e293b; background:rgba(255,255,255,0.8); padding:5px 15px; border-radius:20px; z-index:10;">
                🎈 Pop ${targetScore} Balloons! <span style="margin-left:10px; color:#2563eb;">Score: <span id="b-score">0</span></span>
            </div>
            <div id="game-area" style="width:100%; height:100%;"></div>
            <div id="balloon-overlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:20; align-items:center; justify-content:center; flex-direction:column;"></div>
        </div>
    `;
    
    const gameArea = document.getElementById('game-area');
    const scoreEl = document.getElementById('b-score');
    const overlay = document.getElementById('balloon-overlay');

    function createBalloon() {
        if (score >= targetScore) return;

        const balloon = document.createElement('div');
        const size = 60 + Math.random() * 20;
        const hue = Math.floor(Math.random() * 360);
        const left = 5 + Math.random() * 85; // Keep within bounds
        
        balloon.className = 'balloon';
        balloon.style.cssText = `
            position: absolute;
            bottom: -100px;
            left: ${left}%;
            width: ${size}px;
            height: ${size * 1.2}px;
            background: radial-gradient(circle at 30% 30%, hsla(${hue}, 80%, 75%, 1), hsla(${hue}, 70%, 50%, 1));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: inset -5px -5px 10px rgba(0,0,0,0.1);
            user-select: none;
            z-index: 5;
        `;

        // Content: Simple math or icons based on level
        // Since we don't have tier info passed directly, we infer from level number
        // Level 1-3: Easy numbers, Level 4+: Simple Math
        let content = "";
        if (level <= 3) {
            content = Math.floor(Math.random() * 10) + 1;
        } else {
            const a = Math.floor(Math.random() * 5 * level);
            const b = Math.floor(Math.random() * 5);
            content = `${a}+${b}`;
        }
        
        balloon.innerHTML = `<span style="color:white; font-weight:bold; font-size:1.2rem; text-shadow:1px 1px 2px rgba(0,0,0,0.3);">${content}</span>`;

        // String tie
        const string = document.createElement('div');
        string.style.cssText = `
            position: absolute;
            bottom: -20px;
            left: 50%;
            width: 2px;
            height: 20px;
            background: rgba(0,0,0,0.3);
            transform: translateX(-50%);
        `;
        balloon.appendChild(string);

        // Click Handler
        balloon.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            popBalloon(balloon);
        });

        // Touch Handler for mobile
        balloon.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            popBalloon(balloon);
        });

        gameArea.appendChild(balloon);
        balloons.push({ el: balloon, speed: 2 + (level * 0.5), y: -100 });
    }

    function popBalloon(el) {
        // Find index
        const idx = balloons.findIndex(b => b.el === el);
        if (idx > -1) {
            balloons.splice(idx, 1);
            
            // Pop Animation logic could go here
            el.style.transform = "scale(1.2)";
            el.style.opacity = "0";
            setTimeout(() => el.remove(), 200);

            score++;
            scoreEl.textContent = score;

            if (score >= targetScore) {
                endGame();
            }
        }
    }

    function gameLoop() {
        if (score >= targetScore) return;

        balloons.forEach((b, index) => {
            b.y += b.speed;
            b.el.style.bottom = b.y + 'px';

            // Remove if off screen
            if (b.y > 550) {
                b.el.remove();
                balloons.splice(index, 1);
            }
        });

        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        clearInterval(spawnInterval);
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <h2 style="color:#4ade80; margin-bottom:1rem; font-size:2rem;">🎉 Poptastic!</h2>
            <p style="color:white; margin-bottom:1.5rem;">You scored  points.</p>
            <button id="popper-finish" class="play-btn" style="width:auto;">Collect XP</button>
        `;
        document.getElementById('popper-finish').onclick = () => onWin(100);
    }

    // Start
    spawnInterval = setInterval(createBalloon, 1500 - (level * 100)); // Spawn faster on higher levels
    gameLoop();

    // Cleanup
    return () => {
        clearInterval(spawnInterval);
        balloons.forEach(b => b.el.remove());
    };
}
