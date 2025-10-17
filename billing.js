let currentUser;
let allProducts = [];
let billItems = [];

// DOM Elements
const productSearch = document.getElementById('productSearch');
const searchResults = document.getElementById('searchResults');
const billItemsTable = document.getElementById('billItemsTable');
const billSubtotal = document.getElementById('billSubtotal');
const billDiscount = document.getElementById('billDiscount');
const billTotal = document.getElementById('billTotal');
const generateBillBtn = document.getElementById('generateBillBtn');

// Auth listener
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loadAllProducts(user.uid);
    }
});

// Load all products into memory for fast searching
const loadAllProducts = async (userId) => {
    const snapshot = await db.collection('products').where('ownerId', '==', userId).get();
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Product search functionality
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

// Add a selected product to the bill
const addItemToBill = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    const existingItem = billItems.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        billItems.push({ ...product, quantity: 1 });
    }
    productSearch.value = '';
    searchResults.style.display = 'none';
    renderBillTable();
};

// Render the main bill table
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

// Update bill totals
const updateBillSummary = () => {
    const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountPercent = parseFloat(billDiscount.value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    billSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    billTotal.textContent = `₹${total.toFixed(2)}`;
};

// Event delegation for table updates
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
        billItems.splice(index, 1);
        renderBillTable();
    }
});
billDiscount.addEventListener('input', updateBillSummary);

// Generate Bill Button
generateBillBtn.addEventListener('click', async () => {
    if (billItems.length === 0) {
        alert("Cannot generate an empty bill.");
        return;
    }

    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = parseFloat(billDiscount.value) || 0;
    const total = parseFloat(billTotal.textContent.replace('₹', ''));

    try {
        // Save the sale to Firestore
        await db.collection('sales').add({
            ownerId: currentUser.uid,
            customerName: customerName || "N/A",
            customerPhone: customerPhone || "N/A",
            items: billItems,
            subtotal,
            discount,
            total,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Generate the PDF
        generatePDF({ customerName, items: billItems, subtotal, discount, total });

        // Reset the bill
        billItems = [];
        renderBillTable();
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('billDiscount').value = '0';
        alert("Bill generated and saved successfully!");

    } catch (error) {
        console.error("Error generating bill: ", error);
        alert("Failed to generate bill.");
    }
});

// PDF Generation Function
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

    doc.save(`Bill-${Date.now()}.pdf`);
}
