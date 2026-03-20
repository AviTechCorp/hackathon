/**
 * This file is now a "seeder" script. It's not used by the app directly.
 * After setting up Firestore, open your app, open the browser console,
 * and run `seedDatabase()` to populate your database with the initial data.
 */

const seedData = {
    // 1. Localization Data
    translations: {
        en: {
            dashboardTitle: "Your Learning Path",
            start: "Start Lesson",
            locked: "Locked",
            completed: "Completed",
            pointsLabel: "XP",
            correct: "Correct!",
            incorrect: "Try again.",
            next: "Next",
            finish: "Finish & Collect XP",
            //Grade R terms
            circle: "Circle",
            triangle: "Triangle",
            square: "Square",
            ontopof: "On Top Of",
            under: "Under",
            behind: "Behind",
            nextto: "Next To",
            taller: "Taller"
        },
        es: {
            dashboardTitle: "Tu Ruta de Aprendizaje",
            start: "Comenzar Lección",
            locked: "Bloqueado",
            completed: "Completado",
            pointsLabel: "XP",
            correct: "¡Correcto!",
            incorrect: "Inténtalo de nuevo.",
            next: "Siguiente",
            finish: "Terminar y Recoger XP"
        }
    },

    // 2. The Learning Graph
    // 'next' indicates linear progression, but in a real app, logic would determine the path
    nodes: [
        {
            id: "node_1",
            type: "lesson",
            xp: 50,
            requiredNode: null, // No requirements, start here
            content: {
                en: { title: "Math Basics", desc: "Introduction to addition." },
                es: { title: "Matemáticas Básicas", desc: "Introducción a la suma." }
            },
            quiz: {
                question: "1 + 1 = ?",
                options: ["3", "4", "5", "22"],
                correctIndex: 1
            },
            nextNodes: ["node_2"]
        },
        {
            id: "node_2",
            type: "lesson",
            xp: 100,
            requiredNode: "node_1",
            content: {
                en: { title: "Simple Multiplication", desc: "Learning to multiply." },
                es: { title: "Multiplicación Simple", desc: "Aprendiendo a multiplicar." }
            },
            quiz: {
                question: "3 x 3 = ?",
                options: ["6", "9", "12", "33"],
                correctIndex: 1
            },
            nextNodes: ["node_3_adv", "node_3_std"] // Branching path example
        },
        {
            id: "node_3_std",
            type: "lesson",
            xp: 150,
            requiredNode: "node_2",
            content: {
                en: { title: "Division Intro", desc: "Standard path: Division." },
                es: { title: "Intro a la División", desc: "Ruta estándar: División." }
            },
            quiz: {
                question: "10 / 2 = ?",
                options: ["5", "2", "10", "0"],
                correctIndex: 0
            },
            nextNodes: []
        },
        {
            id: "node_3_adv",
            type: "lesson",
            xp: 200,
            requiredNode: "node_2",
            content: {
                en: { title: "Advanced Algebra", desc: "For high achievers!" },
                es: { title: "Álgebra Avanzada", desc: "¡Para estudiantes avanzados!" }
            },
            quiz: {
                question: "2x = 10, x = ?",
                options: ["2", "10", "5", "8"],
                correctIndex: 2
            },
            nextNodes: []
        }
    ],
        gradeRNodes: [
        {
            id: "r_node_1",
            type: "lesson",
            xp: 25,
            requiredNode: null,
            content: {
                en: { title: "Counting 1-5", desc: "Learn to count from 1 to 5." },
                es: { title: "Contando 1-5", desc: "Aprende a contar del 1 al 5." }
            },
            quiz: {
                question: "How many fingers on one hand?",
                options: ["3", "4", "5", "6"],
                correctIndex: 2
            },
             nextNodes: ["r_node_2"]
        },
        {
            id: "r_node_2",
            type: "lesson",
            xp: 30,
            requiredNode: "r_node_1",
            content: {
                en: { title: "Recognizing Shapes", desc: "Identify basic 2D shapes." },
                es: { title: "Reconociendo Formas", desc: "Identifica formas 2D básicas." }
            },
        }
    ]
};

// You can run this function from the browser console to populate Firestore
async function seedDatabase(db) {
    console.log("Seeding database...");

    // 1. Seed Nodes
    const nodesBatch = db.batch();
    seedData.nodes.forEach(node => {
        const docRef = db.collection("nodes").doc(node.id);
        nodesBatch.set(docRef, node);
    });
    await nodesBatch.commit();
    console.log(`${seedData.nodes.length} nodes seeded.`);

    // 2. Seed Translations
    const translationsBatch = db.batch();
    Object.keys(seedData.translations).forEach(lang => {
        const docRef = db.collection("translations").doc(lang);
        translationsBatch.set(docRef, seedData.translations[lang]);
    });
    await translationsBatch.commit();
    console.log(`${Object.keys(seedData.translations).length} language packs seeded.`);

    console.log("Seeding complete!");
}

// To make it accessible in the console for seeding:
// window.seedDatabase = seedDatabase;
// You would then call `seedDatabase(db)` where `db` is your firestore instance.
