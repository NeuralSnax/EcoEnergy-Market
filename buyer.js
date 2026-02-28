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

function getPurchaseHistory() {
    const stored = localStorage.getItem('purchaseHistory');
    return stored ? JSON.parse(stored) : [];
}

function savePurchaseHistory(history) {
    localStorage.setItem('purchaseHistory', JSON.stringify(history));
}

// State
let listings = getListings();
let purchaseHistory = getPurchaseHistory();
let currentFilter = 'all';
let selectedListingId = null;
let selectedPowerAmount = 0;
let maxPowerAvailable = 0;
let currentPricePerKwh = 0;

// DOM Elements
const listingsContainer = document.getElementById('buyer-listings-container');
const purchaseHistoryContainer = document.getElementById('buyer-purchase-history-container');
const modal = document.getElementById('confirmation-modal');
const energyModal = document.getElementById('energy-modal');
const confirmationMessage = document.getElementById('confirmation-message');

// Stats Elements
const availableListingsEl = document.getElementById('available-listings');
const totalPurchasesEl = document.getElementById('total-purchases');
const totalSpentEl = document.getElementById('total-spent');

// Initialize
 document.addEventListener('DOMContentLoaded', () => {
    renderListings();
    renderPurchaseHistory();
    updateStats();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderListings();
        });
    });
}

// Get Energy Icon
function getEnergyIcon(type) {
    switch(type.toLowerCase()) {
        case 'solar': return '☀️';
        case 'wind': return '💨';
        case 'biogas': return '🌱';
        default: return '⚡';
    }
}

// Update Stats
function updateStats() {
    const activeListings = listings.filter(l => l.status === 'active');
    availableListingsEl.textContent = activeListings.length;
    totalPurchasesEl.textContent = purchaseHistory.length;
    
    const totalSpent = purchaseHistory.reduce((sum, p) => sum + parseFloat(p.totalPrice), 0);
    totalSpentEl.textContent = `$${totalSpent.toFixed(2)}`;
}

// Render Listings
function renderListings() {
    listings = getListings(); // Refresh from storage
    listingsContainer.innerHTML = '';

    const filteredListings = currentFilter === 'all' 
        ? listings.filter(l => l.status === 'active')
        : listings.filter(l => l.type === currentFilter && l.status === 'active');

    if (filteredListings.length === 0) {
        listingsContainer.innerHTML = `
            <div class="empty-state-container">
                <p class="empty-state">No energy listings available for this filter.</p>
                <p class="empty-state-sub">Check back later or try a different filter.</p>
            </div>
        `;
        return;
    }

    filteredListings.forEach(listing => {
        const card = createListingCard(listing);
        listingsContainer.appendChild(card);
    });
}

