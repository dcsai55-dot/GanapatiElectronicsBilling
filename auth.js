// --- Firebase Configuration ---
// This script also needs the configuration to connect to Firebase.
const firebaseConfig = {
    apiKey: "AIzaSyBO5aaFoO7tVNlab69iLUG5MLLmz6-FyuM",
    authDomain: "ganapatielectronicsbilling.firebaseapp.com",
    projectId: "ganapatielectronicsbilling",
    storageBucket: "ganapatielectronicsbilling.appspot.com",
    messagingSenderId: "323798769629",
    appId: "1:323798769629:web:067095b772db0a3deee034",
    measurementId: "G-S54LJE3FH1"
};

// --- Firebase Initialization ---
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// --- DOM Elements ---
// Get the HTML elements we need to interact with.
const loginForm = document.getElementById('loginForm');
const authError = document.getElementById('auth-error');

// --- Event Listeners ---
// This code waits for the user to submit the form (by clicking the button or pressing Enter).
loginForm.addEventListener('submit', (e) => {
    // Prevent the page from reloading, which is the default form behavior.
    e.preventDefault();
    
    // Get the email and password values from the input fields.
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    // Hide any previous error messages.
    authError.style.display = 'none';

    // Send the email and password to Firebase to attempt to sign in.
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // If Firebase confirms the login is successful, this code runs.
            // It redirects the user to the main dashboard page.
            window.location.href = 'index.html';
        })
        .catch((error) => {
            // If Firebase says the login failed, this code runs.
            // It displays an error message to the user.
            authError.textContent = "Error: Invalid email or password.";
            authError.style.display = 'block';
        });
});
