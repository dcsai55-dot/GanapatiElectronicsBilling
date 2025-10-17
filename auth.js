// --- Firebase Configuration ---
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
const loginForm = document.getElementById('loginForm');
const authError = document.getElementById('auth-error');

// --- Event Listeners ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    authError.style.display = 'none'; // Hide previous errors

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            authError.textContent = "Error: Invalid email or password.";
            authError.style.display = 'block';
        });
});
