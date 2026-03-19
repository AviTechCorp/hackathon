import { auth, db } from '../firebase-config.js';

// Subjects Data (Covering Grade R to University)
const SUBJECTS = [
    { id: 'math', title: 'Mathematics', icon: '🧮', desc: 'Arithmetic, Algebra, Calculus & Logic.' },
    { id: 'science', title: 'Natural Sciences', icon: '🧪', desc: 'Physics, Chemistry & Biology basics.' },
    { id: 'english', title: 'English', icon: '📚', desc: 'Language, Literature & Poetry.' },
    { id: 'compsci', title: 'Computer Science', icon: '💻', desc: 'Coding, Algorithms & Hardware.' },
    { id: 'history', title: 'History', icon: '🏛️', desc: 'Ancient civilizations to Modern History.' },
    { id: 'geo', title: 'Geography', icon: '🌍', desc: 'Maps, Climate & Physical environments.' },
    { id: 'acc', title: 'Accounting', icon: '📊', desc: 'Financial records and business management.' },
    { id: 'lo', title: 'Life Orientation', icon: '🧘', desc: 'Personal growth and social health.' },
    { id: 'eng', title: 'Engineering', icon: '⚙️', desc: 'Civil, Electrical & Mechanical systems.' },
    { id: 'arts', title: 'Arts & Culture', icon: '🎨', desc: 'Visual arts, Music and Drama.' },
    { id: 'med', title: 'Health Sciences', icon: '🩺', desc: 'Anatomy, Medicine & Physiology.' },
    { id: 'law', title: 'Law', icon: '⚖️', desc: 'Legal systems and Constitution.' }
];

// Global Config State
let currentConfig = {
    educationLevel: '',
    type: '',
    topic: ''
};

document.addEventListener('DOMContentLoaded', () => {
    // Logout Handler
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
            window.location.href = '../html/auth.html';
        });
    });

    // Navigation Handlers
    document.getElementById('back-to-subjects').addEventListener('click', () => {
        switchView('view-subjects');
    });

    document.getElementById('back-to-levels').addEventListener('click', () => {
        switchView('view-levels');
    });

    document.getElementById('back-to-config-from-levels').addEventListener('click', () => {
        switchView('view-config');
    });

    // Dynamic Label for University Course
    document.getElementById('education-level').addEventListener('change', (e) => {
        const label = document.getElementById('topic-label');
        const input = document.getElementById('game-topic');
        
        if (e.target.value === 'uni') {
            label.textContent = "Course Name";
            input.placeholder = "e.g. CS101: Data Structures";
        } else {
            label.textContent = "Topic";
            input.placeholder = "e.g. Algebra, Photosynthesis";
        }
    });

    // Form Submit
    document.getElementById('game-setup-form').addEventListener('submit', handleConfigSubmit);

    // Auth & Data Loading
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserProfile(user.uid);
        } else {
            // Redirect to login if not authenticated
            window.location.href = '../html/auth.html';
        }
    });
});

async function loadUserProfile(uid) {
    const levelDisplay = document.getElementById('level-display');
    const xpDisplay = document.getElementById('xp-display');
    const subjectsGrid = document.getElementById('subjects-grid');

    try {
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        
        let userData;
        
        if (!userDoc.exists) {
            // Profile missing (new user), create default
            userData = { xp: 0, level: 1, completedNodes: [] };
            await userDocRef.set(userData);
        } else {
            userData = userDoc.data();
        }

        // Update Stats
        levelDisplay.textContent = userData.level || 1;
        xpDisplay.textContent = userData.xp || 0;

        // Render Subjects Grid
        renderSubjects(subjectsGrid);

    } catch (error) {
        console.error("Error loading profile:", error);
        subjectsGrid.innerHTML = '<p>Error loading content.</p>';
    }
}

