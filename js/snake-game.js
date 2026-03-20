/**
 * Snake Game Module - Grade 7 Edition
 *
 * Focuses on:
 * 1. Numbers, Operations, and Relationships (Integers, Exponents, Ratio/Rate, Financial Math)
 * 2. Patterns, Functions, and Algebra (Algebraic Expressions, Equations, Input/Output)
 * 3. Space and Shape (Angles, 2D Shapes, Symmetry/Transformations)
 * 4. Measurement (Area/Perimeter, Surface Area/Volume, Circle Geometry)
 * 5. Data Handling (Central Tendency, Graphs, Probability)
 */

export function startSnakeGame(container, levelText, topic, gameLevel, subject) {
    // Setup Canvas
   container.innerHTML = `
        <div style="text-align:center; color:white;">
            <div style="display:flex; justify-content:space-between; width:400px; margin:0 auto 5px auto;">
                <span style="color:#4ade80; font-weight:bold;">Level ${gameLevel}</span>
                <span id="snake-score">Score: 0</span>
                <span id="snake-lives" style="font-size:1.1rem;">❤️❤️❤️</span>
            </div>
            
            <div style="display:flex; justify-content:center; gap:10px; margin-bottom:10px;">
                <select id="snake-speed" style="color:black; padding:4px; border-radius:4px; cursor:pointer;">
                    <option value="350">Slow</option>
                    <option value="200" selected>Normal</option>
                    <option value="150">Fast</option>
                </select>
                <button id="snake-pause" class="play-btn" style="width:auto; padding:4px 12px; font-size:0.9rem;">Pause</button>
            </div>

            <div id="snake-mission" style="color:#fbbf24; font-weight:bold; font-size: 0.9rem; margin-bottom:5px; height:20px;">Loading...</div>

            <div style="position:relative; width:400px; height:400px; margin:0 auto;">
                <canvas id="snake-canvas" width="400" height="400"></canvas>
                <!-- Summary Overlay -->
                <div id="snake-summary" class="hidden" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.95); padding:20px; box-sizing:border-box; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10; color:white;">
                </div>
            </div>

            <p style="color:#64748b; font-size:0.9rem; margin-top:5px;">Use Arrow Keys. Eat the <strong>correct</strong> items!</p>
            <div style="margin-top:5px;">
                <button id="snake-restart" class="play-btn hidden" style="width:auto; margin-right: 10px;">Play Again</button>
                <button id="snake-next-level" class="play-btn hidden" style="width:auto; background-color: #4ade80; color: #0f172a;">Next Level ➡</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('snake-score');
    const missionEl = document.getElementById('snake-mission');
    const summaryEl = document.getElementById('snake-summary');
    const livesEl = document.getElementById('snake-lives');
    const restartBtn = document.getElementById('snake-restart');
    const speedSelect = document.getElementById('snake-speed');
    const pauseBtn = document.getElementById('snake-pause');
    const nextLevelBtn = document.getElementById('snake-next-level');

    // Game Config
    const gridSize = 25; // Larger grid for text
    const tileCount = canvas.width / gridSize;
    let speed = parseInt(speedSelect.value);
    let isPaused = false;
    const winningScore = 100; // Ending point
    const maxLives = 3;
    let lives = maxLives;
    
    let score = 0;
    let velocity = { x: 0, y: 0 };
    let trail = [];
    let tail = 5;
    
    let player = { x: 10, y: 10 };
    let foods = []; // Array of {x, y, value, isCorrect}
    let itemsEatenInRound = 0;
    let isGameOver = false;

    // Stats Tracking
    let currentSubjectId = subject.id;
    let sessionStats = { correct: [], incorrect: [], rule: "" };

    // Controls Listeners
    speedSelect.addEventListener('change', (e) => speed = parseInt(e.target.value));
    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? "Resume" : "Pause";
        if (!isPaused) gameLoop();
    });
    nextLevelBtn.addEventListener('click', () => startGame(gameLevel + 1));

    function updateLivesUI() {
        let hearts = "";
        for(let i=0; i<lives; i++) hearts += "❤️";
        for(let i=lives; i<maxLives; i++) hearts += "🖤";
        livesEl.textContent = hearts;
    }

    // --- Content Generation Logic ---
    function spawnRound() {
        foods = [];
        itemsEatenInRound = 0;
        let correctPool = [];
        let wrongPool = [];
        let ruleText = "";

        // Determine Content based on Subject
        if (currentSubjectId === 'math') {
            // Math Logic
            const mode = Math.random();
            if (mode < 0.25) {
                //Integers
                const num1 = Math.floor(Math.random() * 20) - 10; // Range -10 to 9
                const num2 = Math.floor(Math.random() * 20) - 10;
                ruleText = `Eat Result: ${num1} + ${num2}`;
                correctPool.push(num1 + num2);
                wrongPool.push(num1 + num2 + (Math.random() > 0.5 ? 1 : -1));
            } else if (mode < 0.5) {
                //Exponents
                const base = Math.floor(Math.random() * 5) + 1; // 1 to 5
                const power = 2;
                ruleText = `Eat Result: ${base}^${power}`;
                correctPool.push(base ** power);
                wrongPool.push(base ** power + (Math.random() > 0.5 ? 1 : -1));
            } else if (mode < 0.75){
                 //Ratio & Rate
                 const dist = Math.floor(Math.random() * 50) + 10;
                 const time = Math.floor(Math.random() * 10) + 2;
                 ruleText = `Eat Result: Speed = ${dist} / ${time}`;
                 correctPool.push(dist / time);
                 wrongPool.push((dist + 1) / time);
            } else {
                 //Financial Math
                 const principal = Math.floor(Math.random() * 100) + 50;
                const rate = (Math.floor(Math.random() * 5) + 1) / 100;
                ruleText = `Eat Simple Interest: ${principal} * ${rate}`;
                correctPool.push(principal * rate);
                wrongPool.push(principal * (rate + 0.01));
            }
        } else if (currentSubjectId === 'english') {
             // English Logic (Words)
            const cleanTopic = topic.toUpperCase().replace(/[^A-Z]/g, '') || "WORD";
            const isTopicMode = Math.random() > 0.5 && cleanTopic.length > 2;

             ruleText = `Eat letters in "${cleanTopic.substring(0, 6)}..."`;
             const targets = cleanTopic.split('');
             const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
             for (let i = 0; i < 5; i++) correctPool.push(targets[Math.floor(Math.random() * targets.length)]);
             for (let i = 0; i < 5; i++) wrongPool.push(alphabet.filter(c => !targets.includes(c))[Math.floor(Math.random() * 20)]);
        } else if (currentSubjectId === 'science'){
            // Text Logic (Letters)
            const cleanTopic = topic.toUpperCase().replace(/[^A-Z]/g, '') || "SCHOOL";
            const isTopicMode = Math.random() > 0.5 && cleanTopic.length > 2;
            
            if (isTopicMode) {
                ruleText = `Eat letters in "${cleanTopic.substring(0, 6)}..."`;
                const targets = cleanTopic.split('');
                const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
                for(let i=0; i<5; i++) correctPool.push(targets[Math.floor(Math.random()*targets.length)]);
                for(let i=0; i<5; i++) wrongPool.push(alphabet.filter(c => !targets.includes(c))[Math.floor(Math.random()*20)]);
            } else {
                const isVowel = Math.random() > 0.5;
                ruleText = isVowel ? "Eat Vowels" : "Eat Consonants";
                const vowels = ['A','E','I','O','U'];
                const consonants = "BCDFGHJKLMNPQRSTVWXYZ".split('');
                for(let i=0; i<5; i++) correctPool.push(isVowel ? vowels[Math.floor(Math.random()*5)] : consonants[Math.floor(Math.random()*21)]);
                for(let i=0; i<5; i++) wrongPool.push(isVowel ? consonants[Math.floor(Math.random()*21)] : vowels[Math.floor(Math.random()*5)]);
            }
        } else {
            ruleText = "Eat anything";
        }

        missionEl.textContent = ruleText;
        sessionStats.rule = ruleText;
        // Spawn initial items (1 correct, 2 wrong)
        spawnItem(correctPool, true);
        spawnItem(wrongPool, false);
        spawnItem(wrongPool, false);

        return { correctPool, wrongPool };
    }

    let currentPools = {}; 

    function spawnItem(pool, isCorrect) {
        let valid = false;
        while (!valid) {
            const x = Math.floor(Math.random() * tileCount);
            const y = Math.floor(Math.random() * tileCount);
            // Check overlap with snake or other foods
            const overlap = trail.some(t => t.x === x && t.y === y) || foods.some(f => f.x === x && f.y === y);
            if (!overlap) {
                foods.push({ x, y, value: pool[Math.floor(Math.random() * pool.length)], isCorrect });
                valid = true;
            }
        }
    }

    function gameLoop() {
        // Stop if view changed
        if (document.getElementById('view-game').classList.contains('hidden')) {
            return;
        }
        if (isPaused) return;

        player.x += velocity.x;
        player.y += velocity.y;

        // Wrap walls
        if (player.x < 0) player.x = tileCount - 1;
        if (player.x > tileCount - 1) player.x = 0;
        if (player.y < 0) player.y = tileCount - 1;
        if (player.y > tileCount - 1) player.y = 0;

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Snake
        ctx.fillStyle = '#4ade80'; // Green
        for (let i = 0; i < trail.length; i++) {
            ctx.fillRect(trail[i].x * gridSize, trail[i].y * gridSize, gridSize - 2, gridSize - 2);
            
            // Self collision check (only if moving)
            if ((velocity.x !== 0 || velocity.y !== 0) && trail[i].x === player.x && trail[i].y === player.y) {
                finishGame(false);
                return;
            }
        }

        trail.push({ x: player.x, y: player.y });
        while (trail.length > tail) {
            trail.shift();
        }

        // Draw Foods (Numbers/Letters)
        ctx.font = "bold 14px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        foods.forEach((food, index) => {
            // Draw Orb Background
            ctx.fillStyle = '#3b82f6'; // Blue orb
            ctx.beginPath();
            ctx.arc((food.x * gridSize) + gridSize/2, (food.y * gridSize) + gridSize/2, gridSize/2 - 2, 0, 2 * Math.PI);
            ctx.fill();

            // Draw Text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(food.value, (food.x * gridSize) + gridSize/2, (food.y * gridSize) + gridSize/2 + 1);

            // Collision with Head
            if (food.x === player.x && food.y === player.y) {
                if (food.isCorrect) {
                    // Correct Eat
                    tail++;
                    score += 10;
                    scoreEl.textContent = `Score: ${score}`;
                    itemsEatenInRound++;
                    sessionStats.correct.push(food.value);
                    
                    // Check Win Condition (Ending Point)
                    if (score >= winningScore) {
                        finishGame(true);
                        return;
                    }

                    // Remove eaten
                    foods.splice(index, 1);

                    // Progression: Change rule every 3 correct items
                    if (itemsEatenInRound >= 3) {
                        currentPools = spawnRound();
                    } else {
                        // Respawn 1 correct, 1 wrong to keep density
                        spawnItem(currentPools.correctPool, true);
                        spawnItem(currentPools.wrongPool, false);
                    }
                } else {
                    // Wrong Eat - Lose Life but continue
                    lives--;
                    updateLivesUI();
                    sessionStats.incorrect.push(food.value);
                    foods.splice(index, 1);
                    spawnItem(currentPools.wrongPool, false); // Respawn to keep board full
                    
                    if (lives <= 0) {
                        finishGame(false);
                    }
                    return;
                }
            }
        });

        // Spawn items if empty (failsafe)
        if (foods.length === 0 && currentPools.correctPool) {
             spawnItem(currentPools.correctPool, true);
        }

        if (!isGameOver) {
            setTimeout(() => requestAnimationFrame(gameLoop), speed);
        }
    }
}