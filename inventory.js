// This variable will hold the currently logged-in user's information.
let currentUser;
// This will hold the real-time listener so we can stop it when the user logs out.
let unsubscribeInventory;

// Get the HTML elements we need to work with.
const addProductForm = document.getElementById('addProductForm');
const inventoryList = document.getElementById('inventoryList');

// Listen for changes in the user's login state.
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        // If the user is logged in, start fetching their products.
        getProducts(user.uid);
    } else {
        // If the user logs out, stop listening for database changes to save resources.
        if (unsubscribeInventory) {
            unsubscribeInventory();
        }
    }
});

// --- Function to Add a New Product ---
addProductForm.addEventListener('submit', async (e) => {
    // Prevent the default form submission (which reloads the page).
    e.preventDefault();
    if (!currentUser) {
        alert("You must be logged in to add products.");
        return;
    }

    // Get the values from the form fields.
    const productName = addProductForm.productName.value;
    const productSKU = addProductForm.productSKU.value;
    const productQuantity = parseInt(addProductForm.productQuantity.value);
    const productPrice = parseFloat(addProductForm.productPrice.value);

    try {
        // Add a new document to the 'products' collection in Firestore.
        await db.collection('products').add({
            name: productName,
            sku: productSKU,
            quantity: productQuantity,
            price: productPrice,
            ownerId: currentUser.uid, // This is the "key" that links the product to the user.
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Adds the current time.
        });
        // Clear the form fields for the next entry.
        addProductForm.reset();
    } catch (error) {
        console.error("Error adding product: ", error);
        alert("Failed to add product. Please check the console for details.");
    }
});

/**
 * Fetches all products for the current user in real-time and displays them.
 * @param {string} userId The unique ID of the logged-in user.
 */
const getProducts = (userId) => {
    // Set up a real-time listener on the 'products' collection.
    unsubscribeInventory = db.collection('products')
        .where("ownerId", "==", userId) // Only get products where ownerId matches the user's ID.
        .orderBy("createdAt", "desc") // Show the newest products first.
        .onSnapshot(snapshot => {
            // Clear the existing list in the table.
            inventoryList.innerHTML = '';
            if (snapshot.empty) {
                // If there are no products, show a message.
                inventoryList.innerHTML = '<tr><td colspan="5" style="text-align: center;">No products found. Add one!</td></tr>';
                return;
            }
            // For each product document found, render it in the table.
            snapshot.docs.forEach(doc => renderProduct(doc));
        });
};

/**
 * Renders a single product document as a row in the HTML table.
 * @param {object} doc The Firestore document for a single product.
 */
const renderProduct = (doc) => {
    const product = doc.data();
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', doc.id); // Store the document ID on the table row for easy access.

    // Create the HTML for the table row.
    tr.innerHTML = `
        <td>${product.name}</td>
        <td>${product.sku}</td>
        <td>${product.quantity}</td>
        <td>₹${product.price.toFixed(2)}</td>
        <td><button class="delete-btn">Delete</button></td>
    `;
    inventoryList.appendChild(tr);

    // --- Add Delete Functionality ---
    const deleteButton = tr.querySelector('.delete-btn');
    deleteButton.addEventListener('click', async () => {
        // Ask for confirmation before deleting.
        if (confirm(`Are you sure you want to delete ${product.name}?`)) {
            try {
                // Tell Firestore to delete the document with this specific ID.
                await db.collection('products').doc(doc.id).delete();
            } catch (error) {
                console.error("Error deleting product: ", error);
                alert("Failed to delete product.");
            }
        }
    });
};