function renderSubjects(container) {
    container.innerHTML = '';

    SUBJECTS.forEach(subj => {
        const card = document.createElement('article');
        card.className = 'game-card'; // Reusing styling
        card.style.cursor = 'pointer';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        
        card.innerHTML = `
            <div class="game-icon-area" aria-hidden="true">${subj.icon}</div>
            <div class="game-content">
                <h3 class="game-title">${subj.title}</h3>
                <p class="game-desc">${subj.desc}</p>
                <button class="play-btn">Select Subject</button>
            </div>
        `;

        card.addEventListener('click', () => openConfig(subj));
        
        container.appendChild(card);
    });
}

let selectedSubject = null;

function openConfig(subject) {
    selectedSubject = subject;
    const levelSelect = document.getElementById('education-level');
    const configTitle = document.getElementById('config-title');
    
    configTitle.textContent = `Setup: ${subject.title}`;
    
    // Populate Grades (R to Uni)
    levelSelect.innerHTML = '';
    const levels = [
        { val: 'R', text: 'Grade R' },
        { val: '1', text: 'Grade 1' },
        { val: '2', text: 'Grade 2' },
        { val: '3', text: 'Grade 3' },
        { val: '4', text: 'Grade 4' },
        { val: '5', text: 'Grade 5' },
        { val: '6', text: 'Grade 6' },
        { val: '7', text: 'Grade 7' },
        { val: '8', text: 'Grade 8' },
        { val: '9', text: 'Grade 9' },
        { val: '10', text: 'Grade 10' },
        { val: '11', text: 'Grade 11' },
        { val: '12', text: 'Grade 12' },
        { val: 'uni', text: 'University / College' }
    ];

    levels.forEach(lvl => {
        const opt = document.createElement('option');
        opt.value = lvl.val;
        opt.textContent = lvl.text;
        levelSelect.appendChild(opt);
    });

    // Reset inputs
    levelSelect.value = '10'; // Default
    document.getElementById('game-topic').value = '';
    document.getElementById('game-type').value = 'Quiz';
    document.getElementById('game-topic').placeholder = "e.g. Algebra";
    document.getElementById('topic-label').textContent = "Topic";

    switchView('view-config');
}

function handleConfigSubmit(e) {
    e.preventDefault();
    
    // Store configuration
    currentConfig.educationLevel = document.getElementById('education-level').options[document.getElementById('education-level').selectedIndex].text;
    currentConfig.type = document.getElementById('game-type').value;
    currentConfig.topic = document.getElementById('game-topic').value;

    renderLevels();
    switchView('view-levels');
}

function renderLevels() {
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';

    // Generate 12 Levels
    for (let i = 1; i <= 12; i++) {
        const btn = document.createElement('div');
        // Logic: First 3 levels unlocked, others locked
        const isLocked = i > 3; 

        btn.className = `level-card ${isLocked ? 'locked' : ''}`;
        btn.innerHTML = `${i} ${isLocked ? '<span class="lock-icon">🔒</span>' : ''}`;
        
        if (!isLocked) {
            btn.addEventListener('click', () => startGame(i));
        }
        
        grid.appendChild(btn);
    }
}

async function startGame(gameLevel) {
    const container = document.getElementById('game-container');
    container.innerHTML = ''; // Clear
    switchView('view-game');

    // 1. Simulate "Extraction from Internet/Database"
    renderLoadingScreen(container, selectedSubject.title, currentConfig.topic);

    // Animate loading bar
    setTimeout(() => {
        const bar = document.getElementById('load-bar');
        if(bar) bar.style.width = '100%';
    }, 100);

    // Fetch Content from Wikipedia API
    const contentData = await fetchContentForTopic(currentConfig.topic);
    
    container.innerHTML = ''; 

    // 2. Dispatch Game based on Subject
    const subj = selectedSubject.id;

    if (['math', 'acc', 'compsci', 'eng'].includes(subj)) {
        // Numerical & Logic Games
        if (currentConfig.type === 'Puzzle') {
            startNumberLineGame(container, currentConfig.educationLevel, currentConfig.topic, gameLevel);
        } else {
            startMathGame(container, currentConfig.educationLevel, currentConfig.topic, currentConfig.type, gameLevel, selectedSubject.title, contentData);
        }
    } else if (['english', 'law', 'arts'].includes(subj)) {
        // Language & Text Games
        startWordGame(container, currentConfig.educationLevel, currentConfig.topic, currentConfig.type, gameLevel, selectedSubject.title, contentData);
    } else {
        // Content-heavy (History, Science, Geo, Life Orientation)
        startContentQuizGame(container, currentConfig.educationLevel, currentConfig.topic, currentConfig.type, gameLevel, selectedSubject.title, contentData);
    }
}

