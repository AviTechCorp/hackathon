/**
 * Pattern Recognition Game Module - Grade 7 Edition
 *
 * Focuses on:
 * 1. Patterns, Functions, and Algebra (Algebraic Expressions, Equations, Input/Output)
 */

export function startPatternGame(container, level, onWin, onExit) {
    let score = 0;
    const winningScore = 100;
    let currentPattern = [];
    let userAnswer = '';

    // 1. Setup UI Layout
    container.innerHTML = `
        <div class="pattern-game-ui" style="text-align:center; color:white; font-family: 'Inter', sans-serif;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; color:#cbd5e1; font-size: 1.1rem;">
                <span>Level ${level}</span>
                <span id="pattern-score" style="color:#fbbf24; font-weight:bold;">Score: 0</span>
            </div>

            <h2 style="color:#94a3b8; margin-bottom:0.5rem;">Identify the Pattern!</h2>
            <p style="color:#64748b; margin-bottom:2rem;">Complete the sequence.</p>

            <div id="pattern-display" style="font-size: 2rem; margin-bottom: 2rem; color: #cbd5e1;">
                <!-- Pattern injected here -->
            </div>

            <input type="text" id="pattern-answer" placeholder="Next Value" style="width:150px; padding:0.5rem; font-size:1.2rem; text-align:center; border-radius:0.5rem; border:none; margin-bottom:1rem;">

            <button id="pattern-submit" class="play-btn" style="width:auto;">Submit Answer</button>

            <div id="feedback-area" style="height:30px; margin-top:1.5rem; font-weight:bold; font-size:1.1rem;"></div>

            <button id="pattern-exit" class="play-btn" style="margin-top:2rem; background-color: transparent; border: 1px solid #475569; width: auto;">Exit Game</button>
        </div>
    `;

    const scoreEl = document.getElementById('pattern-score');
    const patternDisplay = document.getElementById('pattern-display');
    const answerInput = document.getElementById('pattern-answer');
    const submitButton = document.getElementById('pattern-submit');
    const feedbackEl = document.getElementById('feedback-area');

    document.getElementById('pattern-exit').addEventListener('click', onExit);

    function generatePattern() {
        feedbackEl.textContent = "";
        answerInput.value = "";

        const typeRoll = Math.random();

        // --- Type A: Arithmetic Sequence ---
        if (typeRoll < 0.33) {
            const start = Math.floor(Math.random() * 10) + 1;
            const diff = Math.floor(Math.random() * 5) + 1;
            currentPattern = [start, start + diff, start + 2 * diff, start + 3 * diff];
            userAnswer = start + 4 * diff;
        } else if (typeRoll < 0.66) {
            // --- Type B: Geometric Sequence ---
            const start = Math.floor(Math.random() * 5) + 1;
            const ratio = Math.floor(Math.random() * 3) + 2;
            currentPattern = [start, start * ratio, start * ratio * ratio, start * ratio * ratio * ratio];
            userAnswer = start * ratio * ratio * ratio * ratio;
        } else {
            // --- Type C: Simple Equation ---
             const a = Math.floor(Math.random() * 5) + 1; // Coefficient of x
             const b = Math.floor(Math.random() * 10) + 1; // Constant term
             const result = Math.floor(Math.random() * 20) + 1; // Result of the equation
             currentPattern = [`${a}x + ${b} = ${result}`];
             userAnswer = (result - b) / a;
            userAnswer = parseFloat(userAnswer.toFixed(2)); // Round to 2 decimal places

        }
        
        patternDisplay.textContent = currentPattern.join(', ');
    }

    function checkAnswer() {
        const inputValue = answerInput.value.trim();

        if (inputValue === String(userAnswer)) {
            score += 20;            
            scoreEl.textContent = `Score: ${score}`;
            feedbackEl.innerHTML = `<span style="color:#4ade80">Correct!</span>`;

            if (score >= winningScore) {
                // Game Complete
                container.innerHTML = `
                    <div style="text-align:center; color:white; padding:3rem;">
                        <div style="font-size:4rem; margin-bottom:1rem;">🎉</div>
                        <h2>Pattern Recognition Master!</h2>
                        <p>You earned 100 XP.</p>
                        <button id="pattern-finish" class="play-btn" style="margin-top:2rem;">Continue</button>
                    </div>
                `;
                document.getElementById('pattern-finish').addEventListener('click', onWin);
            } else {
                setTimeout(generatePattern, 800);
            }
        } else {
            feedbackEl.innerHTML = `<span style="color:#f87171">Oops! Try again!</span>`;
        }
    }

    submitButton.addEventListener('click', checkAnswer);

    // Custom Styling
    const style = document.createElement('style');
    style.textContent = `
        .pattern-game-ui input[type=text] {
            background-color: #1e293b;
            color: white;
            border: 1px solid #475569;
        }
        .pattern-game-ui input[type=text]:focus {
            outline: none;
            border-color: #6366f1;
        }
    `;
    document.head.appendChild(style);

    // Start first round
    generatePattern();
}


/*
 *How to integrate it to gamefication.js
        const gameModules = {
            'Pattern': { path: './pattern-game.js', exportName: 'startPatternGame' },
 *
 *How to trigger it
    // Dynamic Game Loader for Modular Games
    const onGameWin = (result) => {
        // Pattern game passes Event object (use default 100), others pass XP number
        const xp = typeof result === 'number' ? result : 100;
        updateUserXP(xp);
        unlockNextLevel(gameLevel);
        switchView('view-levels');
    };
    const onGameExit = () => switchView('view-levels');

    // Attempt to load via GameLoader
    const handledByLoader = await GameLoader.loadAndPlay(currentConfig.type, container, gameLevel, onGameWin, onGameExit);
    if (handledByLoader) {
        return;
    }

*call the name of the funtion
 GameLoader.loadAndPlay(currentConfig.type, container, gameLevel, onGameWin, onGameExit);

*How to integrate the game
    // 1. Subject Selection
    const subj = selectedSubject.id;

    if (['math', 'acc', 'compsci', 'eng'].includes(subj)) {
        // Numerical & Logic Games

    }
*/