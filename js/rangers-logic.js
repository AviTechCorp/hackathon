export function startRangersGame(container, level, onWin) {
    // 1. Setup UI
    container.innerHTML = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; color: white; max-width: 800px; margin: 0 auto;">
            <div style="background: #334155; padding: 10px; border-radius: 8px;">
                <div id="grid-container" style="display: grid; gap: 2px;"></div>
            </div>
            <div id="controls" style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 10px;">
                <h3 style="margin:0; color: #4ade80;">Mission Control: Level ${level}</h3>
                <p style="font-size: 0.9rem; color: #cbd5e1;">Guide the Rover (🚜) to the Flag (🏁).</p>
                <div style="background: #1e293b; padding: 10px; border-radius: 4px; font-size: 0.85rem; color: #94a3b8; font-family: monospace;">
                    Valid: forward(n), backward(n), left(), right()
                </div>
                <textarea id="command-input" style="height: 120px; background: #0f172a; color: #4ade80; font-family: monospace; padding: 10px; border: 1px solid #475569; border-radius: 4px; resize: none;" placeholder="forward(2)\nright()"></textarea>
                <button id="run-btn" class="play-btn">Execute Mission</button>
                <div id="rangers-feedback" style="min-height: 24px; color: #f87171; font-weight: bold; font-size: 0.9rem;"></div>
            </div>
        </div>
    `;

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