async function fetchContentForTopic(topic) {
    try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.extract; 
    } catch (e) {
        console.warn("API Fetch failed", e);
        return null;
    }
}

function renderLoadingScreen(container, subject, topic) {
    container.innerHTML = `
        <div style="text-align:center; padding:3rem; color: #cbd5e1;">
            <div style="font-size:3rem; margin-bottom:1rem; animation: spin 2s linear infinite;">🌍</div>
            <h3>Searching Knowledge Base...</h3>
            <p>Extracting content for <strong>${subject}</strong>: <em>${topic}</em></p>
            <div style="width:200px; height:4px; background:#334155; margin:1rem auto; border-radius:2px; overflow:hidden;">
                <div style="width:0%; height:100%; background:#6366f1; transition:width 2s ease-in-out;" id="load-bar"></div>
            </div>
            <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
        </div>
    `;
}

function startContentQuizGame(container, levelText, topic, gameType, gameLevel, subjectTitle, contentData) {
    let score = 0;
    let qIndex = 0;

    // Generate Questions from Content Data
    let questions = [];
    
    if (contentData) {
        const sentences = contentData.split('. ').filter(s => s.length > 20 && s.length < 150);
        const words = contentData.split(' ').filter(w => w.length > 5).map(w => w.replace(/[^a-zA-Z]/g, ''));
        
        sentences.forEach(sentence => {
            const wordsInSentence = sentence.split(' ');
            const targetWord = wordsInSentence.find(w => w.length > 6);
            
            if (targetWord) {
                const cleanTarget = targetWord.replace(/[^a-zA-Z0-9-]/g, '');
                const qText = sentence.replace(targetWord, '_________');
                
                const opts = [cleanTarget];
                while(opts.length < 4) {
                    const randomWord = words[Math.floor(Math.random() * words.length)];
                    if (randomWord && !opts.includes(randomWord)) opts.push(randomWord);
                }
                const shuffled = opts.sort(() => 0.5 - Math.random());
                
                questions.push({
                    q: qText,
                    options: shuffled,
                    correct: shuffled.indexOf(cleanTarget)
                });
            }
        });
    }

    if (questions.length === 0) {
        questions = [
            {
                q: `Which key concept is foundational to understanding <strong>${topic}</strong>?`,
                options: ["The Primary Theory", "Historical Relevance", "Abstract Application", "Critical Analysis"],
                correct: 0
            },
            {
                q: `True or False: <strong>${topic}</strong> is relevant to ${subjectTitle}.`,
                options: ["True", "False"],
                correct: 0
            }
        ];
    }

    questions = questions.slice(0, 5);

    function renderQuestion() {
        if (qIndex >= questions.length) {
            container.innerHTML = `
                <div style="text-align:center; padding:2rem; color:white;">
                    <h2>🎉 Topic Complete!</h2>
                    <p>You have demonstrated knowledge in <strong>${topic}</strong>.</p>
                    <h3>Score: ${score} XP</h3>
                    <button id="finish-quiz" class="play-btn" style="margin-top:1rem; width:auto;">Return to Menu</button>
                </div>
            `;
            document.getElementById('finish-quiz').addEventListener('click', () => switchView('view-levels'));
            return;
        }

        const q = questions[qIndex];
        
        container.innerHTML = `
            <div style="max-width:600px; margin:0 auto; text-align:center;">
                <div style="display:flex; justify-content:space-between; color:#94a3b8; margin-bottom:1rem;">
                    <span>Topic: ${topic}</span>
                    <span>XP: ${score}</span>
                </div>
                <h3 style="color:white; font-size:1.4rem; margin-bottom:2rem; line-height:1.5;">${q.q}</h3>
                <div style="display:grid; gap:1rem;">
                    ${q.options.map((opt, i) => `
                        <button class="play-btn quiz-opt" data-idx="${i}" style="background:var(--surface-color); color:var(--text-main); border:1px solid var(--border-color); text-align:left;">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.quiz-opt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                if (idx === q.correct) {
                    score += 50;
                    e.target.style.background = "#4ade80"; // Green
                } else {
                    e.target.style.background = "#f87171"; // Red
                }
                
                setTimeout(() => {
                    qIndex++;
                    renderQuestion();
                }, 800);
            });
        });
    }

    renderQuestion();
}

