// --- Firebase Configuration ---
// This is the most important part. Paste your Firebase SDK config object here.
// This single object will be used by all other script files.
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
// We check if Firebase has already been initialized to avoid errors.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- Sidebar HTML Template ---
// This is the navigation menu that will be injected into every page.
const sidebarHTML = `
    <div class="sidebar-header">
        <img src="assets/logo.png" alt="Logo" class="sidebar-logo" style="display: none;">
        <h2>Ganapati Elec.</h2>
    </div>
    <nav>
        <ul>
            <li><a href="index.html" id="nav-index">📊 Dashboard</a></li>
            <li><a href="billing.html" id="nav-billing">🧾 Billing</a></li>
            <li><a href="inventory.html" id="nav-inventory">📦 Inventory</a></li>
            <li><a href="customers.html" id="nav-customers">👥 Customers</a></li>
            <li><a href="reports.html" id="nav-reports">📈 Reports</a></li>
        </ul>
    </nav>
    <button class="btn-primary logout-btn" id="logoutBtn">Logout</button>
`;

// --- Core Application Logic (The "Security Guard") ---
document.addEventListener('DOMContentLoaded', () => {
    // This function runs automatically whenever the user's login state changes.
    auth.onAuthStateChanged(user => {
        const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/');
        
        if (user && isLoginPage) {
            // CASE 1: The user IS logged in, but they are on the login page.
            // ACTION: Send them to the main dashboard.
            window.location.replace('index.html');
        } else if (!user && !isLoginPage) {
            // CASE 2: The user IS NOT logged in, and they are trying to access an internal page.
            // ACTION: Send them back to the login page.
            window.location.replace('login.html');
        } else if (user) {
            // CASE 3: The user IS logged in and on an internal page.
            // ACTION: Load the sidebar navigation and make it functional.
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                sidebarContainer.innerHTML = sidebarHTML;
                
                // This code highlights the link of the page you are currently on.
                const currentPage = window.location.pathname.split('/').pop().split('.')[0] || 'index';
                const activeLink = document.getElementById(`nav-${currentPage}`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }

                // Attach the sign-out functionality to the logout button.
                document.getElementById('logoutBtn').addEventListener('click', () => {
                    auth.signOut();
                });
            }
        }
    });
});
