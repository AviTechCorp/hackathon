/**
 * Balloon Popper Game Module - Grade 4-7 Edition
 *
 * Focuses on:
 * 1. Numbers, Operations, and Relationships (Place Value, +, -, x, /)
 * 2. Fractions (Recognition, Comparison)
 * 3. Patterns, Functions, and Algebra (Numeric, Input/Output)
 * 4. Space and Shape (2D Shapes)
 * 5. Measurement and Data Handling (Length, Mass, Capacity)
 */

export function startBalloonPopper(container, level, onWin, onExit) {
    let score = 0;
    const winningScore = 100;
    let activeBalloons = [];

    // 1. Setup UI Layout
    container.innerHTML = `
        <div class="balloon-popper-ui" style="text-align:center; color:white; font-family: 'Inter', sans-serif;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; color:#cbd5e1; font-size: 1.1rem;">
                <span>Level ${level}</span>
                <span id="balloon-score" style="color:#fbbf24; font-weight:bold;">Score: 0</span>
            </div>

            <h2 style="color:#94a3b8; margin-bottom:0.5rem;">Pop the Balloons!</h2>
            <p style="color:#64748b; margin-bottom:2rem;">Pop balloons with the correct answers.</p>

            <div id="problem-display" style="font-size: 1.5rem; font-weight: bold; margin-bottom: 2rem; color: #cbd5e1;">
                <!-- Problem injected here -->
            </div>

            <div id="balloon-area" style="position: relative; height: 300px; margin-bottom: 2rem; overflow: hidden;">
                <!-- Balloons injected here -->
            </div>

            <div id="feedback-area" style="height:30px; margin-top:1.5rem; font-weight:bold; font-size:1.1rem;"></div>

            <button id="balloon-exit" class="play-btn" style="margin-top:2rem; background-color: transparent; border: 1px solid #475569; width: auto;">Exit Game</button>
        </div>
    `;

    const scoreEl = document.getElementById('balloon-score');
    const problemEl = document.getElementById('problem-display');
    const balloonArea = document.getElementById('balloon-area');
    const feedbackEl = document.getElementById('feedback-area');

    document.getElementById('balloon-exit').addEventListener('click', onExit);

    function getRandomValue(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateProblem() {
        feedbackEl.textContent = "";
        balloonArea.innerHTML = "";
        activeBalloons = [];

        const typeRoll = Math.random();
        let problem = {};

        // --- Type A: Numbers, Operations, and Relationships ---
        if (typeRoll < 0.33) {
            // Addition
            const num1 = getRandomValue(10, 100);
            const num2 = getRandomValue(5, 50);
            problem.text = `${num1} + ${num2} = ?`;
            problem.answer = num1 + num2;

        } else if (typeRoll < 0.66) {
            // Multiplication
            const num1 = getRandomValue(2, 12);
            const num2 = getRandomValue(2, 12);
            problem.text = `${num1} x ${num2} = ?`;
            problem.answer = num1 * num2;
        } else {
            // Division (with remainders)
            const num1 = getRandomValue(20, 100);
            const num2 = getRandomValue(2, 9);
            problem.text = `${num1} / ${num2} = ? (whole number)`;
            problem.answer = Math.floor(num1 / num2);
            problem.remainder = num1 % num2;
        }

        problemEl.textContent = problem.text;
        createBalloons(problem);
    }

    function createBalloons(problem) {
        const numBalloons = 5;

        // Ensure the correct answer is among the balloons
        let answers = [problem.answer];

        // Generate distractor answers
        while (answers.length < numBalloons) {
            let newAnswer;
            if (problem.remainder !== undefined) {
                newAnswer = getRandomValue(problem.answer - 5, problem.answer + 5);
            } else {
                newAnswer = getRandomValue(problem.answer - 10, problem.answer + 10);
            }

            if (!answers.includes(newAnswer)) {
                answers.push(newAnswer);
            }
        }

        // Shuffle the answers
        answers = answers.sort(() => Math.random() - 0.5);

        // Create and position the balloons
        for (let i = 0; i < numBalloons; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.textContent = answers[i];

            balloon.style.left = `${getRandomValue(10, 90)}%`; // Horizontal position
            balloon.style.bottom = `${getRandomValue(10, 60)}%`; // Vertical position

            balloon.onclick = () => handleBalloonClick(answers[i], problem.answer);

            balloonArea.appendChild(balloon);
            activeBalloons.push(balloon);
        }
    }

    function handleBalloonClick(selected, correct) {
        if (selected === correct) {
            score += 20;
            scoreEl.textContent = `Score: ${score}`;
            feedbackEl.innerHTML = `<span style="color:#4ade80">Correct!</span>`;

            // Remove the balloon from the display
            const balloonToRemove = activeBalloons.find(balloon => balloon.textContent == selected);
            if (balloonToRemove) {
                balloonToRemove.remove();
                activeBalloons = activeBalloons.filter(balloon => balloon.textContent != selected);
            }

            if (score >= winningScore) {
                // Game Complete
                container.innerHTML = `
                    <div style="text-align:center; color:white; padding:3rem;">
                        <div style="font-size:4rem; margin-bottom:1rem;">🎈</div>
                        <h2>Balloon Popper Master!</h2>
                        <p>You earned 100 XP.</p>
                        <button id="balloon-finish" class="play-btn" style="margin-top:2rem;">Continue</button>
                    </div>
                `;
                document.getElementById('balloon-finish').addEventListener('click', onWin);
            } else {
                setTimeout(generateProblem, 800);
            }
        } else {
            feedbackEl.innerHTML = `<span style="color:#f87171">Oops! Try again!</span>`;
        }
    }

    // Custom Styling for Balloons
    const style = document.createElement('style');
    style.textContent = `
        .balloon {
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #f472b6; /* Pink */
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
            text-align: center;
            line-height: 70px;
            vertical-align: middle;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            /* Add a subtle gradient for a rounded look */
            background-image: radial-gradient(circle at 60% 40%, rgba(255,255,255,0.3), rgba(255,255,255,0) 45%), linear-gradient(to bottom, #f472b6, #e94aa1);
            box-shadow: 3px 3px 7px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s ease-in-out;
            /* Add a glossy effect */
            
            z-index: 2;
            border: 1px solid rgba(0,0,0,0.1);
        }
        .balloon:hover {
            transform: scale(1.1);
            box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.4);
        }
         .balloon:active {
            transform: scale(0.9);
        }
        /* Variety of balloon colors */
        .balloon:nth-child(odd) {
            background-color: #a855f7; /* Purple */
        }

        .balloon:nth-child(even) {
            background-color: #38bdf8; /* Sky Blue */
        }
        .balloon:after {
            content: '';
            position: absolute;

            bottom: -10px;
            left: 50%;
            z-index: 1;
            margin-left: -3px;
        }
    `;
    document.head.appendChild(style);

    // Start first round
    generateProblem();
}


/*function startShapeRecognition(container, level, onWin, onExit) {
    let score = 0;
    const winningScore = 100;
    let activeBalloons = [];

    // Shape options
    const shapes = ["circle", "square", "triangle", "rectangle"];

    // 1. Setup UI Layout
    container.innerHTML = `
        <div class="shape-recognition-ui" style="text-align:center; color:white; font-family: 'Inter', sans-serif;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; color:#cbd5e1; font-size: 1.1rem;">
                <span>Level ${level}</span>
                <span id="shape-score" style="color:#fbbf24; font-weight:bold;">Score: 0</span>
            </div>

            <h2 style="color:#94a3b8; margin-bottom:0.5rem;">Pop the Correct Shape!</h2>
            <p style="color:#64748b; margin-bottom:2rem;">Identify and pop the balloons with the specified shape.</p>

            <div id="shape-display" style="font-size: 1.5rem; font-weight: bold; margin-bottom: 2rem; color: #cbd5e1;">
                <!-- Shape to identify injected here -->
            </div>

            <div id="balloon-area" style="position: relative; height: 300px; margin-bottom: 2rem;">
                <!-- Balloons injected here -->
            </div>

            <div id="feedback-area" style="height:30px; margin-top:1.5rem; font-weight:bold; font-size:1.1rem;"></div>

            <button id="shape-exit" class="play-btn" style="margin-top:2rem; background-color: transparent; border: 1px solid #475569; width: auto;">Exit Game</button>
        </div>
    `;
}*/