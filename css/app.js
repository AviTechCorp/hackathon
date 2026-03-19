import { auth, db } from './firebase-config.js';

class EduApp {
    constructor() {
        this.state = {
            lang: localStorage.getItem('lang') || 'en',
            user: null, // Firebase auth user object
            userData: null, // Firestore user profile data
            currentNode: null,
            nodes: [], // Will be fetched from Firestore
            translations: {} // Will be fetched from Firestore
        };

        this.init();
    }

    async init() {
        // Make seeder available in console for one-time setup
        window.seedDatabase = this.seedDatabase;

        // Event Listeners
        document.getElementById('lang-selector').value = this.state.lang;
        document.getElementById('lang-selector').addEventListener('change', async (e) => {
            this.state.lang = e.target.value;
            localStorage.setItem('lang', this.state.lang);
            await this.fetchTranslations();
            this.renderDashboard();
        });

        // Listen for Authentication state changes
        auth.onAuthStateChanged(async user => {
            if (user) {
                // User is signed in (anonymously)
                this.state.user = user;
                await this.fetchGameData(); // Fetch nodes and translations
                await this.fetchUserData(user.uid); // Fetch user progress
                this.updateStatsUI();
                this.renderDashboard();
            } else {
                // User is not signed in, redirect to the auth page.
                window.location.href = 'html/auth.html';
            }
        });
    }

    // --- Data Fetching from Firestore ---
    async fetchGameData() {
        // Fetch all learning nodes
        const nodesSnapshot = await db.collection("nodes").get();
        this.state.nodes = nodesSnapshot.docs.map(doc => doc.data());

        // Fetch all translations
        await this.fetchTranslations();
    }

    // --- Helper: Translation ---
    t(key) {
        return DB.translations[this.state.lang][key] || key;
    }

    async fetchTranslations() {
        const translationDoc = await db.collection("translations").doc(this.state.lang).get();
        if (translationDoc.exists) {
            this.state.translations = translationDoc.data();
        } else {
            console.error(`Translations for '${this.state.lang}' not found.`);
            // Fallback to english
            const enDoc = await db.collection("translations").doc('en').get();
            this.state.translations = enDoc.data();
        }
    }

    async fetchUserData(uid) {
        const userDocRef = db.collection("users").doc(uid);
        const userDoc = await userDoc.get();

        if (userDoc.exists) {
            this.state.userData = userDoc.data();
        } else {
            // First time user, create a profile
            const newUserProfile = {
                xp: 0,
                level: 1,
                completedNodes: []
            };
            await userDocRef.set(newUserProfile);
            this.state.userData = newUserProfile;
        }
    }

