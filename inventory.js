let currentUser;
let unsubscribeInventory;

// DOM Elements
const addProductForm = document.getElementById('addProductForm');
const inventoryList = document.getElementById('inventoryList');

// Listen for auth changes to get the current user
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        getProducts(user.uid);
    } else {
        // Stop listening to database changes if user logs out
        if (unsubscribeInventory) unsubscribeInventory();
    }
});

// Add a new product to Firestore
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert("You must be logged in to add products.");
        return;
    }

    const productName = addProductForm.productName.value;
    const productSKU = addProductForm.productSKU.value;
    const productQuantity = parseInt(addProductForm.productQuantity.value);
    const productPrice = parseFloat(addProductForm.productPrice.value);

    try {
        await db.collection('products').add({
            name: productName,
            sku: productSKU,
            quantity: productQuantity,
            price: productPrice,
            ownerId: currentUser.uid, // This is crucial for security rules
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        addProductForm.reset();
    } catch (error) {
        console.error("Error adding product: ", error);
        alert("Failed to add product.");
    }
});

// Get all products from Firestore and display them
const getProducts = (userId) => {
    unsubscribeInventory = db.collection('products')
        .where("ownerId", "==", userId)
        .orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
            inventoryList.innerHTML = ''; // Clear the list
            if (snapshot.empty) {
                inventoryList.innerHTML = '<tr><td colspan="5">No products found. Add one above!</td></tr>';
                return;
            }
            snapshot.docs.forEach(doc => renderProduct(doc));
        });
};

// Render a single product row in the table
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

    // Add delete functionality
    tr.querySelector('.delete-btn').addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete ${product.name}?`)) {
            await db.collection('products').doc(doc.id).delete();
        }
    });
};
