const db = firebase.firestore();
let currentUser;
let allProducts = []; // To store inventory items for searching
let billItems = []; // To store items in the current bill

const productSearchInput = document.getElementById('productSearch');
const searchResults = document.getElementById('searchResults');
const billItemsTableBody = document.querySelector('#billItemsTable tbody');
const billTotalSpan = document.getElementById('billTotal');
const generateBillBtn = document.getElementById('generateBillBtn');

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loadAllProducts(user.uid);
    }
});

// 1. Load all products from inventory into memory for fast searching
const loadAllProducts = (userId) => {
    db.collection("products").where("ownerId", "==", userId).get().then(snapshot => {
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
};

// 2. Search logic
productSearchInput.addEventListener('keyup', (e) => {
    // Logic to search `allProducts` and show results in `searchResults` div
});

// 3. Add item to bill
function addItemToBill(productId) {
    // Find product in `allProducts` array
    // Add it to the `billItems` array
    // Re-render the bill table
}

// 4. Render the bill table
function renderBill() {
    // Clear table body
    // Loop through `billItems` and add rows to the table
    // Update the total
}

// 5. Generate and Save Bill
generateBillBtn.addEventListener('click', async () => {
    if (billItems.length === 0) {
        alert("Cannot generate an empty bill.");
        return;
    }
    // Create a new document in a 'sales' collection
    // Include customer info, items, total, date, and ownerId
    // Clear the current bill
    alert("Bill saved successfully!");
});
