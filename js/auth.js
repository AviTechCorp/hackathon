import { auth } from '../firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const toggleLink = document.getElementById('toggle-link');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const toggleText = document.getElementById('toggle-text');
    const errorMessageDiv = document.getElementById('error-message');

    let isSignIn = true;

    // Function to show errors
    const showError = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove('hidden');
    };

    // Function to clear errors
    const clearError = () => {
        errorMessageDiv.textContent = '';
        errorMessageDiv.classList.add('hidden');
    };

    // Toggle between Sign In and Sign Up
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();

        const currentForm = isSignIn ? signinForm : signupForm;
        const nextForm = isSignIn ? signupForm : signinForm;

        // 1. Fade out current form
        currentForm.classList.add('fading');

        setTimeout(() => {
            // 2. Hide current and switch state
            currentForm.classList.add('hidden');
            currentForm.classList.remove('fading');
            
            isSignIn = !isSignIn;
            clearError();

            // 3. Update Text
            if (isSignIn) {
                formTitle.textContent = 'Sign In';
                formSubtitle.textContent = 'Welcome back! Please enter your details.';
                toggleText.textContent = "Don't have an account?";
                toggleLink.textContent = 'Sign Up';
            } else {
                formTitle.textContent = 'Create Account';
                formSubtitle.textContent = 'Get started with your learning journey!';
                toggleText.textContent = 'Already have an account?';
                toggleLink.textContent = 'Sign In';
            }

            // 4. Show next form (start fading in)
            nextForm.classList.add('fading');
            nextForm.classList.remove('hidden');
            
            // Trigger reflow to enable transition
            requestAnimationFrame(() => {
                nextForm.classList.remove('fading');
            });
        }, 300); // Wait for CSS transition
    });

    // Sign In Logic
    signinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in
                window.location.href = '../html/gamification.html';
            })
            .catch((error) => {
                showError(error.message);
            });
    });

    // Sign Up Logic
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed up, redirect to gamification page
                window.location.href = '../html/gamification.html';
            })
            .catch((error) => {
                showError(error.message);
            });
    });
});