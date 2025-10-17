// This variable will hold the currently logged-in user's information.
let currentUser;
// This will hold the real-time listener so we can stop it when the user logs out.
let unsubscribeSales;

// Get the HTML element we need to work with.
const salesList = document.getElementById('salesList');

// Listen for changes in the user's login state.
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        // If the user is logged in, start fetching their sales records.
        getSales(user.uid);
    } else {
        // If the user logs out, stop listening for database changes.
        if (unsubscribeSales) {
            unsubscribeSales();
        }
    }
});

/**
 * Fetches all sales records for the current user in real-time and displays them.
 * @param {string} userId The unique ID of the logged-in user.
 */
const getSales = (userId) => {
    // Set up a real-time listener on the 'sales' collection.
    unsubscribeSales = db.collection('sales')
        .where("ownerId", "==", userId) // Only get sales owned by the current user.
        .orderBy("createdAt", "desc") // Show the most recent sales first.
        .onSnapshot(snapshot => {
            // Clear the existing list in the table.
            salesList.innerHTML = '';
            if (snapshot.empty) {
                // If there are no sales records, show a message.
                salesList.innerHTML = '<tr><td colspan="4" style="text-align: center;">No sales records found. Create a bill to see it here.</td></tr>';
                return;
            }
            // For each sales document found, render it in the table.
            snapshot.docs.forEach(doc => renderSale(doc));
        });
};

/**
 * Renders a single sales document as a row in the HTML table.
 * @param {object} doc The Firestore document for a single sale.
 */
const renderSale = (doc) => {
    const sale = doc.data();
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', doc.id); // Store the document ID on the table row.

    // Format the 'createdAt' timestamp into a readable date and time.
    const saleDate = sale.createdAt ? sale.createdAt.toDate().toLocaleString() : 'N/A';

    // Create a summary of the items sold.
    const itemsSummary = sale.items.map(item => `${item.name} (x${item.quantity})`).join(', ');

    // Create the HTML for the table row.
    tr.innerHTML = `
        <td>${saleDate}</td>
        <td>${sale.customerName}</td>
        <td>${itemsSummary}</td>
        <td>₹${sale.totalAmount.toFixed(2)}</td>
    `;
    salesList.appendChild(tr);
};
