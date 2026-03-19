/**
 * Pattern Recognition Game Module
 * Handles generation of logical sequences (Numbers, Visuals, Letters).
 */

export function startPatternGame(container, level, onWin, onExit) {
    let score = 0;
    const winningScore = 100;
    
    // 1. Setup UI Layout
    container.innerHTML = `
        <div class="pattern-game-ui" style="text-align:center; color:white; max-width:600px; margin:0 auto; font-family: 'Inter', sans-serif;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; color:#cbd5e1; font-size: 1.1rem;">
                <span>Level ${level}</span>
                <span id="pattern-score" style="color:#fbbf24; font-weight:bold;">Score: 0</span>
            </div>
            
            <h2 style="color:#94a3b8; margin-bottom:0.5rem;">Pattern Logic</h2>
            <p style="color:#64748b; margin-bottom:3rem;">Identify the rule and select the missing element.</p>
            
            <div id="pattern-display" style="
                font-size: 2.5rem; 
                font-weight: bold; 
                letter-spacing: 2px; 
                margin-bottom: 3rem; 
                background: #1e293b; 
                padding: 2rem; 
                border-radius: 16px; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                min-height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
            ">
                Loading...
            </div>
            
            <div id="options-container" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
                <!-- Options injected here -->
            </div>
            
            <div id="feedback-area" style="height:30px; margin-top:1.5rem; font-weight:bold; font-size:1.1rem;"></div>
            
            <button id="pattern-exit" class="play-btn" style="margin-top:2rem; background-color: transparent; border: 1px solid #475569; width: auto;">Exit Game</button>
        </div>
    `;

    const display = document.getElementById('pattern-display');
    const optionsContainer = document.getElementById('options-container');
    const feedback = document.getElementById('feedback-area');
    const scoreEl = document.getElementById('pattern-score');

    document.getElementById('pattern-exit').addEventListener('click', onExit);

    function generatePattern() {
        feedback.textContent = "";
        optionsContainer.innerHTML = "";
        
        const typeRoll = Math.random();
        let sequence = [];
        let answer = "";
        let distractors = [];

        // --- Type A: Number Sequences (Arithmetic/Geometric) ---
        if (typeRoll < 0.45) {
            let start = Math.floor(Math.random() * (5 * level)) + 1;
            let step = Math.floor(Math.random() * level) + 1;
            
            if (level >= 8 && Math.random() > 0.6) {
                // Complex: Squares or Fibonacci
                if (Math.random() > 0.5) {
                    // Squares (n^2)
                    start = Math.floor(Math.random() * 5) + 1;
                    for(let i=0; i<5; i++) sequence.push(Math.pow(start + i, 2));
                } else {
                    // Fibonacci
                    let a = Math.floor(Math.random() * 5) + 1;
                    let b = Math.floor(Math.random() * 5) + 5;
                    sequence = [a, b];
                    for(let i=2; i<6; i++) sequence.push(sequence[i-1] + sequence[i-2]);
                    sequence = sequence.slice(0, 5); // Take first 5
                }
            } else if (level >= 4 && Math.random() > 0.6) {
                // Geometric (Multiply)
                start = Math.floor(Math.random() * 5) + 1;
                const mult = Math.floor(Math.random() * 2) + 2; // x2 or x3
                for(let i=0; i<5; i++) sequence.push(start * Math.pow(mult, i));
            } else {
                // Arithmetic (Add or Subtract)
                const isSub = level > 3 && Math.random() > 0.5;
                if (isSub) start += (step * 6); // Ensure start is high enough
                for(let i=0; i<5; i++) sequence.push(isSub ? start - (step * i) : start + (step * i));
            }
            
            // Hide the 4th element (index 3) usually
            const hideIdx = 3;
            answer = sequence[hideIdx];
            sequence[hideIdx] = '?';
            
            // Smart distractors based on pattern type
            let d1, d2, d3;
            if (answer > 100) {
                d1 = answer + 10; d2 = answer - 10; d3 = answer + 25;
            } else {
                d1 = answer + step; d2 = answer - step; d3 = answer + 1;
            }
            
            distractors = [
                d1, d2, d3
            ].filter(v => v !== answer);
        } 
        // --- Type B: Visual Emojis ---
        else if (typeRoll < 0.8) {
            const emojis = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟧', '💎', '⭐'];
            const p1 = emojis[Math.floor(Math.random() * emojis.length)];
            const p2 = emojis[Math.floor(Math.random() * emojis.length)];
            const p3 = emojis[Math.floor(Math.random() * emojis.length)];
            const p4 = emojis[Math.floor(Math.random() * emojis.length)];
            
            let pat = [];
            
            if (level >= 6 && Math.random() > 0.5) {
                // Complex: A B C D A ?
                pat = [p1, p2, p3, p4, p1, '?'];
                answer = p2;
                distractors = emojis.filter(e => e !== p2);
            } else if (Math.random() > 0.5) {
                // Pattern: A B A B A ?
                pat = [p1, p2, p1, p2, p1, '?'];
                answer = p2;
                distractors = emojis.filter(e => e !== p2);
            } else {
                // Pattern: A B C A B ?
                pat = [p1, p2, p3, p1, p2, '?'];
                answer = p3;
                distractors = emojis.filter(e => e !== p3);
            }
            sequence = pat;
        } 
        // --- Type C: Letters ---
        else {
            const startCode = 65 + Math.floor(Math.random() * 15); // A...
            let step = 1;
            
            if (level >= 5) step = Math.floor(Math.random() * 2) + 2; // Skip 2 or 3
            
            // Backwards for high levels?
            const isBack = level >= 7 && Math.random() > 0.5;
            let current = isBack ? startCode + 10 : startCode;
            
            for(let i=0; i<5; i++) {
                sequence.push(String.fromCharCode(current));
                current = isBack ? current - step : current + step;
            }
            
            const hideIdx = 4;
            answer = sequence[hideIdx];
            sequence[hideIdx] = '?';
            
            distractors = [
                String.fromCharCode(answer.charCodeAt(0) + 1),
                String.fromCharCode(answer.charCodeAt(0) - 1),
                String.fromCharCode(answer.charCodeAt(0) + 2)
            ];
        }

        // Render Sequence with styling
        display.innerHTML = sequence.map(item => 
            item === '?' ? `<span style="color:#fbbf24; border-bottom:3px solid #fbbf24;">?</span>` : item
        ).join('<span style="color:#6366f1; font-size:1.5rem; margin:0 10px;">→</span>');

        // Render Options Buttons
        let opts = [answer, ...distractors.slice(0,3)];
        opts = opts.sort(() => 0.5 - Math.random());
        
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'play-btn';
            btn.style.margin = '0'; // Override default
            btn.textContent = opt;
            btn.onclick = () => handleAnswer(opt, answer);
            optionsContainer.appendChild(btn);
        });
    }

    function handleAnswer(selected, correct) {
        if (String(selected) === String(correct)) {
            score += 20;
            scoreEl.textContent = `Score: ${score}`;
            feedback.innerHTML = `<span style="color:#4ade80">Correct!</span>`;
            
            if (score >= winningScore) {
                // Game Complete
                container.innerHTML = `
                    <div style="text-align:center; color:white; padding:3rem;">
                        <div style="font-size:4rem; margin-bottom:1rem;">🧩</div>
                        <h2>Pattern Mastered!</h2>
                        <p>You earned 100 XP.</p>
                        <button id="pattern-finish" class="play-btn" style="margin-top:2rem;">Continue</button>
                    </div>
                `;
                document.getElementById('pattern-finish').addEventListener('click', onWin);
            } else {
                setTimeout(generatePattern, 800);
            }
        } else {
            feedback.innerHTML = `<span style="color:#f87171">Incorrect sequence. Try again!</span>`;
        }
    }

    // Start first round
    generatePattern();
}