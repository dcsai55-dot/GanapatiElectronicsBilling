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
const db = firebase.firestore();

// --- Sidebar HTML Template ---
const sidebarHTML = `
    <div class="sidebar-header">
        <img src="assets/logo.png" alt="Logo" class="sidebar-logo">
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

// --- Core Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/');
        
        if (user && isLoginPage) {
            // If logged in on login page, redirect to dashboard
            window.location.replace('index.html');
        } else if (!user && !isLoginPage) {
            // If not logged in and not on login page, redirect to login
            window.location.replace('login.html');
        } else if (user) {
            // If logged in, inject and configure the sidebar
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                sidebarContainer.innerHTML = sidebarHTML;
                
                // Highlight the active navigation link
                const currentPage = window.location.pathname.split('/').pop().split('.')[0];
                const activeLink = document.getElementById(`nav-${currentPage}`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }

                // Attach logout functionality
                document.getElementById('logoutBtn').addEventListener('click', () => {
                    auth.signOut();
                });
            }
        }
    });
});