    // --- Core: Render Dashboard ---
    renderDashboard() {
        if (!this.state.userData || this.state.nodes.length === 0) {
            document.getElementById('app-container').innerHTML = '<h2>Loading...</h2>';
            return;
        }

        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="hero-section">
                <h1 tabindex="-1" id="dash-title">${this.t('dashboardTitle')}</h1>
            </div>
        `;
        
        const grid = document.createElement('div');
        grid.className = 'dashboard-grid';

        this.state.nodes.forEach(node => {
            const isCompleted = this.state.userData.completedNodes.includes(node.id);
            const isLocked = node.requiredNode && !this.state.userData.completedNodes.includes(node.requiredNode);
            
            if (isLocked && node.id.includes('adv')) return;

            const card = document.createElement('div');
            card.className = `node-card ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`;
            
            // Accessibility Attributes
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', isLocked ? '-1' : '0');
            card.setAttribute('aria-disabled', isLocked);
            
            const content = node.content[this.state.lang];
            
            card.innerHTML = `
                <h3>${content.title} ${isCompleted ? '✅' : ''}</h3>
                <p>${content.desc}</p>
                <div style="margin-top:1rem; font-weight:bold; color:var(--primary)">
                    ${isLocked ? '🔒 ' + this.t('locked') : '+ ' + node.xp + ' ' + this.t('pointsLabel')}
                </div>
            `;

            if (!isLocked) {
                card.addEventListener('click', () => this.startLesson(node));
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.startLesson(node);
                    }
                });
            }

            grid.appendChild(card);
        });

        container.appendChild(grid);
        // Manage focus for accessibility
        document.getElementById('dash-title').focus(); 
    }

    // --- Core: Lesson/Quiz Logic ---
    startLesson(node) {
        this.state.currentNode = node;
        const container = document.getElementById('app-container');
        const content = node.content[this.state.lang];
        
        container.innerHTML = `
            <div class="quiz-container">
                <h2>${content.title}</h2>
                <p class="question-text">${node.quiz.question}</p>
                <div class="options-grid" id="options-area"></div>
                <div id="feedback-area" aria-live="polite" style="margin-top:1rem; min-height:20px;"></div>
            </div>
        `;

        const optionsArea = document.getElementById('options-area');
        
        node.quiz.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => this.handleAnswer(index);
            optionsArea.appendChild(btn);
        });
    }

    handleAnswer(selectedIndex) {
        const node = this.state.currentNode;
        const feedback = document.getElementById('feedback-area');
        
        if (selectedIndex === node.quiz.correctIndex) {
            feedback.innerHTML = `<span style="color:green">✅ ${this.t('correct')}</span>`; // Uses new t()
            feedback.className = "correct-anim";
            
            // Wait briefly then complete
            setTimeout(() => {
                this.completeLesson(node);
            }, 1000);
        } else {
            feedback.innerHTML = `<span style="color:red">❌ ${this.t('incorrect')}</span>`; // Uses new t()
        }
    }

    // --- Core: Gamification & Progress ---
    async completeLesson(node) {
        if (!this.state.userData.completedNodes.includes(node.id)) {
            // Update State
            this.state.userData.completedNodes.push(node.id);
            this.state.userData.xp += node.xp;
            
            // Level Up Logic (Simple: Every 100 XP is a level)
            const newLevel = Math.floor(this.state.userData.xp / 100) + 1;
            if (newLevel > this.state.userData.level) {
                this.state.userData.level = newLevel;
                this.showToast(`🎉 Level Up! You are now Level ${newLevel}`);
            }

            // Save
            await this.saveUserData();
            this.showToast(`+${node.xp} XP Earned!`);
        }
        
        this.updateStatsUI();
        this.renderDashboard();
    }

    updateStatsUI() {
        if (!this.state.userData) return;
        document.getElementById('user-xp').textContent = `${this.state.userData.xp} XP`;
        document.getElementById('user-level').textContent = `Lvl ${this.state.userData.level}`;
    }

    async saveUserData() {
        if (!this.state.user) {
            console.error("No user is signed in. Cannot save data.");
            return;
        }
        const userDocRef = db.collection("users").doc(this.state.user.uid);
        await userDocRef.set(this.state.userData);
    }

    showToast(msg) {
        const region = document.getElementById('toast-region');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        region.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
}

async function seedDatabase() {
    console.log("Seeding database...");
    const seedData = {
        translations: {
            en: { dashboardTitle: "Your Learning Path", start: "Start Lesson", locked: "Locked", completed: "Completed", pointsLabel: "XP", correct: "Correct!", incorrect: "Try again.", next: "Next", finish: "Finish & Collect XP" },
            es: { dashboardTitle: "Tu Ruta de Aprendizaje", start: "Comenzar Lección", locked: "Bloqueado", completed: "Completado", pointsLabel: "XP", correct: "¡Correcto!", incorrect: "Inténtalo de nuevo.", next: "Siguiente", finish: "Terminar y Recoger XP" }
        },
        nodes: [
            { id: "node_1", type: "lesson", xp: 50, requiredNode: null, content: { en: { title: "Math Basics", desc: "Introduction to addition." }, es: { title: "Matemáticas Básicas", desc: "Introducción a la suma." } }, quiz: { question: "2 + 2 = ?", options: ["3", "4", "5", "22"], correctIndex: 1 }, nextNodes: ["node_2"] },
            { id: "node_2", type: "lesson", xp: 100, requiredNode: "node_1", content: { en: { title: "Simple Multiplication", desc: "Learning to multiply." }, es: { title: "Multiplicación Simple", desc: "Aprendiendo a multiplicar." } }, quiz: { question: "3 x 3 = ?", options: ["6", "9", "12", "33"], correctIndex: 1 }, nextNodes: ["node_3_adv", "node_3_std"] },
            { id: "node_3_std", type: "lesson", xp: 150, requiredNode: "node_2", content: { en: { title: "Division Intro", desc: "Standard path: Division." }, es: { title: "Intro a la División", desc: "Ruta estándar: División." } }, quiz: { question: "10 / 2 = ?", options: ["5", "2", "10", "0"], correctIndex: 0 }, nextNodes: [] },
            { id: "node_3_adv", type: "lesson", xp: 200, requiredNode: "node_2", content: { en: { title: "Advanced Algebra", desc: "For high achievers!" }, es: { title: "Álgebra Avanzada", desc: "¡Para estudiantes avanzados!" } }, quiz: { question: "2x = 10, x = ?", options: ["2", "10", "5", "8"], correctIndex: 2 }, nextNodes: [] }
        ]
    };

    const nodesBatch = db.batch();
    seedData.nodes.forEach(node => {
        const docRef = db.collection("nodes").doc(node.id);
        nodesBatch.set(docRef, node);
    });
    await nodesBatch.commit();
    console.log(`${seedData.nodes.length} nodes seeded.`);

    const translationsBatch = db.batch();
    Object.keys(seedData.translations).forEach(lang => {
        const docRef = db.collection("translations").doc(lang);
        translationsBatch.set(docRef, seedData.translations[lang]);
    });
    await translationsBatch.commit();
    console.log(`${Object.keys(seedData.translations).length} language packs seeded.`);
    console.log("Seeding complete!");
}

// Start the App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EduApp();
});
