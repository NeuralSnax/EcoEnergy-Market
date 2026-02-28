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

// Mock Weather Data Generator
function getWeatherForLocation(location, energyType) {
    // Generate realistic weather based on location and energy type
    const weatherConditions = {
        'Delhi': { 
            temp: 32, 
            condition: 'sunny', 
            humidity: 45, 
            windSpeed: 12, 
            windDirection: 'NW',
            pressure: 1012,
            airQuality: 'Moderate'
        },
        'Mumbai': { 
            temp: 29, 
            condition: 'partly-cloudy', 
            humidity: 78, 
            windSpeed: 18, 
            windDirection: 'SW',
            pressure: 1008,
            airQuality: 'Poor'
        },
        'Gujarat': { 
            temp: 35, 
            condition: 'sunny', 
            humidity: 40, 
            windSpeed: 25, 
            windDirection: 'W',
            pressure: 1010,
            airQuality: 'Good'
        },
        'Punjab': { 
            temp: 28, 
            condition: 'cloudy', 
            humidity: 55, 
            windSpeed: 15, 
            windDirection: 'NE',
            pressure: 1015,
            airQuality: 'Moderate'
        },
        'Tamil Nadu': { 
            temp: 31, 
            condition: 'sunny', 
            humidity: 65, 
            windSpeed: 22, 
            windDirection: 'SE',
            pressure: 1009,
            airQuality: 'Good'
        }
    };
    
    const defaultWeather = { 
        temp: 28, 
        condition: 'sunny', 
        humidity: 50, 
        windSpeed: 15, 
        windDirection: 'N',
        pressure: 1013,
        airQuality: 'Moderate'
    };
    
    const weather = weatherConditions[location] || defaultWeather;
    
    // Calculate generation potential based on energy type and weather
    let generationPotential = 'Good';
    let potentialColor = 'good';
    let potentialIcon = '✓';
    let extraInfo = '';
    
    if (energyType === 'Solar') {
        // Solar depends on sunlight/cloud cover, temperature, and air quality
        let solarScore = 0;
        let stateDetails = [];
        
        // Sunlight condition scoring
        if (weather.condition === 'sunny') {
            solarScore += 50;
            stateDetails.push('☀️ Full Sun');
        } else if (weather.condition === 'partly-cloudy') {
            solarScore += 35;
            stateDetails.push('⛅ Partial Cloud');
        } else if (weather.condition === 'cloudy') {
            solarScore += 15;
            stateDetails.push('☁️ Heavy Cloud');
        } else {
            solarScore += 5;
            stateDetails.push('🌧️ Rain/Storm');
        }
        
        // Temperature factor (solar panels work best at 25-35°C)
        if (weather.temp >= 25 && weather.temp <= 35) {
            solarScore += 25;
            stateDetails.push('🌡️ Optimal Temp');
        } else if (weather.temp >= 20 && weather.temp < 25) {
            solarScore += 20;
            stateDetails.push('🌡️ Good Temp');
        } else if (weather.temp > 35 && weather.temp <= 40) {
            solarScore += 15;
            stateDetails.push('🌡️ High Temp');
        } else {
            solarScore += 10;
            stateDetails.push('🌡️ Low Temp');
        }
        
        // Humidity factor (lower is better for solar)
        if (weather.humidity <= 50) {
            solarScore += 15;
            stateDetails.push('💧 Low Humidity');
        } else if (weather.humidity <= 70) {
            solarScore += 10;
            stateDetails.push('💧 Moderate Humidity');
        } else {
            solarScore += 5;
            stateDetails.push('💧 High Humidity');
        }
        
        // Air quality factor
        if (weather.airQuality === 'Good') {
            solarScore += 10;
            stateDetails.push('😊 Clean Air');
        } else if (weather.airQuality === 'Moderate') {
            solarScore += 5;
            stateDetails.push('😐 Moderate Air');
        } else {
            stateDetails.push('😷 Poor Air');
        }
        
        // Determine generation state
        if (solarScore >= 85) {
            generationPotential = 'Peak';
            potentialColor = 'peak';
            potentialIcon = '⚡';
            extraInfo = stateDetails.join(' • ');
        } else if (solarScore >= 70) {
            generationPotential = 'Excellent';
            potentialColor = 'excellent';
            potentialIcon = '☀️';
            extraInfo = stateDetails.join(' • ');
        } else if (solarScore >= 55) {
            generationPotential = 'Good';
            potentialColor = 'good';
            potentialIcon = '✓';
            extraInfo = stateDetails.join(' • ');
        } else if (solarScore >= 40) {
            generationPotential = 'Fair';
            potentialColor = 'fair';
            potentialIcon = '~';
            extraInfo = stateDetails.join(' • ');
        } else {
            generationPotential = 'Poor';
            potentialColor = 'poor';
            potentialIcon = '!';
            extraInfo = stateDetails.join(' • ');
        }
        
    } else if (energyType === 'Wind') {
        // Wind energy depends on wind speed, direction consistency, and atmospheric pressure
        let windScore = 0;
        let stateDetails = [];
        
        // Wind speed scoring with detailed states
        if (weather.windSpeed >= 30) {
            windScore += 45;
            stateDetails.push('💨 Storm Force');
        } else if (weather.windSpeed >= 25) {
            windScore += 40;
            stateDetails.push('💨 High Wind');
        } else if (weather.windSpeed >= 20) {
            windScore += 35;
            stateDetails.push('💨 Strong Wind');
        } else if (weather.windSpeed >= 15) {
            windScore += 25;
            stateDetails.push('💨 Good Wind');
        } else if (weather.windSpeed >= 10) {
            windScore += 15;
            stateDetails.push('💨 Light Wind');
        } else if (weather.windSpeed >= 5) {
            windScore += 8;
            stateDetails.push('💨 Breeze');
        } else {
            windScore += 2;
            stateDetails.push('💨 Calm');
        }
        
        // Wind direction consistency
        const consistentDirections = ['W', 'NW', 'SW'];
        if (consistentDirections.includes(weather.windDirection)) {
            windScore += 10;
            stateDetails.push(`🧭 ${weather.windDirection} Prevailing`);
        } else {
            stateDetails.push(`🧭 ${weather.windDirection} Variable`);
        }
        
        // Pressure differential indicator
        if (weather.pressure < 1005) {
            windScore += 25;
            stateDetails.push('📉 Deep Low Pressure');
        } else if (weather.pressure < 1010) {
            windScore += 20;
            stateDetails.push('📉 Low Pressure');
        } else if (weather.pressure > 1015) {
            windScore += 10;
            stateDetails.push('📈 High Pressure');
        } else {
            windScore += 15;
            stateDetails.push('📊 Normal Pressure');
        }
        
        // Coastal locations often have more consistent winds
        const coastalLocations = ['Gujarat', 'Tamil Nadu', 'Mumbai'];
        if (coastalLocations.includes(location)) {
            windScore += 15;
            stateDetails.push('🌊 Coastal Advantage');
        }
        
        // Temperature factor (wind turbines work in all temps but extreme cold affects mechanics)
        if (weather.temp >= 10 && weather.temp <= 35) {
            windScore += 5;
            stateDetails.push('🌡️ Optimal Temp');
        } else if (weather.temp < 10) {
            stateDetails.push('🌡️ Cold Conditions');
        } else {
            stateDetails.push('🌡️ Hot Conditions');
        }
        
        // Determine generation state with detailed levels
        if (windScore >= 85) {
            generationPotential = 'Storm';
            potentialColor = 'storm';
            potentialIcon = '⚡';
            extraInfo = stateDetails.join(' • ');
        } else if (windScore >= 70) {
            generationPotential = 'Excellent';
            potentialColor = 'excellent';
            potentialIcon = '💨';
            extraInfo = stateDetails.join(' • ');
        } else if (windScore >= 55) {
            generationPotential = 'Good';
            potentialColor = 'good';
            potentialIcon = '✓';
            extraInfo = stateDetails.join(' • ');
        } else if (windScore >= 40) {
            generationPotential = 'Moderate';
            potentialColor = 'fair';
            potentialIcon = '~';
            extraInfo = stateDetails.join(' • ');
        } else if (windScore >= 25) {
            generationPotential = 'Low';
            potentialColor = 'poor';
            potentialIcon = '↓';
            extraInfo = stateDetails.join(' • ');
        } else {
            generationPotential = 'Minimal';
            potentialColor = 'minimal';
            potentialIcon = '!';
            extraInfo = stateDetails.join(' • ');
        }
        
    } else if (energyType === 'Biogas') {
        // Biogas depends on temperature, humidity, pressure for digestion process
        // Optimal biogas production: 35-40°C (mesophilic) or 50-60°C (thermophilic)
        let biogasScore = 0;
        let stateDetails = [];
        
        // Temperature factor with detailed states
        if (weather.temp >= 35 && weather.temp <= 40) {
            biogasScore += 45;
            stateDetails.push('🌡️ Thermophilic Peak');
        } else if (weather.temp >= 30 && weather.temp < 35) {
            biogasScore += 40;
            stateDetails.push('🌡️ Mesophilic Optimal');
        } else if (weather.temp >= 25 && weather.temp < 30) {
            biogasScore += 30;
            stateDetails.push('🌡️ Good Fermentation');
        } else if (weather.temp >= 20 && weather.temp < 25) {
            biogasScore += 20;
            stateDetails.push('🌡️ Moderate Activity');
        } else if (weather.temp >= 15 && weather.temp < 20) {
            biogasScore += 12;
            stateDetails.push('🌡️ Slow Digestion');
        } else if (weather.temp < 15) {
            biogasScore += 5;
            stateDetails.push('🌡️ Cold - Very Slow');
        } else {
            biogasScore += 25;
            stateDetails.push('🌡️ Hot - Cooling Needed');
        }
        
        // Humidity affects feedstock moisture
        if (weather.humidity >= 55 && weather.humidity <= 65) {
            biogasScore += 20;
            stateDetails.push('💧 Optimal Moisture');
        } else if (weather.humidity >= 45 && weather.humidity < 55) {
            biogasScore += 18;
            stateDetails.push('💧 Good Moisture');
        } else if (weather.humidity >= 65 && weather.humidity <= 75) {
            biogasScore += 15;
            stateDetails.push('💧 High Moisture');
        } else if (weather.humidity > 75) {
            biogasScore += 10;
            stateDetails.push('💧 Too Wet');
        } else {
            biogasScore += 12;
            stateDetails.push('💧 Dry - Add Water');
        }
        
        // Pressure affects gas collection and system pressure
        if (weather.pressure >= 1010 && weather.pressure <= 1015) {
            biogasScore += 10;
            stateDetails.push('📊 Optimal Pressure');
        } else if (weather.pressure >= 1005 && weather.pressure < 1010) {
            biogasScore += 8;
            stateDetails.push('📊 Low Pressure');
        } else if (weather.pressure > 1015) {
            biogasScore += 7;
            stateDetails.push('📊 High Pressure');
        } else {
            biogasScore += 5;
            stateDetails.push('📊 Very Low Pressure');
        }
        
        // Air quality affects microbial health
        if (weather.airQuality === 'Good') {
            biogasScore += 10;
            stateDetails.push('😊 Clean Air');
        } else if (weather.airQuality === 'Moderate') {
            biogasScore += 7;
            stateDetails.push('😐 Moderate Air');
        } else {
            biogasScore += 4;
            stateDetails.push('😷 Poor Air Quality');
        }
        
        // Temperature stability indicator (based on location climate)
        const stableRegions = ['Punjab', 'Tamil Nadu'];
        if (stableRegions.includes(location)) {
            biogasScore += 5;
            stateDetails.push('📍 Stable Climate');
        }
        
        // Determine generation state with detailed levels
        if (biogasScore >= 80) {
            generationPotential = 'Peak';
            potentialColor = 'peak';
            potentialIcon = '🌱';
            extraInfo = stateDetails.join(' • ');
        } else if (biogasScore >= 65) {
            generationPotential = 'Excellent';
            potentialColor = 'excellent';
            potentialIcon = '🌿';
            extraInfo = stateDetails.join(' • ');
        } else if (biogasScore >= 50) {
            generationPotential = 'Good';
            potentialColor = 'good';
            potentialIcon = '✓';
            extraInfo = stateDetails.join(' • ');
        } else if (biogasScore >= 35) {
            generationPotential = 'Moderate';
            potentialColor = 'fair';
            potentialIcon = '~';
            extraInfo = stateDetails.join(' • ');
        } else if (biogasScore >= 20) {
            generationPotential = 'Slow';
            potentialColor = 'poor';
            potentialIcon = '↓';
            extraInfo = stateDetails.join(' • ');
        } else {
            generationPotential = 'Dormant';
            potentialColor = 'minimal';
            potentialIcon = '!';
            extraInfo = stateDetails.join(' • ');
        }
    }
    
    return { ...weather, generationPotential, potentialColor, potentialIcon, extraInfo };
}

