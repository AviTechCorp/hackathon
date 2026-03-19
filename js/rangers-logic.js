export function startRangersGame(container, level, onWin) {
    // 1. Setup Enhanced UI
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 350px; gap: 20px; color: white; max-width: 1000px; margin: 0 auto; font-family: 'Inter', sans-serif;">
            
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div style="background: #334155; padding: 15px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                    <div id="grid-container" style="display: grid; gap: 4px; border-radius: 4px; overflow: hidden;"></div>
                </div>
                <div id="rangers-feedback" style="height: 30px; padding: 5px 20px; border-radius: 20px; background: rgba(15, 23, 42, 0.5); font-weight: 600; text-align: center;"></div>
            </div>

            <div id="controls" style="background: #1e293b; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 15px; border: 1px solid #334155;">
                <div style="display:flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin:0; color: #4ade80; font-size: 1.2rem;">Mission Control</h3>
                    <span style="background:#0f172a; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Level ${level}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="cmd-btn" onclick="document.getElementById('command-input').value += 'forward(1)\\n'">⬆️ Forward</button>
                    <button class="cmd-btn" onclick="document.getElementById('command-input').value += 'backward(1)\\n'">⬇️ Backward</button>
                    <button class="cmd-btn" onclick="document.getElementById('command-input').value += 'left()\\n'">↩️ Turn Left</button>
                    <button class="cmd-btn" onclick="document.getElementById('command-input').value += 'right()\\n'">↪️ Turn Right</button>
                </div>

                <div style="position: relative;">
                    <textarea id="command-input" 
                        style="width: 100%; height: 180px; background: #0f172a; color: #4ade80; font-family: 'Fira Code', monospace; padding: 12px; border: 1px solid #475569; border-radius: 8px; resize: none; font-size: 1rem; line-height: 1.5;" 
                        placeholder="Type your mission script here..."></textarea>
                </div>

                <button id="run-btn" class="play-btn" style="width: 100%; padding: 12px; font-weight: bold; font-size: 1.1rem; transition: transform 0.2s;">🚀 LAUNCH ROVER</button>
                
                <button id="clear-btn" style="background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 5px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Clear Script</button>
            </div>
        </div>

        <style>
            .cmd-btn {
                background: #334155; border: 1px solid #475569; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
            }
            .cmd-btn:hover { background: #475569; border-color: #4ade80; }
            .play-btn:active { transform: scale(0.95); }
            .play-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            #grid-container div { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        </style>
    `;

    // Add listener for clear button
    document.getElementById('clear-btn').onclick = () => document.getElementById('command-input').value = '';

    const grid = document.getElementById('grid-container');
    const input = document.getElementById('command-input');
    const runBtn = document.getElementById('run-btn');
    const feedback = document.getElementById('rangers-feedback');

    // Randomize Start and Goal positions
    let tankPos, goalPos, obstacles, gridWidth, gridHeight;
    
    function initLevel() {
        // Random Grid Size (5x5 to 8x8)
        gridWidth = Math.floor(Math.random() * 4) + 5;
        gridHeight = Math.floor(Math.random() * 4) + 5;
        
        grid.style.gridTemplateColumns = `repeat(${gridWidth}, 60px)`;
        grid.style.gridTemplateRows = `repeat(${gridHeight}, 60px)`;

        // Random start position (keep away from center slightly to allow obstacles)
        tankPos = { x: Math.floor(Math.random() * gridWidth), y: Math.floor(Math.random() * gridHeight) };       
        
        // Ensure goal is different from start
        do {
            goalPos = { x: Math.floor(Math.random() * gridWidth), y: Math.floor(Math.random() * gridHeight) };
        } while (goalPos.x === tankPos.x && goalPos.y === tankPos.y);

        // --- Dynamic Obstacle Generation ---
        const numObstacles = Math.floor(level * 0.75); // Scale obstacles with level
        obstacles = [];
        for (let i = 0; i < numObstacles; i++) {
            let newObstacle;
            do {
                newObstacle = { x: Math.floor(Math.random() * gridWidth), y: Math.floor(Math.random() * gridHeight) };
                // Ensure not start/goal and not overlapping
            } while (
                (newObstacle.x === tankPos.x && newObstacle.y === tankPos.y) ||
                (newObstacle.x === goalPos.x && newObstacle.y === goalPos.y) ||
                obstacles.some(o => o.x === newObstacle.x && o.y === newObstacle.y)
            );
            obstacles.push(newObstacle);
        }
        // Obstacles (avoid start and goal)
        obstacles = level > 3 ? [{x: 2, y: 2}, {x: 2, y: 3}, {x: 3, y: 1}].filter(o => 
            (o.x !== tankPos.x || o.y !== tankPos.y) && (o.x !== goalPos.x || o.y !== goalPos.y)
        ) : [];
    }

    initLevel();
    let tankDir = 1; // Default facing East

    function renderGrid() {
        grid.innerHTML = '';
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = document.createElement('div');
                cell.style.cssText = "width:60px; height:60px; background:#1e293b; display:flex; align-items:center; justify-content:center; font-size:2rem; border:1px solid #334155;";

                if (x === tankPos.x && y === tankPos.y) {
                    cell.innerHTML = '🚜'; 
                    cell.style.transform = `rotate(${(tankDir - 1) * 90}deg)`;
                    // Removing transition here because re-creating DOM nodes invalidates it usually
                    // and it causes visual glitches if the grid rebuilds instantly
                } else if (x === goalPos.x && y === goalPos.y) {
                    cell.innerHTML = '🏁';
                } else if (obstacles.some(o => o.x === x && o.y === y)) {
                    cell.innerHTML = '🪨';
                }
                grid.appendChild(cell);
            }
        }
    }

    async function executeCommands() {
        feedback.textContent = "";
        feedback.style.color = "#f87171";
        runBtn.disabled = true;
        const lines = input.value.toLowerCase().split('\n');
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            const steps = parseInt(line.match(/\d+/)?.[0]) || 1;

            if (line.startsWith('backward') || line.startsWith('forward')) {
                const isBack = line.startsWith('forward');
                feedback.textContent = `Running: ${line}...`;
                
                for(let i=0; i<steps; i++) {
                    const nextPos = {...tankPos};
                    // Simplified direction logic
                    if (isBack) {
                        // Backward Movement
                        if (tankDir === 0) nextPos.y++;      // Facing North, move South
                        else if (tankDir === 1) nextPos.x--; // Facing East, move West
                        else if (tankDir === 2) nextPos.y--; // Facing South, move North
                        else if (tankDir === 3) nextPos.x++; // Facing West, move East
                    } else {
                        // Forward Movement
                        if (tankDir === 0) nextPos.y--;      // Facing North, move North
                        else if (tankDir === 1) nextPos.x++; // Facing East, move East
                        else if (tankDir === 2) nextPos.y++; // Facing South, move South
                        else if (tankDir === 3) nextPos.x--; // Facing West, move West
                    }

                    // 1. Boundary Check
                    if (nextPos.x < 0 || nextPos.x >= gridWidth || nextPos.y < 0 || nextPos.y >= gridHeight) {
                        return missionFailed("Rover hit a wall!");
                    }
                    // 2. Obstacle Check
                    if (obstacles.some(o => o.x === nextPos.x && o.y === nextPos.y)) {
                        return missionFailed("Rover crashed into a rock!");
                    }

                    tankPos = nextPos;
                    renderGrid();
                    await new Promise(r => setTimeout(r, 400));
                }
            } else if (line.includes('right')) {
                tankDir = (tankDir + 1) % 4;
            } else if (line.includes('left')) {
                tankDir = (tankDir + 3) % 4;
            }
            renderGrid();
            await new Promise(r => setTimeout(r, 400));
        }

        if (tankPos.x === goalPos.x && tankPos.y === goalPos.y) {
            feedback.style.color = "#4ade80";
            feedback.textContent = "Mission Accomplished!";
            setTimeout(() => onWin(150 + (level * 10)), 1000);
        } else {
            missionFailed("Goal not reached.");
        }
    }

    function missionFailed(reason) {
        feedback.textContent = reason;
        setTimeout(() => {
            // Reset to initial state for this level (or re-randomize if desired, but usually retry same layout)
            // For now, we keep the random positions fixed for retries until level completes
            // Just reset direction if needed or visual state
            tankDir = 1;
            renderGrid();
            runBtn.disabled = false;
        }, 1500);
    }

    runBtn.onclick = executeCommands;
    renderGrid();
}