function startWordGame(container, levelText, topic, gameType, gameLevel, subjectTitle, contentData) {
    const tier = getTier(levelText);
    let gameMode = "scramble";
    
    // 1. Configure based on Educational Tier
    if (tier === 'foundation') {
        // Phonics / Sight Words
        const sightWords = ["CAT", "DOG", "SUN", "MOM", "DAD", "YES", "NO", "RUN"];
        var keyword = sightWords[Math.floor(Math.random() * sightWords.length)];
    } else if (tier === 'tertiary') {
        // Linguistics & Technical Writing (Regex)
        startRegexGame(container, topic);
        return;
    } else {
        // Intermediate/High School: Content Vocabulary
        var keyword = topic.split(' ')[0].toUpperCase();
        if (contentData) {
            const bigWords = contentData.split(' ').filter(w => w.length > (tier === 'highschool' ? 6 : 4)).map(w => w.replace(/[^a-zA-Z]/g, '').toUpperCase());
            if (bigWords.length > 0) keyword = bigWords[Math.floor(Math.random() * bigWords.length)];
        }
    }
    
    const scrambled = keyword.split('').sort(() => 0.5 - Math.random()).join(' ');

    container.innerHTML = `
        <div style="text-align:center; color:white;">
            <h3 style="color:#94a3b8;">${subjectTitle}: ${tier === 'foundation' ? 'Phonics' : 'Vocabulary'}</h3>
            <p>${tier === 'foundation' ? 'What word is this?' : `Unscramble the keyword related to <strong>${topic}</strong>:`}</p>
            
            <h1 style="font-size:3.5rem; letter-spacing:0.5rem; margin:2rem 0; font-family:monospace;">${scrambled}</h1>
            
            <input type="text" id="word-input" placeholder="Type answer..." autocomplete="off" 
                style="padding:1rem; font-size:1.5rem; text-align:center; border-radius:0.5rem; border:none; width:250px; text-transform:uppercase;">
            
            <br><br>
            <button id="check-word" class="play-btn" style="width:auto;">Submit Answer</button>
            <p id="word-feedback" style="margin-top:1rem; height:20px; font-weight:bold;"></p>
        </div>
    `;

    document.getElementById('check-word').addEventListener('click', () => {
        const input = document.getElementById('word-input').value.toUpperCase();
        const feedback = document.getElementById('word-feedback');
        
        if (input === keyword || (tier === 'foundation' && input.includes(keyword))) {
            feedback.textContent = "Correct! Well done.";
            feedback.style.color = "#4ade80";
            setTimeout(() => switchView('view-levels'), 1500);
        } else {
            feedback.textContent = "Try again.";
            feedback.style.color = "#f87171";
        }
    });
}

