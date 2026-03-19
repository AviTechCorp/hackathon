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

// --- CONFIGURATION ---
const GEMINI_API_KEY = "AIzaSyDIU1eNQc9XZXJgl7aMe73kBa5dzv1KtqE";

// Global Config State
let currentConfig = {
    educationLevel: '',
    type: '',
    topic: ''
};
let currentUserProfile = null;

// --- GENERIC GAME LOADER CLASS ---
class GameLoader {
    static async loadAndPlay(type, container, level, onWin, onExit) {
        const gameModules = {
            'Pattern': { path: './pattern-game.js', exportName: 'startPatternGame' },
            'PingPong': { path: './ping-pong.js', exportName: 'startPingPong' },
            'Balloon': { path: './balloon-popper.js', exportName: 'startBalloonPopper' },
            'Rangers': { path: './rangers-logic.js', exportName: 'startRangersGame' }
        };

        const config = gameModules[type];
        if (!config) return false;

        try {
            const module = await import(config.path);
            if (module && typeof module[config.exportName] === 'function') {
                module[config.exportName](container, level, onWin, onExit);
                return true;
            }
        } catch (error) {
            console.error(`Failed to load ${type} game module:`, error);
            container.innerHTML = `
                <div style="text-align:center; padding:2rem; color:#f87171;">
                    <div style="font-size:3rem;">⚠️</div>
                    <h3>Module Error</h3>
                    <p>Could not load the <strong>${type}</strong> game module.</p>
                    <p style="font-size:0.9rem; color:#94a3b8;">${error.message}</p>
                    <button class="play-btn" style="width:auto; margin-top:1rem;" id="error-back-btn">Go Back</button>
                </div>
            `;
            document.getElementById('error-back-btn').addEventListener('click', onExit);
            return true; // Return true to indicate we handled the game start attempt (even if it failed)
        }
        return false;
    }
}

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

    // Initialize MathGames API (The Professional Way)
    if (window.MathGames) {
        // Note: Use a valid production key when deploying
        window.MathGames.init({ apiKey: 'DEMO-ACCESS-KEY-2026' });
    }

    // Auth & Data Loading
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserProfile(user.uid);
        } else {
            // Redirect to login if not authenticated
            window.location.href = '../html/auth.html';
        }
    });

    // --- EVENT: Standardized Game Completion Listener ---
    // Suggestion 3: Decoupled results handling
    document.addEventListener('eduFlow:gameComplete', (e) => {
        const { score, metadata } = e.detail;
        if (score > 0) {
            saveGameSession(metadata);
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
            userData = { xp: 0, level: 1, completedNodes: [], levels: {} };
            await userDocRef.set(userData);
        } else {
            userData = userDoc.data();
            if (!userData.levels) userData.levels = {};
        }
        currentUserProfile = userData;

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
    currentConfig.topic = document.getElementById('game-topic').value.trim() || "General Knowledge";

    renderLevels();
    switchView('view-levels');
}

function renderLevels() {
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';
    
    let maxUnlocked = 1;
    if (currentUserProfile && selectedSubject && currentUserProfile.levels && currentConfig.type) {
        const key = `${selectedSubject.id}_${currentConfig.type}_${currentConfig.topic}`;
        maxUnlocked = currentUserProfile.levels[key] || 1;
    }

    // Generate 12 Levels
    for (let i = 1; i <= 12; i++) {
        const btn = document.createElement('div');
        // Logic: Unlock based on user profile
        const isLocked = i > maxUnlocked; 

        btn.className = `level-card ${isLocked ? 'locked' : ''}`;
        btn.innerHTML = `${i} ${isLocked ? '<span class="lock-icon">🔒</span>' : ''}`;
        
        if (!isLocked) {
            btn.addEventListener('click', () => startGame(i));
        }
        
        grid.appendChild(btn);
    }
}

async function unlockNextLevel(completedLevel) {
    if (!currentUserProfile || !auth.currentUser || !selectedSubject) return;

    const key = `${selectedSubject.id}_${currentConfig.type}_${currentConfig.topic}`;
    const currentMax = (currentUserProfile.levels && currentUserProfile.levels[key]) || 1;

    // If the user just completed their current highest level, unlock the next one
    if (completedLevel === currentMax) {
        const newLevel = completedLevel + 1;
        try {
            if (!currentUserProfile.levels) currentUserProfile.levels = {};
            currentUserProfile.levels[key] = newLevel;

            await db.collection('users').doc(auth.currentUser.uid).update({
                [`levels.${key}`]: newLevel
            });
            renderLevels(); // Re-render to show unlock
        } catch (error) {
            console.error("Error unlocking level:", error);
        }
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
    
    // --- AI CONTENT GENERATION ---
    // If API Key is present, try to generate questions dynamically
    let aiQuestions = null;
    if (GEMINI_API_KEY && currentConfig.type === 'Quiz') {
        try {
            aiQuestions = await generateAIQuestions(currentConfig.topic, currentConfig.educationLevel, selectedSubject.title);
        } catch (e) {
            console.warn("AI Generation failed, falling back to standard content.", e);
        }
    }
    
    container.innerHTML = ''; 

    // 1.5. Check for Minigames (Snake)
    if (currentConfig.type === 'Snake') {
        startSnakeGame(container, currentConfig.educationLevel, currentConfig.topic, gameLevel, selectedSubject);
        return;
    }

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

    // 1.7 Check for AI-Generated Quiz (Overrides subject defaults if available)
    if (aiQuestions && aiQuestions.length > 0) {
        startContentQuizGame(container, currentConfig.educationLevel, currentConfig.topic, currentConfig.type, gameLevel, selectedSubject.title, null, aiQuestions);
        return;
    }

    // 2. Dispatch Game based on Subject
    const subj = selectedSubject.id;

    if (['math', 'acc', 'compsci', 'eng'].includes(subj)) {
        // Numerical & Logic Games
        // Check if topic is suitable for Number Line (Integers/Arithmetic)
        const t = currentConfig.topic.toLowerCase();
        const isIntegerTopic = !t.includes('fraction') && !t.includes('geo') && !t.includes('trig') && !t.includes('calc') && !t.includes('percent') && !t.includes('power') && !t.includes('exponent') && !t.includes('finance');
        
        if ((currentConfig.type === 'Puzzle' || currentConfig.type === 'Simulation') && isIntegerTopic) {
            startNumberLineGame(container, currentConfig.educationLevel, currentConfig.topic, gameLevel);
        } else {
            // Use the new Generic Engine (Suggestion 1)
            startUniversalQuizEngine(container, currentConfig.educationLevel, currentConfig.topic, currentConfig.type, gameLevel, selectedSubject.title);
        }
    } else if (['english', 'law', 'arts'].includes(subj)) {
        // Language & Text Games
        startWordGame(container, currentConfig.educationLevel, currentConfig.topic, currentConfig.type, gameLevel, selectedSubject.title, contentData);
    } else {
        // Content-heavy (History, Science, Geo, Life Orientation)
        startContentQuizGame(container, currentConfig.educationLevel, currentConfig.topic, currentConfig.type, gameLevel, selectedSubject.title, contentData);
    }
}

async function updateUserXP(amount) {
    if (!currentUserProfile || !auth.currentUser) return;
    
    const xpToAdd = parseInt(amount) || 0;
    if (xpToAdd <= 0) return;

    const newXP = (currentUserProfile.xp || 0) + xpToAdd;
    currentUserProfile.xp = newXP;

    // Update UI
    const xpDisplay = document.getElementById('xp-display');
    if (xpDisplay) xpDisplay.textContent = newXP;

    try {
        await db.collection('users').doc(auth.currentUser.uid).update({
            xp: newXP
        });
    } catch (error) {
        console.error("Error updating XP:", error);
    }
}

// --- Suggestion 5: Structured Reporting ---
async function saveGameSession(sessionData) {
    if (!auth.currentUser) return;
    
    // 1. Update Aggregate XP (Immediate UI Feedback)
    updateUserXP(sessionData.score);
    
    // 2. Save Detailed Metadata (Competency Map)
    try {
        await db.collection('users').doc(auth.currentUser.uid).collection('game_sessions').add({
            ...sessionData,
            timestamp: new Date() // Use serverTimestamp() in production
        });
    } catch (e) {
        console.error("Error saving session metadata:", e);
    }
}

// --- AI Generator Helper ---
async function generateAIQuestions(topic, level, subject) {
    const prompt = `Generate 5 multiple choice questions for ${level} students about "${topic}" in the subject of ${subject}. 
    Return ONLY a raw JSON array (no markdown) in this format: 
    [{"q": "Question text", "options": ["Option A", "Option B", "Option C", "Option D"], "correct": 0}] 
    (Where 'correct' is the array index 0-3 of the right answer).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    // Clean up markdown code blocks if AI adds them
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
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

function startContentQuizGame(container, levelText, topic, gameType, gameLevel, subjectTitle, contentData, aiQuestions = null) {
    let score = 0;
    let qIndex = 0;

    // Generate Questions from Content Data
    let questions = [];
    
    if (aiQuestions && aiQuestions.length > 0) {
        // Use AI Generated Questions
        questions = aiQuestions;
    } else if (contentData) {
        // Fallback: Generate from Wikipedia text
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
            document.getElementById('finish-quiz').addEventListener('click', () => {
                updateUserXP(score);
                unlockNextLevel(gameLevel);
                switchView('view-levels');
            });
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
        startRegexGame(container, topic, gameLevel);
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
            updateUserXP(50);
            unlockNextLevel(gameLevel);
            setTimeout(() => switchView('view-levels'), 1500);
        } else {
            feedback.textContent = "Try again.";
            feedback.style.color = "#f87171";
        }
    });
}

function startRegexGame(container, topic, gameLevel) {
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
            updateUserXP(50);
            unlockNextLevel(gameLevel);
            setTimeout(() => switchView('view-levels'), 1500);
        } else {
            feedback.textContent = "Pattern mismatch. Check syntax.";
            feedback.style.color = "#f87171";
        }
    });
}

/* Snake Game Implementation */
function startSnakeGame(container, levelText, topic, gameLevel, subject) {
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
        if (subject && ['math', 'acc', 'compsci', 'eng'].includes(subject.id)) {
            // Math Logic
            const mode = Math.random();
            if (mode < 0.33) {
                const base = Math.floor(Math.random() * 8) + 2;
                ruleText = `Eat Multiples of ${base}`;
                for(let i=0; i<5; i++) correctPool.push(base * (Math.floor(Math.random()*9)+1));
                for(let i=0; i<5; i++) wrongPool.push((base * (Math.floor(Math.random()*9)+1)) + (Math.random()>0.5?1:-1));
            } else if (mode < 0.66) {
                const threshold = Math.floor(Math.random() * 20) + 5;
                const isGreater = Math.random() > 0.5;
                ruleText = isGreater ? `Eat Numbers > ${threshold}` : `Eat Numbers < ${threshold}`;
                for(let i=0; i<5; i++) correctPool.push(isGreater ? threshold + Math.floor(Math.random()*10)+1 : threshold - Math.floor(Math.random()*10)-1);
                for(let i=0; i<5; i++) wrongPool.push(isGreater ? threshold - Math.floor(Math.random()*10) : threshold + Math.floor(Math.random()*10));
            } else {
                const isEven = Math.random() > 0.5;
                ruleText = isEven ? "Eat Even Numbers" : "Eat Odd Numbers";
                for(let i=0; i<5; i++) correctPool.push(isEven ? (Math.floor(Math.random()*20)*2) : (Math.floor(Math.random()*20)*2)+1);
                for(let i=0; i<5; i++) wrongPool.push(isEven ? (Math.floor(Math.random()*20)*2)+1 : (Math.floor(Math.random()*20)*2));
            }
        } else {
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

    function finishGame(isWin) {
        isGameOver = true;
        
        const correctPoints = sessionStats.correct.length * 10;
        const wrongPoints = sessionStats.incorrect.length * 10;
        const accuracy = Math.max(0, correctPoints - wrongPoints);
        const isPass = accuracy > 50;

        // Generate Feedback Summary HTML
        let html = `<h2 style="color:${isPass ? '#4ade80' : '#f87171'}; margin-bottom:0.5rem;">
            ${isPass ? 'Level Complete!' : 'Game Over'}
        </h2>`;
        
        html += `<div style="font-size:1.2rem; margin-bottom:1rem;">Grade: <strong style="color:${accuracy >= 50 ? '#4ade80' : '#f87171'}">${accuracy}%</strong></div>`;
        
        if (sessionStats.incorrect.length > 0) {
            html += `<div style="text-align:left; width:100%; font-size:0.9rem; color:#cbd5e1; background:#1e293b; padding:10px; border-radius:6px; margin-bottom:10px;">`;
            html += `<p style="margin:5px 0;">❌ <strong>Mistake:</strong> You ate <span style="color:#f87171; font-weight:bold;">${sessionStats.incorrect[0]}</span></p>`;
            html += `<p style="margin:5px 0;">⚠️ <strong>Rule:</strong> ${sessionStats.rule}</p>`;
            html += `</div>`;
            
            html += `<div style="background:#334155; padding:10px; border-radius:6px; width:100%; text-align:left; font-size:0.9rem;">`;
            html += `<strong style="color:#fbbf24;">Study Tip:</strong><br>`;
            html += `Review the topic "<em>${sessionStats.rule.replace('Eat ', '')}</em>". You need to improve distinguishing these values.`;
            html += `</div>`;
        } else if (!isWin) {
            html += `<p>You crashed into a wall! Be careful navigating.</p>`;
        } else {
            html += `<p style="color:#4ade80">Perfect run! No mistakes made.</p>`;
        }
        
        html += `<div style="display:flex; justify-content:space-around; width:100%; margin-top:10px; font-size:0.9rem; color:#94a3b8;">
            <span>Correct: <strong style="color:#4ade80">${sessionStats.correct.length}</strong></span>
            <span>Wrong: <strong style="color:#f87171">${sessionStats.incorrect.length}</strong></span>
        </div>`;
        html += `<p style="margin-top:1rem; font-size:1.2rem; font-weight:bold; color:white;">Final Score: ${score}</p>`;

        summaryEl.innerHTML = html;
        summaryEl.classList.remove('hidden');
        restartBtn.classList.remove('hidden');
        
        if (isPass) {
            nextLevelBtn.textContent = `Play Level ${gameLevel + 1} ➡`;
            nextLevelBtn.classList.remove('hidden');
            unlockNextLevel(gameLevel);
            updateUserXP(score);
        }
    }

    function handleInput(e) {
        // Toggle Pause with Spacebar
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? "Resume" : "Pause";
            if (!isPaused) gameLoop();
            return;
        }

        if (isPaused) return;

        switch (e.key) {
            case 'ArrowLeft': if (velocity.x !== 1) { velocity.x = -1; velocity.y = 0; } break;
            case 'ArrowUp': if (velocity.y !== 1) { velocity.x = 0; velocity.y = -1; } break;
            case 'ArrowRight': if (velocity.x !== -1) { velocity.x = 1; velocity.y = 0; } break;
            case 'ArrowDown': if (velocity.y !== -1) { velocity.x = 0; velocity.y = 1; } break;
        }
    }

    document.addEventListener('keydown', handleInput);

    restartBtn.addEventListener('click', () => {
        // Reset
        score = 0;
        scoreEl.textContent = `Score: ${score}`;
        tail = 5;
        player = { x: 10, y: 10 };
        velocity = { x: 0, y: 0 }; // Pause at start
        trail = [];
        isGameOver = false;
        isPaused = false;
        pauseBtn.textContent = "Pause";
        
        restartBtn.classList.add('hidden');
        nextLevelBtn.classList.add('hidden');
        summaryEl.classList.add('hidden');
        
        // Init Data
        sessionStats = { correct: [], incorrect: [], rule: "" };
        lives = maxLives;
        updateLivesUI();
        currentPools = spawnRound();
        gameLoop();
    });

    // Init First Round
    currentPools = spawnRound();
    gameLoop(); // Start Loop
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

/* --- Suggestion 1: Data-Driven Content Registry --- */
const ContentRegistry = {
    // Generators return: { question: {text, answer, type}, visual: HTML, placeholder: string }
    
    fractions: (tier, level, isSim) => {
        const denom = Math.floor(Math.random() * 10) + 2;
        const n1 = Math.floor(Math.random() * 5) + 1;
        const n2 = Math.floor(Math.random() * 5) + 1;
        
        // Visuals
        let visualHTML = '';
        if (isSim) {
            visualHTML = `<div style="width:100px; height:100px; background:conic-gradient(#6366f1 0% ${Math.floor((n1/denom)*100)}%, #334155 ${Math.floor((n1/denom)*100)}% 100%); border-radius:50%; margin:0.5rem;"></div>`;
        }

        return {
            question: {
                answer: (n1 + n2)/denom,
                text: `${n1}/${denom} + ${n2}/${denom}`,
                type: 'numeric'
            },
            visual: visualHTML,
            placeholder: "e.g. 0.75 or 3/4"
        };
    },

    geometry: (tier, level, isSim) => {
        const side = Math.floor(Math.random() * 10) + 2;
        const isArea = Math.random() > 0.5;
        
        let visualHTML = '';
        if (isSim) {
            visualHTML = `<div style="width:${side*8}px; height:${side*8}px; border:2px solid #6366f1; background:${isArea ? 'rgba(99,102,241,0.2)' : 'transparent'}; display:grid; place-items:center;">${side}</div>`;
        }

        return {
            question: {
                answer: isArea ? side * side : side * 4,
                text: `Square Side: ${side}. Find ${isArea ? 'Area' : 'Perimeter'}?`,
                type: 'numeric'
            },
            visual: visualHTML,
            placeholder: "Value"
        };
    },

    algebra: (tier, level) => {
        const x = Math.floor(Math.random() * 10) + 1;
        const a = Math.floor(Math.random() * 5) + 2;
        const b = Math.floor(Math.random() * 20) + 1;
        const c = (a * x) + b;
        return {
            question: { answer: x, text: `${a}x + ${b} = ${c}`, type: 'numeric' },
            visual: '',
            placeholder: "x = ?"
        };
    },

    logic: (tier, level) => {
        const a = Math.random() > 0.5 ? 1 : 0;
        const b = Math.random() > 0.5 ? 1 : 0;
        const op = Math.random() > 0.5 ? '&' : '|';
        return {
            question: { 
                answer: op === '&' ? (a & b) : (a | b), 
                text: `${a} ${op === '&' ? 'AND' : 'OR'} ${b}`, 
                type: 'numeric' 
            },
            visual: '',
            placeholder: "0 or 1"
        };
    },

    default_foundation: () => {
        const n1 = Math.floor(Math.random() * 10) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        return {
            question: { answer: n1 + n2, text: `${n1} + ${n2}`, type: 'numeric' },
            visual: '',
            placeholder: "?"
        };
    },

    default_intermediate: () => {
        const n1 = Math.floor(Math.random() * 11) + 2;
        const n2 = Math.floor(Math.random() * 11) + 2;
        return {
            question: { answer: n1 * n2, text: `${n1} x ${n2}`, type: 'numeric' },
            visual: '',
            placeholder: "?"
        };
    }
};

function getProblemFromRegistry(topic, tier, level, isSim) {
    const t = topic.toLowerCase();
    
    if (t.includes('fraction')) return ContentRegistry.fractions(tier, level, isSim);
    if (t.includes('geo') || t.includes('shape')) return ContentRegistry.geometry(tier, level, isSim);
    
    // Tier based defaults
    if (tier === 'highschool') {
        if (t.includes('calc') || t.includes('trig')) {
            // Fallback for now, normally would have specific generators
            return ContentRegistry.algebra(tier, level); 
        }
        return ContentRegistry.algebra(tier, level);
    }
    
    if (tier === 'tertiary') return ContentRegistry.logic(tier, level);
    if (tier === 'foundation') return ContentRegistry.default_foundation();
    
    return ContentRegistry.default_intermediate();
}

/* 
 * Universal Question Engine
 * Replaces startMathGame. Can run any subject if provided a generator in ContentRegistry.
 */
function startUniversalQuizEngine(container, levelText, topic, gameType, gameLevel, subjectTitle) {
    const tier = getTier(levelText);
    const isSimulation = (gameType === 'Simulation' || gameType === 'Puzzle');
    
    // Calc Range
    let range = 10;
    if (tier === 'intermediate') range = 50;
    else if (tier === 'highschool') range = 100;
    else if (tier === 'tertiary') range = 2; // Binary range

    range += (gameLevel * 5);

    let timeLeft = isSimulation ? null : 45;
    let score = 0;
    let timerInterval;
    let currentQuestion = null;
    let errors = []; // For metadata

    // Build Game UI
    container.innerHTML = `
        <div class="game-ui" style="text-align:center; width: 100%; max-width: 400px; font-family: 'Inter', sans-serif;">
            <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight:bold;">Level ${gameLevel}</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; font-size:1.2rem; color: #cbd5e1;">
                <span id="game-timer-display">${isSimulation ? '∞ Practice' : '⏱️ ' + timeLeft + 's'}</span>
                <span id="game-score-display">⭐ ${score}</span>
            </div>
            
            <h3 style="color: #94a3b8; margin:0;">
                ${isSimulation ? 'Simulation Mode' : 
                  tier === 'foundation' ? 'Number Sense' : 
                  tier === 'highschool' ? 'Functions & Algebra' : 
                  tier === 'tertiary' ? 'Logic & Computation' : 'Mental Math Fluency'}
            </h3>
            <p style="font-size:0.9rem; color:#64748b;">${topic}</p>
            
            <div id="math-visual" style="margin: 1rem auto; min-height: 20px; display:flex; justify-content:center; align-items:center;"></div>
            
            <div id="math-problem" style="font-size:3.5rem; font-weight:bold; margin: 2rem 0; font-family: monospace;">
                Ready?
            </div>

            <form id="math-form" style="display:flex; gap:0.5rem; justify-content:center;">
                <input type="text" id="math-answer" placeholder="?" autocomplete="off" 
                    style="width:100px; font-size:1.5rem; padding:0.5rem; text-align:center; border-radius:0.5rem; border:none;">
                <button type="submit" class="play-btn" style="width:auto;">Submit</button>
            </form>

            <div id="math-feedback" style="height:20px; margin-top:1rem; font-weight:bold;"></div>
            
            <div style="margin-top:1rem;">
                <button id="math-restart" class="play-btn hidden" style="width:auto; background-color: var(--gold); color: black; margin-right:10px;">Play Again</button>
                <button id="math-next-level" class="play-btn hidden" style="width:auto; background-color: #4ade80; color: black;">Next Level ➡</button>
            </div>
        </div>
    `;

    const problemDisplay = container.querySelector('#math-problem');
    const form = container.querySelector('#math-form');
    const input = container.querySelector('#math-answer');
    const feedback = container.querySelector('#math-feedback');
    const timerDisplay = container.querySelector('#game-timer-display');
    const scoreDisplay = container.querySelector('#game-score-display');
    const restartBtn = container.querySelector('#math-restart');
    const nextLevelBtn = container.querySelector('#math-next-level');
    const visualContainer = container.querySelector('#math-visual');

    async function generateProblem() {
        input.value = ''; 
        input.focus();

        // Fetch problem from Data-Driven Registry
        const problem = getProblemFromRegistry(topic, tier, gameLevel, isSimulation);
        
        currentQuestion = problem.question;
        visualContainer.innerHTML = problem.visual || '';
        problemDisplay.textContent = currentQuestion.text;
        input.placeholder = problem.placeholder || "?";
    }

    function endGame() {
        if (timerInterval) clearInterval(timerInterval);
        
        // Passing score threshold (e.g., 40 XP)
        const passingScore = 40; 
        const isPass = score >= passingScore;

        problemDisplay.innerHTML = isPass ? "<div>⭐</div><div style='font-size:2rem'>Level Complete!</div>" : "Game Over!";
        feedback.textContent = `Final Score: ${score}`;
        form.querySelector('button').disabled = true;
        input.disabled = true;
        restartBtn.classList.remove('hidden');
        
        if (isPass) {
            nextLevelBtn.textContent = `Play Level ${gameLevel + 1} ➡`;
            nextLevelBtn.classList.remove('hidden');
            unlockNextLevel(gameLevel);
            
            // --- Suggestion 3: Dispatch Custom Event for Results ---
            const event = new CustomEvent('eduFlow:gameComplete', {
                detail: {
                    score: score,
                    metadata: {
                        game: "UniversalQuiz",
                        topic: topic,
                        level: gameLevel,
                        score: score,
                        errors: errors
                    }
                }
            });
            document.dispatchEvent(event);
        }
    }

    function runMathLevel() {
        score = 0;
        timeLeft = isSimulation ? null : 45;
        scoreDisplay.textContent = `⭐ ${score}`;
        timerDisplay.textContent = isSimulation ? '∞ Practice' : `⏱️ ${timeLeft}s`;
        feedback.textContent = '';
        form.querySelector('button').disabled = false;
        input.disabled = false;
        restartBtn.classList.add('hidden');
        
        generateProblem();
        
        if (!isSimulation) {
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = `⏱️ ${timeLeft}s`;
                if (timeLeft <= 0) endGame();
            }, 1000);
        }
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
            errors.push(currentQuestion.text); // Log error
            input.select();
        }
    });

    restartBtn.addEventListener('click', runMathLevel);
    nextLevelBtn.addEventListener('click', () => startGame(gameLevel + 1));

    // Start immediately
    runMathLevel();
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
    if (['Grade 4', 'Grade 5', 'Grade 6'].some(g => levelText.includes(g))) return 'intermediate';
    if (['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].some(g => levelText.includes(g))) return 'highschool';
    return 'tertiary';
}