// Get Weather Icon
function getWeatherIcon(condition) {
    const icons = {
        'sunny': '☀️',
        'partly-cloudy': '⛅',
        'cloudy': '☁️',
        'rainy': '🌧️'
    };
    return icons[condition] || '☀️';
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
    const weather = getWeatherForLocation(listing.location, listing.type);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="energy-type-badge ${listing.type.toLowerCase()}">${listing.type}</span>
            <span class="energy-icon">${getEnergyIcon(listing.type)}</span>
        </div>
        
        <!-- Weather Widget -->
        <div class="weather-widget">
            <div class="weather-main">
                <span class="weather-icon">${getWeatherIcon(weather.condition)}</span>
                <span class="weather-temp">${weather.temp}°C</span>
            </div>
            <div class="weather-details">
                <span class="weather-humidity">💧 ${weather.humidity}%</span>
                <span class="weather-wind">💨 ${weather.windSpeed} km/h</span>
                ${listing.type === 'Wind' ? `<span class="weather-direction">🧭 ${weather.windDirection}</span>` : ''}
                ${listing.type === 'Biogas' ? `<span class="weather-pressure">📊 ${weather.pressure} hPa</span>` : ''}
            </div>
            <div class="generation-potential potential-${weather.potentialColor}">
                <span class="potential-icon">${weather.potentialIcon}</span>
                <span class="potential-text">${weather.generationPotential} Generation</span>
            </div>
            ${weather.extraInfo ? `<div class="weather-extra-info">${weather.extraInfo}</div>` : ''}
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
