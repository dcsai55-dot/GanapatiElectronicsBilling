// --- PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE ---
const firebaseConfig = {
    apiKey: "AIzaSyBO5aaFoO7tVNlab69iLUG5MLLmz6-FyuM",
    authDomain: "ganapatielectronicsbilling.firebaseapp.com",
    projectId: "ganapatielectronicsbilling",
    storageBucket: "ganapatielectronicsbilling.appspot.com",
    messagingSenderId: "323798769629",
    appId: "1:323798769629:web:067095b772db0a3deee034",
    measurementId: "G-S54LJE3FH1"
};
// ----------------------------------------------------

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

const loginForm = document.getElementById('loginForm');
const authError = document.getElementById('auth-error');

// Redirect if already logged in
auth.onAuthStateChanged(user => {
    if (user) {
        window.location.href = 'index.html';
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            window.location.href = 'index.html';
        })
        .catch((error) => {
            authError.textContent = error.message;
        });
});