// Create Listing Card
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    const totalPrice = (listing.energy * listing.price).toFixed(2);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="energy-type-badge ${listing.type.toLowerCase()}">${listing.type}</span>
            <span class="energy-icon">${getEnergyIcon(listing.type)}</span>
        </div>
        <div class="card-body">
            <div class="card-detail">
                <span class="card-detail-label">Energy Available</span>
                <span class="card-detail-value">${listing.energy} kWh</span>
            </div>
            <div class="card-detail">
                <span class="card-detail-label">Price per kWh</span>
                <span class="card-detail-value price-highlight">$${listing.price.toFixed(2)}</span>
            </div>
            <div class="card-detail">
                <span class="card-detail-label">Total Price</span>
                <span class="card-detail-value">$${totalPrice}</span>
            </div>
            <div class="card-detail">
                <span class="card-detail-label">Location</span>
                <span class="card-detail-value">${listing.location}</span>
            </div>
            <div class="card-detail">
                <span class="card-detail-label">Seller</span>
                <span class="card-detail-value">${listing.seller}</span>
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-secondary btn-sm" onclick="viewDetails(${listing.id})">View Details</button>
            <button class="btn btn-primary" onclick="buyEnergy(${listing.id})">Buy Now</button>
        </div>
    `;
    
    return card;
}

// View Details
function viewDetails(listingId) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    selectedListingId = listingId;
    maxPowerAvailable = listing.energy;
    currentPricePerKwh = listing.price;
    selectedPowerAmount = listing.energy; // Default to full amount
    
    document.getElementById('modal-energy-icon').textContent = getEnergyIcon(listing.type);
    document.getElementById('modal-energy-type').textContent = `${listing.type} Energy`;
    document.getElementById('modal-seller-name').textContent = listing.seller;
    document.getElementById('modal-energy-amount').textContent = `${listing.energy} kWh`;
    document.getElementById('modal-price').textContent = `$${listing.price.toFixed(2)}`;
    document.getElementById('modal-location').textContent = listing.location;
    
    // Setup power slider
    const slider = document.getElementById('power-slider');
    slider.max = listing.energy;
    slider.value = listing.energy;
    
    document.getElementById('power-max').textContent = `${listing.energy} kWh`;
    document.getElementById('power-current').textContent = `${listing.energy} kWh`;
    
    updateTotalCost();
    
    // Setup slider event
    slider.oninput = function() {
        selectedPowerAmount = parseInt(this.value);
        document.getElementById('power-current').textContent = `${selectedPowerAmount} kWh`;
        updateTotalCost();
        updateQuickSelectButtons();
    };
    
    document.getElementById('modal-buy-btn').onclick = () => {
        closeEnergyModal();
        buyEnergy(listingId, selectedPowerAmount);
    };
    
    // Reset quick select buttons
    document.querySelectorAll('.quick-select-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.quick-select-btn:last-child').classList.add('active');
    
    energyModal.classList.remove('hidden');
}

// Update total cost based on selected power amount
function updateTotalCost() {
    const total = (selectedPowerAmount * currentPricePerKwh).toFixed(2);
    document.getElementById('modal-total').textContent = `$${total}`;
}

// Set power amount from quick select buttons
function setPowerAmount(percentage) {
    const amount = Math.round((maxPowerAvailable * percentage) / 100);
    selectedPowerAmount = amount;
    
    const slider = document.getElementById('power-slider');
    slider.value = amount;
    document.getElementById('power-current').textContent = `${amount} kWh`;
    updateTotalCost();
    
    // Update button states
    document.querySelectorAll('.quick-select-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Update quick select button states based on slider
function updateQuickSelectButtons() {
    const percentage = (selectedPowerAmount / maxPowerAvailable) * 100;
    document.querySelectorAll('.quick-select-btn').forEach(btn => btn.classList.remove('active'));
    
    if (percentage === 25) document.querySelectorAll('.quick-select-btn')[0].classList.add('active');
    else if (percentage === 50) document.querySelectorAll('.quick-select-btn')[1].classList.add('active');
    else if (percentage === 75) document.querySelectorAll('.quick-select-btn')[2].classList.add('active');
    else if (percentage === 100) document.querySelectorAll('.quick-select-btn')[3].classList.add('active');
}

// Close Energy Modal
function closeEnergyModal() {
    energyModal.classList.add('hidden');
    selectedListingId = null;
}

// Buy Energy
function buyEnergy(listingId, amount) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    
    // Use provided amount or default to full listing
    const purchaseAmount = amount || listing.energy;

    // Add to purchase history
    const purchase = {
        id: Date.now(),
        listingId: listing.id,
        type: listing.type,
        energy: purchaseAmount,
        price: listing.price,
        totalPrice: (purchaseAmount * listing.price).toFixed(2),
        location: listing.location,
        seller: listing.seller,
        date: new Date().toLocaleDateString()
    };

    purchaseHistory.unshift(purchase);
    savePurchaseHistory(purchaseHistory);

    // Update listing energy
    listing.energy -= purchaseAmount;
    
    // Mark as sold if no energy left
    if (listing.energy <= 0) {
        listing.status = 'sold';
    }
    
    saveListings(listings);

    // Update UI
    renderListings();
    renderPurchaseHistory();
    updateStats();

    // Show confirmation modal
    const remainingMsg = listing.energy > 0 ? ` (${listing.energy} kWh still available)` : '';
    showModal(`You have successfully purchased ${purchaseAmount} kWh of ${listing.type} energy from ${listing.seller} for $${purchase.totalPrice}.${remainingMsg}`);
}

// Render Purchase History
function renderPurchaseHistory() {
    purchaseHistory = getPurchaseHistory();
    
    if (purchaseHistory.length === 0) {
        purchaseHistoryContainer.innerHTML = '<p class="empty-state">No purchases yet. Buy energy to see your history here.</p>';
        return;
    }

    const purchaseList = document.createElement('div');
    purchaseList.className = 'purchase-list';

    purchaseHistory.forEach(purchase => {
        const item = document.createElement('div');
        item.className = 'purchase-item';
        item.innerHTML = `
            <div class="purchase-info">
                <h4>${getEnergyIcon(purchase.type)} ${purchase.type} Energy - ${purchase.seller}</h4>
                <p>${purchase.location} • ${purchase.date}</p>
            </div>
            <div class="purchase-amount">
                <div class="kwh">${purchase.energy} kWh</div>
                <div class="price">$${purchase.totalPrice}</div>
            </div>
        `;
        purchaseList.appendChild(item);
    });

    purchaseHistoryContainer.innerHTML = '';
    purchaseHistoryContainer.appendChild(purchaseList);
}

// Clear Purchase History
function clearPurchaseHistory() {
    if (confirm('Are you sure you want to clear your purchase history?')) {
        purchaseHistory = [];
        savePurchaseHistory(purchaseHistory);
        renderPurchaseHistory();
        updateStats();
    }
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
    if (event.target === energyModal) {
        closeEnergyModal();
    }
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeEnergyModal();
    }
});
