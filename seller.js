// Shared Data (simulating a backend with localStorage)
function getListings() {
    const stored = localStorage.getItem('energyListings');
    if (stored) {
        return JSON.parse(stored);
    }
    // Default mock data
    const defaultListings = [
        { id: 1, type: "Solar", energy: 30, price: 5, location: "Delhi", seller: "Green Solar", status: "active", date: new Date().toISOString() },
        { id: 2, type: "Wind", energy: 50, price: 4, location: "Gujarat", seller: "Wind Energy Ltd", status: "active", date: new Date().toISOString() },
        { id: 3, type: "Biogas", energy: 20, price: 6, location: "Punjab", seller: "BioPower Farms", status: "active", date: new Date().toISOString() },
        { id: 4, type: "Solar", energy: 100, price: 4.5, location: "Mumbai", seller: "SunPower Solutions", status: "active", date: new Date().toISOString() },
        { id: 5, type: "Wind", energy: 75, price: 3.8, location: "Tamil Nadu", seller: "Coastal Wind Farms", status: "active", date: new Date().toISOString() }
    ];
    localStorage.setItem('energyListings', JSON.stringify(defaultListings));
    return defaultListings;
}

function saveListings(listings) {
    localStorage.setItem('energyListings', JSON.stringify(listings));
}

function getSalesHistory() {
    const stored = localStorage.getItem('purchaseHistory');
    return stored ? JSON.parse(stored) : [];
}

// State
let listings = getListings();
let editingId = null;

// DOM Elements
const listingForm = document.getElementById('seller-listing-form');
const editForm = document.getElementById('edit-listing-form');
const sellerListingsTbody = document.getElementById('seller-listings-tbody');
const noListingsMsg = document.getElementById('no-listings-msg');
const modal = document.getElementById('confirmation-modal');
const editModal = document.getElementById('edit-modal');
const confirmationMessage = document.getElementById('confirmation-message');

// Dashboard Elements
const totalListingsEl = document.getElementById('total-listings');
const energyListedEl = document.getElementById('energy-listed');
const energySoldEl = document.getElementById('energy-sold');
const totalEarningsEl = document.getElementById('total-earnings');
const avgPriceEl = document.getElementById('avg-price');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    renderSellerListings();
    renderSalesHistory();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    listingForm.addEventListener('submit', handleAddListing);
    editForm.addEventListener('submit', handleEditListing);
}

// Update Dashboard
function updateDashboard() {
    listings = getListings();
    const activeListings = listings.filter(l => l.status === 'active');
    const soldListings = listings.filter(l => l.status === 'sold');
    const salesHistory = getSalesHistory();

    // Total active listings
    totalListingsEl.textContent = activeListings.length;

    // Energy listed (active)
    const totalEnergyListed = activeListings.reduce((sum, l) => sum + l.energy, 0);
    energyListedEl.textContent = `${totalEnergyListed} kWh`;

    // Energy sold
    const totalEnergySold = salesHistory.reduce((sum, s) => sum + s.energy, 0);
    energySoldEl.textContent = `${totalEnergySold} kWh`;

    // Total earnings
    const totalEarnings = salesHistory.reduce((sum, s) => sum + parseFloat(s.totalPrice), 0);
    totalEarningsEl.textContent = `$${totalEarnings.toFixed(2)}`;

    // Average price per kWh
    const allPrices = listings.map(l => l.price);
    const avgPrice = allPrices.length > 0 
        ? allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length 
        : 0;
    avgPriceEl.textContent = `$${avgPrice.toFixed(2)}`;
}

// Handle Add Listing
function handleAddListing(e) {
    e.preventDefault();

    const type = document.getElementById('energy-type').value;
    const energy = parseInt(document.getElementById('energy-amount').value);
    const price = parseFloat(document.getElementById('price-per-kwh').value);
    const location = document.getElementById('location').value;
    const seller = document.getElementById('seller-name').value;
    const email = document.getElementById('seller-email').value;
    const description = document.getElementById('listing-description').value;

    const newListing = {
        id: Date.now(),
        type,
        energy,
        price,
        location,
        seller,
        email,
        description,
        status: 'active',
        date: new Date().toISOString()
    };

    listings.push(newListing);
    saveListings(listings);

    // Reset form
    listingForm.reset();

    // Update UI
    updateDashboard();
    renderSellerListings();

    // Show confirmation
    showModal(`Your ${type} energy listing has been added successfully!`);
}

