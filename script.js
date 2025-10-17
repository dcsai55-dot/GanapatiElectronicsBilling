// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBO5aaFoO7tVNlab69iLUG5MLLmz6-FyuM",
    authDomain: "ganapatielectronicsbilling.firebaseapp.com",
    projectId: "ganapatielectronicsbilling",
    storageBucket: "ganapatielectronicsbilling.appspot.com",
    messagingSenderId: "323798769629",
    appId: "1:323798769629:web:067095b772db0a3deee034",
    measurementId: "G-S54LJE3FH1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const productsCollection = db.collection("products");

// --- DOM Elements ---
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('loginForm');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logoutBtn');
const addProductForm = document.getElementById('addProductForm');
const inventoryList = document.getElementById('inventoryList');
const loader = document.getElementById('loader');

let currentUser; // To store current user info
let unsubscribe; // To stop the Firestore listener when logged out

// --- Core Authentication Logic ---
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        currentUser = user;
        loginView.style.display = 'none';
        appView.style.display = 'block';
        getProducts(currentUser.uid); // Fetch products for the logged-in user
    } else {
        // User is signed out
        currentUser = null;
        if (unsubscribe) {
            unsubscribe(); // Stop listening for database changes
        }
        inventoryList.innerHTML = ''; // Clear the inventory list
        loginView.style.display = 'block';
        appView.style.display = 'none';
    }
});

// --- Authentication Event Listeners ---
// Email/Password Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    auth.signInWithEmailAndPassword(email, password).catch(error => {
        authError.textContent = error.message;
        authError.style.display = 'block';
    });
});

// Google Sign-In
googleSignInBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        authError.textContent = error.message;
        authError.style.display = 'block';
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// --- Inventory Management Logic ---
// Renders a single product row in the inventory table
const renderProduct = (doc) => {
    const product = doc.data();
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', doc.id);

    tr.innerHTML = `
        <td>${product.name}</td>
        <td>${product.sku}</td>
        <td>${product.quantity}</td>
        <td>₹${product.price.toFixed(2)}</td>
        <td><button class="delete-btn">Delete</button></td>
    `;

    inventoryList.appendChild(tr);

    // Add event listener for the delete button
    const deleteButton = tr.querySelector('.delete-btn');
    deleteButton.addEventListener('click', async (e) => {
        const id = e.target.parentElement.parentElement.getAttribute('data-id');
        await productsCollection.doc(id).delete();
    });
};

// Fetches products ONLY for the logged-in user from Firestore
const getProducts = (userId) => {
    loader.style.display = 'block';
    inventoryList.innerHTML = '';

    // Listen for real-time updates and filter by ownerId
    unsubscribe = productsCollection.where("ownerId", "==", userId).orderBy("createdAt", "desc").onSnapshot(snapshot => {
        loader.style.display = 'none';
        inventoryList.innerHTML = '';
        if (snapshot.empty) {
            inventoryList.innerHTML = `<tr><td colspan="5" style="text-align:center;">No products found. Add your first product!</td></tr>`;
            return;
        }
        snapshot.docs.forEach(doc => {
            renderProduct(doc);
        });
    }, err => {
        console.log(`Encountered error: ${err}`);
        loader.style.display = 'none';
        alert("Could not fetch products. Check Firestore rules and internet connection.");
    });
};

// Add Product Form Submission
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert("You must be logged in to add a product.");
        return;
    }

    const productName = addProductForm.productName.value;
    const productSKU = addProductForm.productSKU.value;
    const productQuantity = parseInt(addProductForm.productQuantity.value);
    const productPrice = parseFloat(addProductForm.productPrice.value);

    try {
        await productsCollection.add({
            name: productName,
            sku: productSKU,
            quantity: productQuantity,
            price: productPrice,
            ownerId: currentUser.uid, // *** IMPORTANT: Link product to the user ***
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        addProductForm.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to add product.");
    }
});