function startRegexGame(container, topic) {
    const patterns = [
        { desc: "Match any 3 digits", pattern: /^\d{3}$/, hint: "e.g. 123" },
        { desc: "Match a localized greeting", pattern: /^(Hello|Hola|Bonjour)$/i, hint: "Hello, Hola, or Bonjour" },
        { desc: "Match an email suffix", pattern: /@gmail\.com$/, hint: "Ends with @gmail.com" },
        { desc: "Match capital letters only", pattern: /^[A-Z]+$/, hint: "ABC (no numbers or lowercase)" }
    ];
    const challenge = patterns[Math.floor(Math.random() * patterns.length)];

    container.innerHTML = `
        <div style="text-align:center; color:white;">
            <h3 style="color:#94a3b8;">Tertiary: Syntax & Logic</h3>
            <p>Write a string that matches this <strong>RegEx</strong> pattern:</p>
            <code style="display:block; font-size:1.5rem; background:#1e293b; padding:1rem; margin:1rem; border-radius:0.5rem; color:#f472b6;">${challenge.pattern.toString()}</code>
            <p style="font-size:0.9rem; color:#94a3b8;">Task: ${challenge.desc}</p>
            
            <input type="text" id="regex-input" placeholder="Type test string..." autocomplete="off" 
                style="padding:1rem; font-size:1.2rem; text-align:center; border-radius:0.5rem; border:none; width:300px;">
            
            <br><br>
            <button id="check-regex" class="play-btn" style="width:auto;">Test Pattern</button>
            <p id="regex-feedback" style="margin-top:1rem; height:20px; font-weight:bold;"></p>
        </div>
    `;

    document.getElementById('check-regex').addEventListener('click', () => {
        const val = document.getElementById('regex-input').value;
        const feedback = document.getElementById('regex-feedback');
        
        if (challenge.pattern.test(val)) {
            feedback.textContent = "Match Success! Syntax Valid.";
            feedback.style.color = "#4ade80";
            setTimeout(() => switchView('view-levels'), 1500);
        } else {
            feedback.textContent = "Pattern mismatch. Check syntax.";
            feedback.style.color = "#f87171";
        }
    });
}