// Render Seller Listings Table
function renderSellerListings() {
    listings = getListings();
    const activeListings = listings.filter(l => l.status === 'active');

    if (activeListings.length === 0) {
        sellerListingsTbody.innerHTML = '';
        noListingsMsg.style.display = 'block';
        return;
    }

    noListingsMsg.style.display = 'none';
    sellerListingsTbody.innerHTML = '';

    activeListings.forEach(listing => {
        const row = document.createElement('tr');
        const totalValue = (listing.energy * listing.price).toFixed(2);
        const listedDate = new Date(listing.date).toLocaleDateString();
        
        row.innerHTML = `
            <td>#${listing.id.toString().slice(-4)}</td>
            <td>
                <span class="energy-type-badge ${listing.type.toLowerCase()}">${listing.type}</span>
            </td>
            <td>${listing.energy} kWh</td>
            <td>$${listing.price.toFixed(2)}</td>
            <td>$${totalValue}</td>
            <td>${listing.location}</td>
            <td><span class="status-badge ${listing.status}">${listing.status}</span></td>
            <td>${listedDate}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-edit" onclick="editListing(${listing.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteListing(${listing.id})">Delete</button>
                </div>
            </td>
        `;
        sellerListingsTbody.appendChild(row);
    });
}

// Edit Listing
function editListing(listingId) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    editingId = listingId;
    
    document.getElementById('edit-listing-id').value = listingId;
    document.getElementById('edit-energy-type').value = listing.type;
    document.getElementById('edit-energy-amount').value = listing.energy;
    document.getElementById('edit-price-per-kwh').value = listing.price;
    document.getElementById('edit-location').value = listing.location;
    
    editModal.classList.remove('hidden');
}

// Handle Edit Listing
function handleEditListing(e) {
    e.preventDefault();
    
    if (!editingId) return;
    
    const listing = listings.find(l => l.id === editingId);
    if (!listing) return;

    listing.type = document.getElementById('edit-energy-type').value;
    listing.energy = parseInt(document.getElementById('edit-energy-amount').value);
    listing.price = parseFloat(document.getElementById('edit-price-per-kwh').value);
    listing.location = document.getElementById('edit-location').value;

    saveListings(listings);
    
    closeEditModal();
    updateDashboard();
    renderSellerListings();
    showModal('Listing updated successfully!');
}

// Close Edit Modal
function closeEditModal() {
    editModal.classList.add('hidden');
    editingId = null;
    editForm.reset();
}

// Delete Listing
function deleteListing(listingId) {
    if (confirm('Are you sure you want to delete this listing?')) {
        listings = listings.filter(l => l.id !== listingId);
        saveListings(listings);
        updateDashboard();
        renderSellerListings();
        showModal('Listing deleted successfully!');
    }
}

// Render Sales History
function renderSalesHistory() {
    const salesHistory = getSalesHistory();
    const container = document.getElementById('sales-history-content');

    if (salesHistory.length === 0) {
        container.innerHTML = '<p class="empty-state">No sales yet. Your completed sales will appear here.</p>';
        return;
    }

    const salesList = document.createElement('div');
    salesList.className = 'sales-list';

    salesHistory.forEach(sale => {
        const item = document.createElement('div');
        item.className = 'sales-item';
        item.innerHTML = `
            <div class="sales-info">
                <h4>${sale.type} Energy Sale</h4>
                <p>${sale.energy} kWh sold to buyer • ${sale.date}</p>
            </div>
            <div class="sales-amount">
                <div class="earnings">+$${sale.totalPrice}</div>
                <div class="status completed">Completed</div>
            </div>
        `;
        salesList.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(salesList);
}

// Export Listings
function exportListings() {
    const activeListings = listings.filter(l => l.status === 'active');
    
    if (activeListings.length === 0) {
        alert('No active listings to export.');
        return;
    }

    let csv = 'ID,Type,Energy (kWh),Price ($/kWh),Total Value,Location,Status,Date\n';
    
    activeListings.forEach(l => {
        const totalValue = (l.energy * l.price).toFixed(2);
        const date = new Date(l.date).toLocaleDateString();
        csv += `${l.id},${l.type},${l.energy},${l.price},${totalValue},${l.location},${l.status},${date}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'energy-listings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Show Modal
function showModal(message) {
    confirmationMessage.textContent = message;
    modal.classList.remove('hidden');
}

// Close Modal
function closeModal() {
    modal.classList.add('hidden');
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeEditModal();
    }
});
