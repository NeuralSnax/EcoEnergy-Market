// Mock Data
let listings = [
    { id: 1, type: "Solar", energy: 30, price: 5, location: "Delhi", seller: "Green Solar", status: "active" },
    { id: 2, type: "Wind", energy: 50, price: 4, location: "Gujarat", seller: "Wind Energy Ltd", status: "active" },
    { id: 3, type: "Biogas", energy: 20, price: 6, location: "Punjab", seller: "BioPower Farms", status: "active" },
    { id: 4, type: "Solar", energy: 100, price: 4.5, location: "Mumbai", seller: "SunPower Solutions", status: "active" },
    { id: 5, type: "Wind", energy: 75, price: 3.8, location: "Tamil Nadu", seller: "Coastal Wind Farms", status: "active" }
];

let purchaseHistory = [];
let currentFilter = 'all';

// DOM Elements
const listingsContainer = document.getElementById('listings-container');
const purchaseHistoryContainer = document.getElementById('purchase-history-container');
const sellerListingsTbody = document.getElementById('seller-listings-tbody');
const noListingsMsg = document.getElementById('no-listings-msg');
const listingForm = document.getElementById('listing-form');
const modal = document.getElementById('confirmation-modal');
const confirmationMessage = document.getElementById('confirmation-message');

// Dashboard Elements
const totalListingsEl = document.getElementById('total-listings');
const energySoldEl = document.getElementById('energy-sold');
const estimatedEarningsEl = document.getElementById('estimated-earnings');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    renderListings();
    updateDashboard();
    renderSellerListings();
    setupEventListeners();
    setupNavigation();
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

    // Listing form submission
    listingForm.addEventListener('submit', handleAddListing);
}

// Setup Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            showSection(target);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// Show Section
function showSection(sectionName) {
    // Hide all sections
    document.getElementById('home').classList.add('hidden');
    document.getElementById('marketplace').classList.add('hidden');
    document.getElementById('seller').classList.add('hidden');

    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        
        // Update nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + sectionName) {
                link.classList.add('active');
            }
        });
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// Render Listings (Marketplace)
function renderListings() {
    listingsContainer.innerHTML = '';

    const filteredListings = currentFilter === 'all' 
        ? listings.filter(l => l.status === 'active')
        : listings.filter(l => l.type === currentFilter && l.status === 'active');

    if (filteredListings.length === 0) {
        listingsContainer.innerHTML = '<p class="empty-state">No energy listings available for this filter.</p>';
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
            <button class="btn btn-primary" onclick="buyEnergy(${listing.id})">Buy Energy</button>
        </div>
    `;
    
    return card;
}

// Buy Energy
function buyEnergy(listingId) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    // Add to purchase history
    const purchase = {
        id: Date.now(),
        listingId: listing.id,
        type: listing.type,
        energy: listing.energy,
        price: listing.price,
        totalPrice: (listing.energy * listing.price).toFixed(2),
        location: listing.location,
        seller: listing.seller,
        date: new Date().toLocaleDateString()
    };

    purchaseHistory.unshift(purchase);

    // Mark listing as sold
    listing.status = 'sold';

    // Update UI
    renderListings();
    renderPurchaseHistory();
    updateDashboard();
    renderSellerListings();

    // Show confirmation modal
    showModal(`You have successfully purchased ${listing.energy} kWh of ${listing.type} energy from ${listing.seller} for $${purchase.totalPrice}.`);
}

// Render Purchase History
function renderPurchaseHistory() {
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
                <h4>${purchase.type} Energy - ${purchase.seller}</h4>
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

// Handle Add Listing Form
function handleAddListing(e) {
    e.preventDefault();

    const type = document.getElementById('energy-type').value;
    const energy = parseInt(document.getElementById('energy-amount').value);
    const price = parseFloat(document.getElementById('price-per-kwh').value);
    const location = document.getElementById('location').value;
    const seller = document.getElementById('seller-name').value;

    const newListing = {
        id: Date.now(),
        type,
        energy,
        price,
        location,
        seller,
        status: 'active'
    };

    listings.push(newListing);

    // Reset form
    listingForm.reset();

    // Update UI
    renderListings();
    updateDashboard();
    renderSellerListings();

    // Show confirmation
    showModal(`Your ${type} energy listing has been added successfully!`);
}

// Delete Listing
function deleteListing(listingId) {
    if (confirm('Are you sure you want to delete this listing?')) {
        listings = listings.filter(l => l.id !== listingId);
        renderListings();
        updateDashboard();
        renderSellerListings();
    }
}

// Update Dashboard
function updateDashboard() {
    const activeListings = listings.filter(l => l.status === 'active');
    const soldListings = listings.filter(l => l.status === 'sold');

    // Total listings
    totalListingsEl.textContent = activeListings.length;

    // Energy sold
    const totalEnergySold = soldListings.reduce((sum, l) => sum + l.energy, 0);
    energySoldEl.textContent = `${totalEnergySold} kWh`;

    // Estimated earnings (from sold listings)
    const earnings = soldListings.reduce((sum, l) => sum + (l.energy * l.price), 0);
    estimatedEarningsEl.textContent = `$${earnings.toFixed(2)}`;
}

// Render Seller Listings Table
function renderSellerListings() {
    const sellerListings = listings.filter(l => l.status === 'active');

    if (sellerListings.length === 0) {
        sellerListingsTbody.innerHTML = '';
        noListingsMsg.style.display = 'block';
        return;
    }

    noListingsMsg.style.display = 'none';
    sellerListingsTbody.innerHTML = '';

    sellerListings.forEach(listing => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="energy-type-badge ${listing.type.toLowerCase()}">${listing.type}</span>
            </td>
            <td>${listing.energy} kWh</td>
            <td>$${listing.price.toFixed(2)}</td>
            <td>${listing.location}</td>
            <td><span class="status-badge ${listing.status}">${listing.status}</span></td>
            <td>
                <button class="btn btn-danger" onclick="deleteListing(${listing.id})">Delete</button>
            </td>
        `;
        sellerListingsTbody.appendChild(row);
    });
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

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});
