// This variable will hold the currently logged-in user's information.
let currentUser;

// The auth.onAuthStateChanged function (from main.js) is constantly running.
// When it confirms a user is logged in, we store their details and start fetching data.
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        // Call the main function to load all statistics for this specific user.
        loadDashboardStats(user.uid);
    }
});

/**
 * Fetches and displays real-time statistics for the logged-in user.
 * @param {string} userId The unique ID of the currently logged-in user.
 */
const loadDashboardStats = (userId) => {
    // --- Get references to the specific Firestore collections for this user ---
    
    // Reference to the 'sales' collection, filtered to only show documents owned by the current user.
    const salesRef = db.collection('sales').where('ownerId', '==', userId);
    
    // Reference to the 'products' collection.
    const productsRef = db.collection('products').where('ownerId', '==', userId);
    
    // Reference to the 'customers' collection.
    const customersRef = db.collection('customers').where('ownerId', '==', userId);

    // --- Set up real-time listeners ---
    // The .onSnapshot() method creates a live connection to the database.
    // Any change (add, edit, delete) in the collection will cause this code to run again.

    // 1. Sales and Bills Listener
    salesRef.onSnapshot(snapshot => {
        // Calculate the total sales amount by adding up the 'total' field from each sales document.
        const totalSales = snapshot.docs.reduce((sum, doc) => sum + doc.data().totalAmount, 0);
        
        // Update the HTML elements with the new data.
        document.getElementById('total-sales').textContent = `₹${totalSales.toFixed(2)}`;
        document.getElementById('total-bills').textContent = snapshot.size; // .size gives the total number of documents.
    });

    // 2. Products Listener
    productsRef.onSnapshot(snapshot => {
        // Update the HTML element with the total number of products.
        document.getElementById('total-products').textContent = snapshot.size;
    });

    // 3. Customers Listener
    customersRef.onSnapshot(snapshot => {
        // Update the HTML element with the total number of customers.
        document.getElementById('total-customers').textContent = snapshot.size;
    });
};
