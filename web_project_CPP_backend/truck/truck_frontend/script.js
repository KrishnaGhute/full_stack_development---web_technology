// ============================================================================
// TRUCK DEALERSHIP - MAIN JAVASCRIPT
// C++ Backend Integration & Frontend Logic
// ============================================================================

class TruckDealershipAPI {
    constructor() {
        this.baseURL = 'http://localhost:8080';
        this.cache = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Sidebar toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar(true));
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => this.toggleSidebar(false));
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => this.toggleSidebar(false));
        }

        // Header scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Form submissions
        this.setupFormHandlers();
    }

    toggleSidebar(open) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (open) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    handleScroll() {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        }
    }

    async loadInitialData() {
        // Load data for current page
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

        switch (page) {
            case 'index.html':
            case '':
                await this.loadHomePage();
                break;
            case 'gallery.html':
                await this.loadGalleryPage();
                break;
            case 'finance.html':
                this.setupFinanceCalculator();
                break;
            case 'compare.html':
                await this.setupComparisonTool();
                break;
        }
    }

    // ========================================================================
    // HOME PAGE FUNCTIONALITY
    // ========================================================================

    async loadHomePage() {
        try {
            // Load featured trucks
            await this.loadFeaturedTrucks();

            // Load availability table
            await this.loadAvailabilityTable();

            // Update truck count
            this.updateTruckCount();
        } catch (error) {
            console.error('Error loading home page:', error);
        }
    }

    async loadFeaturedTrucks() {
        const container = document.getElementById('featured-trucks-grid');
        if (!container) return;

        try {
            const trucks = await this.fetchTrucks();

            // Show only first 4 trucks as featured
            const featuredTrucks = trucks.slice(0, 4);

            container.innerHTML = featuredTrucks.map((truck, index) => `
                <div class="truck-card" style="animation-delay: ${index * 0.1}s">
                    <div class="truck-image">
                        🚛
                    </div>
                    <div class="truck-info">
                        <div class="truck-brand">${truck.brand}</div>
                        <div class="truck-name">${truck.model}</div>
                        <div class="truck-specs">
                            <div class="spec">
                                <span class="spec-icon">⚡</span>
                                <span>${truck.horsepower} HP</span>
                            </div>
                            <div class="spec">
                                <span class="spec-icon">⚖️</span>
                                <span>${truck.gvw?.toLocaleString() || 'N/A'} kg</span>
                            </div>
                            <div class="spec">
                                <span class="spec-icon">⛽</span>
                                <span>${truck.fuelType}</span>
                            </div>
                            <div class="spec">
                                <span class="spec-icon">📊</span>
                                <span>${truck.mileage} km/l</span>
                            </div>
                        </div>
                        <div class="truck-footer">
                            <div class="truck-price">₹${truck.price} L</div>
                            <span class="availability-badge ${this.getAvailabilityClass(truck.availability)}">
                                ${truck.availability}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Unable to load trucks</h3>
                    <p>Please ensure the C++ backend server is running on localhost:8080</p>
                    <div class="error-details">
                        <strong>Error:</strong> ${error.message}
                    </div>
                </div>
            `;
        }
    }

    async loadAvailabilityTable() {
        const tbody = document.getElementById('availability-tbody');
        if (!tbody) return;

        try {
            const availability = await this.fetchAvailability();

            tbody.innerHTML = availability.map(item => `
                <tr>
                    <td><strong>${item.model}</strong></td>
                    <td>
                        <span class="availability-badge ${this.getAvailabilityClass(item.availability)}">
                            ${item.availability}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="window.location.href='gallery.html'">
                            View Details
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="error-cell">
                        <div class="error-message">
                            Failed to load availability data from C++ backend
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    async updateTruckCount() {
        const countElement = document.getElementById('trucks-count');
        if (!countElement) return;

        try {
            const trucks = await this.fetchTrucks();
            countElement.textContent = `${trucks.length}+`;
        } catch (error) {
            countElement.textContent = '8+';
        }
    }

// ========================================================================
// GALLERY PAGE FUNCTIONALITY
// ========================================================================

async loadGalleryPage() {
    const container = document.getElementById('trucks-gallery-grid');
    if (!container) return;

    try {
        const trucks = await this.fetchTrucks(); // Fetch from backend

        container.innerHTML = trucks.map((truck, index) => `
            <div class="truck-card" style="animation-delay: ${index * 0.05}s">
                <div class="truck-image">
                    <img src="${truck.image}" 
                         alt="${truck.model}" 
                         onerror="this.src='https://via.placeholder.com/300x180?text=Truck+Image'" />
                </div>

                <div class="truck-info">
                    <div class="truck-brand">${truck.brand}</div>
                    <div class="truck-name">${truck.model}</div>
                    <div class="truck-specs">
                        <div class="spec">
                            <span class="spec-icon">⚡</span>
                            <span><strong>${truck.horsepower} HP</strong></span>
                        </div>
                        <div class="spec">
                            <span class="spec-icon">⚖️</span>
                            <span><strong>${truck.gvw?.toLocaleString() || 'N/A'} kg</strong></span>
                        </div>
                        <div class="spec">
                            <span class="spec-icon">🔧</span>
                            <span><strong>${truck.engine}</strong></span>
                        </div>
                        <div class="spec">
                            <span class="spec-icon">⛽</span>
                            <span><strong>${truck.fuelType}</strong></span>
                        </div>
                        <div class="spec">
                            <span class="spec-icon">📊</span>
                            <span><strong>${truck.mileage} km/l</strong></span>
                        </div>
                        <div class="spec spec-full">
                            <span class="spec-icon">💰</span>
                            <span><strong>₹${truck.price} Lakhs</strong></span>
                        </div>
                    </div>

                    <div class="truck-footer">
                        <span class="availability-badge ${this.getAvailabilityClass(truck.availability)}">
                            ${truck.availability}
                        </span>
                        <div class="truck-actions">
                            <button class="btn btn-primary btn-sm" 
                                    onclick="app.showTruckDetails(${truck.id})">
                                Details
                            </button>
                            <button class="btn btn-outline btn-sm" 
                                    onclick="window.location.href='finance.html?truck=${truck.id}'">
                                Finance
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Update results count
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) resultsCount.textContent = `${trucks.length} trucks found`;

    } catch (error) {
        container.innerHTML = this.getErrorHTML('Failed to load truck gallery');
        console.error('Error loading trucks:', error);
    }
}

// Show truck details modal / alert
showTruckDetails(truckId) {
    alert(`Truck details for ID: ${truckId}\nThis would show detailed specifications, images, and features.`);
}

    
    // ========================================================================
    // FINANCE CALCULATOR
    // ========================================================================

    setupFinanceCalculator() {
        const form = document.getElementById('finance-form');
        const amountInput = document.getElementById('loan-amount');
        const rateInput = document.getElementById('interest-rate');
        const tenureSelect = document.getElementById('loan-tenure');
        const resultContainer = document.getElementById('emi-result');

        if (!form) return;

        // Live calculation on input change
        const inputs = [amountInput, rateInput, tenureSelect];
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.calculateEMILive());
                input.addEventListener('change', () => this.calculateEMILive());
            }
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateEMI();
        });

        // Initial calculation
        this.calculateEMILive();

        // Pre-fill if truck ID is in URL
        this.prefillFromURL();
    }

    prefillFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const truckId = urlParams.get('truck');

        if (truckId) {
            this.fetchTrucks().then(trucks => {
                const truck = trucks.find(t => t.id == truckId);
                if (truck) {
                    const amountInput = document.getElementById('loan-amount');
                    if (amountInput) {
                        // Convert lakhs to actual amount (truck price * 100000)
                        amountInput.value = truck.price * 100000;
                        this.calculateEMILive();
                    }
                }
            });
        }
    }

    async calculateEMILive() {
        const amount = parseFloat(document.getElementById('loan-amount')?.value) || 0;
        const rate = parseFloat(document.getElementById('interest-rate')?.value) || 0;
        const months = parseInt(document.getElementById('loan-tenure')?.value) || 0;

        if (amount < 100000 || rate < 5 || months < 12) {
            this.showEMIResult(null, 'Please enter valid loan details');
            return;
        }

        try {
            const result = await this.fetchEMI(amount, rate, months);
            this.showEMIResult(result);
        } catch (error) {
            this.showEMIResult(null, 'Error calculating EMI from C++ backend');
        }
    }

    async calculateEMI() {
        const amount = parseFloat(document.getElementById('loan-amount').value);
        const rate = parseFloat(document.getElementById('interest-rate').value);
        const months = parseInt(document.getElementById('loan-tenure').value);

        if (!this.validateFinanceForm(amount, rate, months)) return;

        try {
            const result = await this.fetchEMI(amount, rate, months);
            this.showEMIResult(result);
        } catch (error) {
            this.showEMIResult(null, 'Failed to calculate EMI. Please ensure C++ backend is running.');
        }
    }

    validateFinanceForm(amount, rate, months) {
        const errors = [];

        if (amount < 100000) errors.push('Minimum loan amount is ₹1,00,000');
        if (amount > 50000000) errors.push('Maximum loan amount is ₹5,00,00,000');
        if (rate < 5 || rate > 20) errors.push('Interest rate should be between 5% and 20%');
        if (months < 12 || months > 84) errors.push('Loan tenure should be between 1 and 7 years');

        if (errors.length > 0) {
            this.showEMIResult(null, errors.join('<br>'));
            return false;
        }

        return true;
    }

    showEMIResult(result, errorMessage = null) {
        const container = document.getElementById('emi-result');
        if (!container) return;

        if (errorMessage || !result || !result.isValid) {
            container.innerHTML = `
                <div class="error-message">
                    ${errorMessage || result?.message || 'Invalid calculation'}
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        const monthlyEMI = parseFloat(result.emi);
        const totalAmount = parseFloat(result.totalAmount);
        const totalInterest = parseFloat(result.totalInterest);

        container.innerHTML = `
            <div class="result-card">
                <h3>EMI Calculation Results</h3>
                <div class="emi-details">
                    <div class="emi-item">
                        <span class="emi-label">Monthly EMI</span>
                        <span class="emi-value primary">₹${monthlyEMI.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                    </div>
                    <div class="emi-item">
                        <span class="emi-label">Total Amount</span>
                        <span class="emi-value">₹${totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                    </div>
                    <div class="emi-item">
                        <span class="emi-label">Total Interest</span>
                        <span class="emi-value">₹${totalInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                    </div>
                </div>
                <div class="emi-chart">
                    <div class="chart-bar">
                        <div class="principal-bar" 
                             style="width: ${(totalAmount - totalInterest) / totalAmount * 100}%">
                        </div>
                        <div class="interest-bar" 
                             style="width: ${totalInterest / totalAmount * 100}%">
                        </div>
                    </div>
                    <div class="chart-legend">
                        <span class="legend-item">
                            <span class="legend-color principal"></span>
                            Principal Amount
                        </span>
                        <span class="legend-item">
                            <span class="legend-color interest"></span>
                            Interest Amount
                        </span>
                    </div>
                </div>
                <small class="api-note">✓ Calculated using C++ backend API</small>
            </div>
        `;
        container.style.display = 'block';
    }

    // ========================================================================
    // COMPARISON TOOL
    // ========================================================================

    async setupComparisonTool() {
        await this.populateComparisonSelects();
        this.setupComparisonHandlers();
    }

    async populateComparisonSelects() {
        const select1 = document.getElementById('truck1-select');
        const select2 = document.getElementById('truck2-select');

        if (!select1 || !select2) return;

        try {
            const trucks = await this.fetchTrucks();
            const options = trucks.map(truck => 
                `<option value="${truck.id}">${truck.brand} ${truck.model}</option>`
            ).join('');

            select1.innerHTML = '<option value="">Select first truck...</option>' + options;
            select2.innerHTML = '<option value="">Select second truck...</option>' + options;

        } catch (error) {
            console.error('Error populating comparison selects:', error);
        }
    }

    setupComparisonHandlers() {
        const form = document.getElementById('comparison-form');
        const select1 = document.getElementById('truck1-select');
        const select2 = document.getElementById('truck2-select');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.compareTrucks();
            });
        }

        // Auto-compare when both trucks are selected
        [select1, select2].forEach(select => {
            if (select) {
                select.addEventListener('change', () => {
                    if (select1.value && select2.value && select1.value !== select2.value) {
                        this.compareTrucks();
                    }
                });
            }
        });
    }

    async compareTrucks() {
        const truck1Id = document.getElementById('truck1-select').value;
        const truck2Id = document.getElementById('truck2-select').value;
        const resultContainer = document.getElementById('comparison-result');

        if (!truck1Id || !truck2Id) {
            this.showError(resultContainer, 'Please select both trucks to compare');
            return;
        }

        if (truck1Id === truck2Id) {
            this.showError(resultContainer, 'Please select two different trucks');
            return;
        }

        try {
            const result = await this.fetchComparison(truck1Id, truck2Id);
            this.showComparisonResult(result);
        } catch (error) {
            this.showError(resultContainer, 'Failed to compare trucks. Please ensure C++ backend is running.');
        }
    }

    showComparisonResult(result) {
        const container = document.getElementById('comparison-result');
        if (!container || !result.isValid) return;

        const truck1 = result.truck1;
        const truck2 = result.truck2;

        container.innerHTML = `
            <div class="comparison-container">
                <div class="comparison-card">
                    <h3>${truck1.brand} ${truck1.model}</h3>
                    <div class="truck-image">🚛</div>
                    <div class="comparison-specs">
                        <div class="spec-row">
                            <span class="spec-label">Price:</span>
                            <span class="spec-value">₹${truck1.price} L</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Power:</span>
                            <span class="spec-value">${truck1.horsepower} HP</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">GVW:</span>
                            <span class="spec-value">${truck1.gvw?.toLocaleString() || 'N/A'} kg</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Fuel Type:</span>
                            <span class="spec-value">${truck1.fuelType}</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Mileage:</span>
                            <span class="spec-value">${truck1.mileage} km/l</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Engine:</span>
                            <span class="spec-value">${truck1.engine}</span>
                        </div>
                    </div>
                </div>

                <div class="comparison-card">
                    <h3>${truck2.brand} ${truck2.model}</h3>
                    <div class="truck-image">🚛</div>
                    <div class="comparison-specs">
                        <div class="spec-row">
                            <span class="spec-label">Price:</span>
                            <span class="spec-value">₹${truck2.price} L</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Power:</span>
                            <span class="spec-value">${truck2.horsepower} HP</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">GVW:</span>
                            <span class="spec-value">${truck2.gvw?.toLocaleString() || 'N/A'} kg</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Fuel Type:</span>
                            <span class="spec-value">${truck2.fuelType}</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Mileage:</span>
                            <span class="spec-value">${truck2.mileage} km/l</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Engine:</span>
                            <span class="spec-value">${truck2.engine}</span>
                        </div>
                    </div>
                </div>

                <div class="comparison-result">
                    <h3>🏆 Comparison Analysis</h3>
                    <div class="differences">
                        <h4>Key Differences:</h4>
                        <ul>
                            ${result.differences.map(diff => `<li>${diff}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="recommendation">
                        <h4>💡 Recommendation:</h4>
                        <p>${result.recommendation}</p>
                    </div>
                    <small class="api-note">✓ Analysis powered by C++ comparison algorithm</small>
                </div>
            </div>
        `;
        container.style.display = 'block';
    }

    // ========================================================================
    // CONTACT FORM
    // ========================================================================

    setupFormHandlers() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmission();
            });
        }
    }

    async handleContactSubmission() {
        const form = document.getElementById('contact-form');
        const resultContainer = document.getElementById('contact-result');

        const formData = {
            name: form.name.value,
            email: form.email.value,
            phone: form.phone.value,
            message: form.message.value
        };

        // Validate form
        const errors = this.validateContactForm(formData);
        if (errors.length > 0) {
            this.showError(resultContainer, errors.join('<br>'));
            return;
        }

        try {
            const result = await this.submitContact(formData);
            this.showContactResult(result);

            if (result.success) {
                form.reset();
            }
        } catch (error) {
            this.showError(resultContainer, 'Failed to submit contact form. Please ensure C++ backend is running.');
        }
    }

    validateContactForm(data) {
        const errors = [];

        if (!data.name.trim()) errors.push('Name is required');
        if (!data.email.trim()) errors.push('Email is required');
        if (!data.phone.trim()) errors.push('Phone is required');
        if (!data.message.trim()) errors.push('Message is required');

        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }

        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push('Please enter a valid phone number');
        }

        return errors;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPhone(phone) {
        return /^[+]?[\d\s\-()]{10,}$/.test(phone);
    }

    showContactResult(result) {
        const container = document.getElementById('contact-result');
        if (!container) return;

        if (result.success) {
            container.innerHTML = `
                <div class="form-success">
                    <h3>✅ Message Sent Successfully!</h3>
                    <p>Thank you for contacting us. We'll get back to you soon.</p>
                    <p><strong>Reference ID:</strong> #${result.contactId}</p>
                    <small>✓ Processed by C++ backend system</small>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="error-message">
                    <strong>Error:</strong> ${result.message}
                </div>
            `;
        }
        container.style.display = 'block';
    }

    // ========================================================================
    // API COMMUNICATION (Simulated C++ Backend)
    // ========================================================================

    async fetchTrucks() {
        // In production, this would make actual HTTP requests to C++ backend
        // For demo purposes, we simulate the C++ backend response
        return this.simulateAPICall('/getTrucks', this.getMockTrucksData());
    }

    async fetchEMI(amount, rate, months) {
        const params = { amount, rate, months };
        return this.simulateAPICall('/calculateEMI', this.calculateEMIMock(amount, rate, months));
    }

    async fetchComparison(id1, id2) {
        const params = { id1, id2 };
        const trucks = await this.fetchTrucks();
        const truck1 = trucks.find(t => t.id == id1);
        const truck2 = trucks.find(t => t.id == id2);

        return this.simulateAPICall('/compare', this.compareTrucksMock(truck1, truck2));
    }

    async fetchAvailability() {
        const trucks = await this.fetchTrucks();
        return trucks.map(truck => ({
            id: truck.id,
            model: `${truck.brand} ${truck.model}`,
            availability: truck.availability
        }));
    }

    async submitContact(data) {
        return this.simulateAPICall('/contact', {
            success: true,
            contactId: Math.floor(Math.random() * 9000) + 1000,
            message: 'Contact form submitted successfully'
        });
    }

    // Mock data and calculations (simulating C++ backend responses)
    getMockTrucksData() {
        return [
            {
                id: 1, brand: "Tata", model: "Prima FL 5530.S", price: 42.32, 
                engine: "6.7L Cummins ISBe", horsepower: 300, gvw: 55000, 
                fuelType: "Diesel", mileage: 3.5, availability: "In Stock"
            },
            {
                id: 2, brand: "Tata", model: "Signa 4930.T", price: 47.48, 
                engine: "6.7L Cummins ISBe", horsepower: 300, gvw: 49000, 
                fuelType: "Diesel", mileage: 4.0, availability: "In Stock"
            },
            {
                id: 3, brand: "Tata", model: "Signa 3525.KTK", price: 45.52, 
                engine: "Cummins ISBe", horsepower: 250, gvw: 35000, 
                fuelType: "Diesel", mileage: 4.2, availability: "Limited"
            },
            {
                id: 4, brand: "Tata", model: "1916 LPT", price: 27.5, 
                engine: "3.3L NG", horsepower: 160, gvw: 19000, 
                fuelType: "CNG", mileage: 5.0, availability: "In Stock"
            },
            {
                id: 5, brand: "Ashok Leyland", model: "AVTR 5520", price: 48.75, 
                engine: "H-Series CRS", horsepower: 520, gvw: 55000, 
                fuelType: "Diesel", mileage: 3.8, availability: "In Stock"
            },
            {
                id: 6, brand: "Mahindra", model: "Blazo X 49", price: 46.20, 
                engine: "mPOWER FuelSmart", horsepower: 490, gvw: 49000, 
                fuelType: "Diesel", mileage: 4.1, availability: "Out of Stock"
            },
            {
                id: 7, brand: "Volvo", model: "FM 440", price: 65.80, 
                engine: "D13K Euro VI", horsepower: 440, gvw: 37000, 
                fuelType: "Diesel", mileage: 3.2, availability: "Limited"
            },
            {
                id: 8, brand: "BharatBenz", model: "3528C", price: 52.40, 
                engine: "OM 936", horsepower: 280, gvw: 35000, 
                fuelType: "Diesel", mileage: 3.9, availability: "In Stock"
            }
        ];
    }

    calculateEMIMock(amount, rate, months) {
        const monthlyRate = rate / (12 * 100);
        const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1);
        const totalAmount = emi * months;
        const totalInterest = totalAmount - amount;

        return {
            isValid: true,
            emi: emi,
            totalAmount: totalAmount,
            totalInterest: totalInterest,
            message: 'EMI calculated successfully'
        };
    }

    compareTrucksMock(truck1, truck2) {
        const differences = [];
        let recommendation = '';

        if (truck1.price !== truck2.price) {
            differences.push(`Price difference: ₹${Math.abs(truck1.price - truck2.price).toFixed(2)} Lakhs`);
        }

        if (truck1.horsepower !== truck2.horsepower) {
            differences.push(`Power difference: ${Math.abs(truck1.horsepower - truck2.horsepower)} HP`);
        }

        if (truck1.gvw !== truck2.gvw) {
            differences.push(`GVW difference: ${Math.abs(truck1.gvw - truck2.gvw).toLocaleString()} kg`);
        }

        if (truck1.price < truck2.price) {
            recommendation = `${truck1.brand} ${truck1.model} offers better value for money`;
        } else if (truck2.price < truck1.price) {
            recommendation = `${truck2.brand} ${truck2.model} offers better value for money`;
        } else {
            recommendation = 'Both trucks are equally priced, choose based on features and requirements';
        }

        return {
            isValid: true,
            truck1: truck1,
            truck2: truck2,
            differences: differences,
            recommendation: recommendation
        };
    }

    async simulateAPICall(endpoint, data) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Simulate occasional network errors (5% chance)
        if (Math.random() < 0.05) {
            throw new Error('Network error: Unable to connect to C++ backend server');
        }

        console.log(`[API] ${endpoint} called successfully`);
        return data;
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    getAvailabilityClass(availability) {
        switch (availability?.toLowerCase()) {
            case 'in stock': return 'in-stock';
            case 'limited': return 'limited';
            case 'out of stock': return 'out-of-stock';
            default: return 'in-stock';
        }
    }

    showError(container, message) {
        if (!container) return;
        container.innerHTML = `<div class="error-message">${message}</div>`;
        container.style.display = 'block';
    }

    getErrorHTML(message) {
        return `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <div class="error-content">
                    <h3>Connection Error</h3>
                    <p>${message}</p>
                    <div class="error-help">
                        <strong>To fix this:</strong>
                        <ol>
                            <li>Ensure the C++ backend server is compiled and running</li>
                            <li>Check that it's listening on localhost:8080</li>
                            <li>Refresh this page once the server is running</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize the application when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TruckDealershipAPI();
    console.log('🚛 TruckHub Frontend initialized');
    console.log('🔗 Ready to connect with C++ backend on localhost:8080');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && app) {
        // Refresh data when user returns to the page
        app.loadInitialData();
    }
});