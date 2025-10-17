// --- Global Variables ---
let currentUser; // Stores the logged-in user's data.
let allProducts = []; // Stores a local copy of the inventory for fast searching.
let billItems = []; // An array to hold all products added to the current bill.

// --- DOM Element References ---
const productSearch = document.getElementById('productSearch');
const searchResults = document.getElementById('searchResults');
const billItemsTable = document.getElementById('billItemsTable');
const billSubtotal = document.getElementById('billSubtotal');
const billDiscount = document.getElementById('billDiscount');
const billTotal = document.getElementById('billTotal');
const generateBillBtn = document.getElementById('generateBillBtn');
const modal = document.getElementById('animationModal');
const lottieContainer = document.getElementById('lottie-container');
const modalText = document.getElementById('modal-text');

// --- Main Setup ---
// Listen for auth changes to get the current user and load their products.
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loadAllProducts(user.uid);
    }
});

/**
 * Fetches all products from the user's inventory and stores them locally.
 * @param {string} userId The unique ID of the logged-in user.
 */
const loadAllProducts = async (userId) => {
    try {
        const snapshot = await db.collection('products').where('ownerId', '==', userId).get();
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error loading products:", error);
        alert("Could not load inventory. Please check your connection and try again.");
    }
};

// --- Event Listeners ---

// 1. Live Product Search
productSearch.addEventListener('keyup', () => {
    const query = productSearch.value.toLowerCase();
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    const results = allProducts.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
    
    searchResults.innerHTML = '';
    if (results.length > 0) {
        results.forEach(product => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.textContent = `${product.name} (Stock: ${product.quantity})`;
            item.onclick = () => addItemToBill(product.id);
            searchResults.appendChild(item);
        });
        searchResults.style.display = 'block';
    } else {
        searchResults.style.display = 'none';
    }
});

// 2. Event delegation for updating quantities and deleting items from the bill.
billItemsTable.addEventListener('change', (e) => {
    if (e.target.classList.contains('qty-input')) {
        const index = e.target.dataset.index;
        billItems[index].quantity = parseInt(e.target.value);
        renderBillTable();
    }
});
billItemsTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const index = e.target.dataset.index;
        billItems.splice(index, 1); // Remove the item from the array.
        renderBillTable();
    }
});

// 3. Update total when discount is changed.
billDiscount.addEventListener('input', updateBillSummary);

// 4. Generate the final bill when the main button is clicked.
generateBillBtn.addEventListener('click', async () => {
    // --- Validations ---
    if (billItems.length === 0) {
        alert("Cannot generate an empty bill. Please add products.");
        return;
    }
    const customerName = document.getElementById('customerName').value;
    if (!customerName) {
        alert("Customer name is required.");
        return;
    }

    // --- Show Loading Animation ---
    showAnimation('assets/loading.json', 'Saving Bill...');

    // --- Prepare Data for Firestore ---
    const customerPhone = document.getElementById('customerPhone').value;
    const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = parseFloat(billDiscount.value) || 0;
    const total = parseFloat(billTotal.textContent.replace('₹', ''));

    try {
        // --- Save to Firestore ---
        // 1. Save the sale document.
        await db.collection('sales').add({
            ownerId: currentUser.uid,
            customerName: customerName,
            customerPhone: customerPhone,
            items: billItems,
            subtotal,
            discount,
            totalAmount: total,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // 2. Create or update the customer document.
        await db.collection('customers').doc(customerName.toLowerCase().replace(/\s+/g, '-')).set({
            ownerId: currentUser.uid,
            name: customerName,
            phone: customerPhone,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }); // 'merge: true' updates the customer if they already exist.
        
        // --- Generate PDF ---
        generatePDF({ customerName, items: billItems, subtotal, discount, total });
        
        // --- Show Success Animation ---
        showAnimation('assets/success.json', 'Bill Generated Successfully!', true);

        // --- Reset the form after success ---
        setTimeout(() => {
            billItems = [];
            renderBillTable();
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            billDiscount.value = '0';
        }, 2500); // Wait for the animation to finish.

    } catch (error) {
        console.error("Error generating bill: ", error);
        modal.style.display = 'none'; // Hide modal on error
        alert("Failed to generate bill.");
    }
});


// --- Helper Functions ---

/** Adds a selected product to the billItems array and re-renders the table. */
const addItemToBill = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    const existingItem = billItems.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++; // If item is already in the bill, just increase its quantity.
    } else {
        billItems.push({ ...product, quantity: 1 }); // Otherwise, add it as a new item.
    }
    productSearch.value = ''; // Clear search bar.
    searchResults.style.display = 'none';
    renderBillTable();
};

/** Clears and re-renders the bill table based on the billItems array. */
const renderBillTable = () => {
    billItemsTable.innerHTML = '';
    billItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td><input type="number" value="${item.quantity}" min="1" data-index="${index}" class="qty-input"></td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${(item.price * item.quantity).toFixed(2)}</td>
            <td><button class="delete-btn" data-index="${index}">✖</button></td>
        `;
        billItemsTable.appendChild(tr);
    });
    updateBillSummary();
};

/** Recalculates and displays the subtotal and grand total. */
const updateBillSummary = () => {
    const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountPercent = parseFloat(billDiscount.value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    billSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    billTotal.textContent = `₹${total.toFixed(2)}`;
};

/**
 * Displays the animation modal with a Lottie animation.
 * @param {string} path The path to the Lottie JSON file.
 * @param {string} text The message to display below the animation.
 * @param {boolean} hideAfterDelay If true, the modal will hide automatically.
 */
function showAnimation(path, text, hideAfterDelay = false) {
    lottieContainer.innerHTML = ''; // Clear previous animation
    const player = document.createElement('lottie-player');
    player.setAttribute('src', path);
    player.setAttribute('background', 'transparent');
    player.setAttribute('speed', '1');
    player.setAttribute('autoplay', 'true');
    player.setAttribute('loop', !hideAfterDelay); // Don't loop success animation
    lottieContainer.appendChild(player);

    modalText.textContent = text;
    modal.style.display = 'flex';

    if (hideAfterDelay) {
        setTimeout(() => { modal.style.display = 'none'; }, 2500);
    }
}

/**
 * Generates a professional PDF invoice using jsPDF.
 * @param {object} billData The data for the bill.
 */
function generatePDF(billData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Ganapati Electronics & Emitra", 105, 20, null, null, "center");
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Customer: ${billData.customerName}`, 20, 35);

    // Table Header
    doc.setFontSize(12);
    let y = 50;
    doc.text("Product", 20, y);
    doc.text("Qty", 120, y);
    doc.text("Price", 150, y);
    doc.text("Total", 180, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 10;
    
    // Table Rows
    doc.setFontSize(10);
    billData.items.forEach(item => {
        doc.text(item.name, 20, y);
        doc.text(item.quantity.toString(), 120, y);
        doc.text(`₹${item.price.toFixed(2)}`, 150, y);
        doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 180, y);
        y += 7;
    });
    
    // Footer and Totals
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Subtotal: ₹${billData.subtotal.toFixed(2)}`, 150, y);
    doc.text(`Discount: ${billData.discount}%`, 150, y + 7);
    doc.setFontSize(14);
    doc.text(`Grand Total: ₹${billData.total.toFixed(2)}`, 140, y + 15);

    doc.save(`Bill-${billData.customerName}-${Date.now()}.pdf`);
}