/* Number Line Game Implementation */
function startNumberLineGame(container, levelText, topic, gameLevel) {
    // Determine Range based on Grade
    let min = 0, max = 10; // Default (Grade R-3)
    
    // Grade 4+ gets negative numbers
    if (!['Grade R', 'Grade 1', 'Grade 2', 'Grade 3'].some(g => levelText.includes(g))) {
        min = -5;
        max = 5;
    }

    // Increase difficulty based on Game Level selection
    min = min * gameLevel;
    max = max * gameLevel;

    let score = 0;
    let currentAnswer = 0;

    container.innerHTML = `
        <div class="nl-wrapper">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; color:#cbd5e1;">
                <span id="nl-level">Lvl ${gameLevel}: ${levelText}</span>
                <span id="nl-score">⭐ ${score}</span>
            </div>
            
            <h2 id="nl-question" style="font-size: 2.5rem; margin: 2rem 0; color: white;">Loading...</h2>
            
            <!-- Draggable Item Container -->
            <div id="nl-token-area" style="height: 60px; margin-bottom: 2rem;">
                <!-- Token injected here -->
            </div>

            <!-- Number Line -->
            <div class="nl-container">
                <div class="nl-line"></div>
                <!-- Ticks injected here -->
            </div>

            <div id="nl-feedback" style="height: 30px; font-weight: bold; color: #94a3b8;">
                Drag the gold coin to the correct number!
            </div>
            
            <button id="nl-next" class="play-btn hidden" style="width: auto; margin-top: 1rem;">Next Question</button>
        </div>
    `;

    const questionEl = container.querySelector('#nl-question');
    const tokenArea = container.querySelector('#nl-token-area');
    const nlContainer = container.querySelector('.nl-container');
    const feedback = container.querySelector('#nl-feedback');
    const nextBtn = container.querySelector('#nl-next');
    const scoreEl = container.querySelector('#nl-score');

    // Render Number Line Ticks
    function renderLine() {
        // Clear existing ticks except the line itself
        Array.from(nlContainer.children).forEach(child => {
            if (!child.classList.contains('nl-line')) child.remove();
        });

        for (let i = min; i <= max; i++) {
            const tickGroup = document.createElement('div');
            tickGroup.className = 'nl-tick-group';
            
            const zone = document.createElement('div');
            zone.className = 'nl-drop-zone';
            zone.dataset.value = i;
            
            // Drop Events
            zone.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow dropping
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', handleDrop);

            const label = document.createElement('div');
            label.className = 'nl-label';
            label.textContent = i;

            tickGroup.appendChild(zone);
            tickGroup.appendChild(label);
            nlContainer.appendChild(tickGroup);
        }
    }

    function generateProblem() {
        // Simple addition/subtraction within range
        const target = Math.floor(Math.random() * (max - min + 1)) + min;
        currentAnswer = target;
        
        // Create equation
        const diff = Math.floor(Math.random() * 5); // Random offset
        let qText = "";
        
        if (Math.random() > 0.5) {
            // Addition: (target - diff) + diff = target
            qText = `${target - diff} + ${diff} = ?`;
        } else {
            // Subtraction: (target + diff) - diff = target
            qText = `${target + diff} - ${diff} = ?`;
        }

        questionEl.textContent = qText;
        feedback.textContent = "Drag the answer to the number line!";
        feedback.style.color = "#94a3b8";
        nextBtn.classList.add('hidden');

        // Create Token
        tokenArea.innerHTML = '';
        const token = document.createElement('div');
        token.className = 'draggable-token';
        token.draggable = true;
        token.textContent = "?"; // Or show the answer if we want simple matching
        token.id = "answer-token";
        
        token.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', currentAnswer);
            setTimeout(() => token.classList.add('hidden'), 0);
        });

        token.addEventListener('dragend', () => {
            token.classList.remove('hidden');
        });

        tokenArea.appendChild(token);
        
        // Re-render line to clear visual states
        renderLine();
    }

    function handleDrop(e) {
        e.preventDefault();
        const zone = e.currentTarget;
        zone.classList.remove('drag-over');
        
        const droppedVal = parseInt(zone.dataset.value);
        
        if (droppedVal === currentAnswer) {
            // Correct
            score += 20;
            scoreEl.textContent = `⭐ ${score}`;
            
            feedback.textContent = "Correct! Well done.";
            feedback.style.color = "#4ade80";
            
            // Visual feedback
            zone.style.borderColor = "#4ade80";
            zone.style.background = "#4ade80";
            zone.style.color = "#000";
            zone.textContent = currentAnswer;
            
            document.getElementById('answer-token').remove();
            nextBtn.classList.remove('hidden');
        } else {
            // Incorrect
            feedback.textContent = `Oops! That's ${droppedVal}. Try again.`;
            feedback.style.color = "#f87171";
        }
    }

    nextBtn.addEventListener('click', generateProblem);

    // Init
    renderLine();
    generateProblem();
}

