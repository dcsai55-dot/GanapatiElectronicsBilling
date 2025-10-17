// This variable will hold the currently logged-in user's information.
let currentUser;
// This will hold the real-time listener so we can stop it when the user logs out.
let unsubscribeCustomers;

// Get the HTML element we need to work with.
const customerList = document.getElementById('customerList');

// Listen for changes in the user's login state.
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        // If the user is logged in, start fetching their customers.
        getCustomers(user.uid);
    } else {
        // If the user logs out, stop listening for database changes.
        if (unsubscribeCustomers) {
            unsubscribeCustomers();
        }
    }
});

/**
 * Fetches all customers for the current user in real-time and displays them.
 * @param {string} userId The unique ID of the logged-in user.
 */
const getCustomers = (userId) => {
    // Set up a real-time listener on the 'customers' collection.
    unsubscribeCustomers = db.collection('customers')
        .where("ownerId", "==", userId) // Only get customers owned by the current user.
        .orderBy("lastSeen", "desc") // Show the most recent customers first.
        .onSnapshot(snapshot => {
            // Clear the existing list in the table.
            customerList.innerHTML = '';
            if (snapshot.empty) {
                // If there are no customers, show a message.
                customerList.innerHTML = '<tr><td colspan="3" style="text-align: center;">No customers found. They will appear here after you create a bill.</td></tr>';
                return;
            }
            // For each customer document found, render it in the table.
            snapshot.docs.forEach(doc => renderCustomer(doc));
        });
};

/**
 * Renders a single customer document as a row in the HTML table.
 * @param {object} doc The Firestore document for a single customer.
 */
const renderCustomer = (doc) => {
    const customer = doc.data();
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', doc.id); // Store the document ID on the table row.

    // Format the 'lastSeen' timestamp into a readable date.
    // The .toDate() method converts a Firebase timestamp into a standard JavaScript Date object.
    const lastSeenDate = customer.lastSeen ? customer.lastSeen.toDate().toLocaleDateString() : 'N/A';

    // Create the HTML for the table row.
    tr.innerHTML = `
        <td>${customer.name}</td>
        <td>${customer.phone || 'N/A'}</td>
        <td>${lastSeenDate}</td>
    `;
    customerList.appendChild(tr);
};