/* Renamed: Generic Math Game */
function startMathGame(container, levelText, topic, gameType, gameLevel, subjectTitle, contentData) {
    const tier = getTier(levelText);
    
    // Calc Range
    let range = 10;
    if (tier === 'intermediate') range = 50;
    else if (tier === 'highschool') range = 100;
    else if (tier === 'tertiary') range = 2; // Binary range

    range += (gameLevel * 5);

    let timeLeft = 45;
    let score = 0;
    let timerInterval;
    let currentQuestion = null;

    // Build Game UI
    container.innerHTML = `
        <div class="game-ui" style="text-align:center; width: 100%; max-width: 400px; font-family: 'Inter', sans-serif;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; font-size:1.2rem; color: #cbd5e1;">
                <span id="game-timer-display">⏱️ ${timeLeft}s</span>
                <span id="game-score-display">⭐ ${score}</span>
            </div>
            
            <h3 style="color: #94a3b8; margin:0;">
                ${tier === 'foundation' ? 'Number Sense' : 
                  tier === 'highschool' ? 'Functions & Algebra' : 
                  tier === 'tertiary' ? 'Logic & Computation' : 'Mental Math Fluency'}
            </h3>
            <p style="font-size:0.9rem; color:#64748b;">${topic}</p>
            
            <div id="math-problem" style="font-size:3.5rem; font-weight:bold; margin: 2rem 0; font-family: monospace;">
                Ready?
            </div>

            <form id="math-form" style="display:flex; gap:0.5rem; justify-content:center;">
                <input type="text" id="math-answer" placeholder="?" autocomplete="off" 
                    style="width:100px; font-size:1.5rem; padding:0.5rem; text-align:center; border-radius:0.5rem; border:none;">
                <button type="submit" class="play-btn" style="width:auto;">Submit</button>
            </form>

            <div id="math-feedback" style="height:20px; margin-top:1rem; font-weight:bold;"></div>
            
            <button id="math-restart" class="play-btn hidden" style="margin-top:1rem; background-color: var(--gold); color: black;">Play Again</button>
        </div>
    `;

    const problemDisplay = container.querySelector('#math-problem');
    const form = container.querySelector('#math-form');
    const input = container.querySelector('#math-answer');
    const feedback = container.querySelector('#math-feedback');
    const timerDisplay = container.querySelector('#game-timer-display');
    const scoreDisplay = container.querySelector('#game-score-display');
    const restartBtn = container.querySelector('#math-restart');

    function generateProblem() {
        const t = topic.toLowerCase();
        input.value = '';
        input.focus();

        // --- TOPIC: FRACTIONS ---
        if (t.includes('fraction')) {
            const denom = Math.floor(Math.random() * 10) + 2;
            const n1 = Math.floor(Math.random() * 5) + 1;
            const n2 = Math.floor(Math.random() * 5) + 1;
            
            if (t.includes('compare') || t.includes('order')) {
                // Compare logic: 1/2 vs 1/3
                const d2 = denom + (Math.random() > 0.5 ? 1 : -1) || 3;
                const val1 = n1/denom;
                const val2 = n2/d2;
                let sign = '=';
                if (val1 > val2) sign = '>';
                if (val1 < val2) sign = '<';
                
                currentQuestion = {
                    answer: sign,
                    text: `${n1}/${denom} _ ${n2}/${d2}`,
                    type: 'symbol'
                };
                input.placeholder = "<, >, =";
            } else {
                // Arithmetic: 1/4 + 2/4
                const isAdd = Math.random() > 0.5;
                currentQuestion = {
                    answer: isAdd ? (n1 + n2)/denom : (n1 - n2)/denom,
                    text: `${n1}/${denom} ${isAdd ? '+' : '-'} ${n2}/${denom}`,
                    type: 'numeric'
                };
                input.placeholder = "e.g. 3/4 or 0.75";
            }
        }
        // --- TOPIC: EXPONENTS / POWERS ---
        else if (t.includes('exponent') || t.includes('power')) {
            const base = Math.floor(Math.random() * 9) + 2;
            const exp = Math.floor(Math.random() * 3) + 2;
            currentQuestion = {
                answer: Math.pow(base, exp),
                text: `${base}^${exp}`, // Displays as base^exp
                type: 'numeric'
            };
            input.placeholder = "Value";
        }
        // --- TOPIC: PERCENTAGE ---
        else if (t.includes('percent') || t.includes('finance') || t.includes('tax')) {
            const whole = (Math.floor(Math.random() * 10) + 1) * 100;
            const pct = (Math.floor(Math.random() * 5) + 1) * 10; // 10, 20... 50%
            currentQuestion = {
                answer: (pct/100) * whole,
                text: `${pct}% of ${whole}`,
                type: 'numeric'
            };
            input.placeholder = "Amount";
        }
        // --- TOPIC: COMPARING (INTEGERS) ---
        else if (t.includes('compare') || t.includes('order')) {
            const n1 = Math.floor(Math.random() * 100);
            const n2 = Math.floor(Math.random() * 100);
            let sign = '=';
            if (n1 > n2) sign = '>';
            if (n1 < n2) sign = '<';
            currentQuestion = {
                answer: sign,
                text: `${n1} _ ${n2}`,
                type: 'symbol'
            };
            input.placeholder = "<, >, =";
        }
        // --- DEFAULT TIERS (FALLBACK) ---
        else if (tier === 'highschool') {
            // Algebra: ax + b = c, solve for x
            const x = Math.floor(Math.random() * 10) + 1; // answer
            const a = Math.floor(Math.random() * 5) + 2;
            const b = Math.floor(Math.random() * 20) + 1;
            const c = (a * x) + b;
            currentQuestion = {
                answer: x,
                text: `${a}x + ${b} = ${c}`,
                type: 'numeric'
            };
            input.placeholder = "x = ?";
        } else if (tier === 'tertiary') {
            // Logic: 1 AND 0, etc.
            const a = Math.random() > 0.5 ? 1 : 0;
            const b = Math.random() > 0.5 ? 1 : 0;
            const op = Math.random() > 0.5 ? '&' : '|';
            const ans = op === '&' ? (a & b) : (a | b);
            currentQuestion = {
                answer: ans,
                text: `${a} ${op === '&' ? 'AND' : 'OR'} ${b}`,
                type: 'numeric'
            };
            input.placeholder = "0 or 1";
        } else {
            // Standard Arithmetic
            const n1 = Math.floor(Math.random() * (range * 2)) - range;
            const n2 = Math.floor(Math.random() * (range * 2)) - range;
            const isAdd = Math.random() > 0.5;
            currentQuestion = {
                answer: isAdd ? n1 + n2 : n1 - n2,
                text: `${n1} ${isAdd ? '+' : '-'} ${n2 < 0 ? `(${n2})` : n2}`,
                type: 'numeric'
            };
        }
        
        problemDisplay.textContent = currentQuestion.text;
    }

    function endGame() {
        clearInterval(timerInterval);
        problemDisplay.textContent = "Game Over!";
        feedback.textContent = `Final Score: ${score}`;
        form.querySelector('button').disabled = true;
        input.disabled = true;
        restartBtn.classList.remove('hidden');
    }

    function startGame() {
        score = 0;
        timeLeft = 45;
        scoreDisplay.textContent = `⭐ ${score}`;
        timerDisplay.textContent = `⏱️ ${timeLeft}s`;
        feedback.textContent = '';
        form.querySelector('button').disabled = false;
        input.disabled = false;
        restartBtn.classList.add('hidden');
        
        generateProblem();
        
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `⏱️ ${timeLeft}s`;
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let userVal = input.value.trim();
        if (!userVal) return;
        
        let isCorrect = false;

        if (currentQuestion.type === 'symbol') {
            // String comparison for <, >, =
            if (userVal === currentQuestion.answer) isCorrect = true;
        } else {
            // Numeric comparison (handle "1/2" input)
            let num = parseFloat(userVal);
            if (userVal.includes('/')) {
                const [n, d] = userVal.split('/');
                if (d) num = parseFloat(n) / parseFloat(d);
            }
            if (Math.abs(num - currentQuestion.answer) < 0.01) isCorrect = true;
        }

        if (isCorrect) {
            score += 10;
            scoreDisplay.textContent = `⭐ ${score}`;
            feedback.textContent = "Correct!";
            feedback.style.color = "#4ade80"; // Green
            generateProblem();
        } else {
            feedback.textContent = "Try again!";
            feedback.style.color = "#f87171"; // Red
            input.select();
        }
    });

    restartBtn.addEventListener('click', startGame);

    // Start immediately
    startGame();
}

function switchView(viewId) {
    ['view-subjects', 'view-config', 'view-levels', 'view-game'].forEach(id => {
        const el = document.getElementById(id);
        if (id === viewId) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
}

function getTier(levelText) {
    if (['Grade R', 'Grade 1', 'Grade 2', 'Grade 3'].some(g => levelText.includes(g))) return 'foundation';
    if (['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'].some(g => levelText.includes(g))) return 'intermediate';
    if (['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].some(g => levelText.includes(g))) return 'highschool';
    return 'tertiary';
}