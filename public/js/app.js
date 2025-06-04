class InventoryApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentUser = null;
        this.init();
    }

    init() {
        if (this.token) {
            this.showMainApp();
            this.loadUserProfile();
            this.showDashboard();
        } else {
            this.showLogin();
        }

        this.setupEventListeners();
    }    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Navigation event listeners
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.getAttribute('data-action');
                switch (action) {
                    case 'dashboard':
                        this.showDashboard();
                        break;
                    case 'products':
                        this.showProducts();
                        break;
                    case 'categories':
                        this.showCategories();
                        break;
                    case 'sales':
                        this.showSales();
                        break;
                    case 'users':
                        this.showUsers();
                        break;
                    case 'media':
                        this.showMedia();
                        break;
                    case 'reports':
                        this.showReports();
                        break;
                }
            }
        });

        // Add product form
        document.getElementById('addProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Edit product form
        document.getElementById('editProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProduct();
        });

        // Add category form
        document.getElementById('addCategoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });

        // Edit category form
        document.getElementById('editCategoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateCategory();
        });

        // Add sale form
        document.getElementById('addSaleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSale();
        });

        // Edit sale form
        document.getElementById('editSaleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateSale();
        });

        // Add user form
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUser();
        });

        // Edit user form
        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUser();
        });

        // Add media form
        document.getElementById('addMediaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMedia();
        });

        // Sale calculation
        document.getElementById('saleQuantity').addEventListener('input', this.calculateSaleTotal);
        document.getElementById('salePrice').addEventListener('input', this.calculateSaleTotal);
        
        // Edit sale calculation
        document.getElementById('editSaleQuantity').addEventListener('input', this.calculateEditSaleTotal);
        document.getElementById('editSalePrice').addEventListener('input', this.calculateEditSaleTotal);
    }

    async makeRequest(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const data = await this.makeRequest('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            this.token = data.token;
            this.currentUser = data.user;
            localStorage.setItem('token', this.token);

            this.showMainApp();
            this.showDashboard();
            this.hideError('loginError');
        } catch (error) {
            this.showError('loginError', error.message);
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        this.showLogin();
    }

    async loadUserProfile() {
        try {
            const user = await this.makeRequest('/api/profile');
            this.currentUser = user;
            document.getElementById('userName').textContent = user.name || user.username;
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }    showLogin() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('mainNav').style.display = 'none';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('products').style.display = 'none';
        document.getElementById('categories').style.display = 'none';
        document.getElementById('sales').style.display = 'none';
        document.getElementById('reports').style.display = 'none';
        document.getElementById('users').style.display = 'none';
        document.getElementById('media').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainNav').style.display = 'block';
    }

    async showDashboard() {
        this.hideAllSections();
        document.getElementById('dashboard').style.display = 'block';
        
        try {
            const stats = await this.makeRequest('/api/dashboard');
            document.getElementById('totalProducts').textContent = stats.total_products;
            document.getElementById('totalCategories').textContent = stats.total_categories;
            document.getElementById('dailySales').textContent = stats.daily_sales;
            document.getElementById('dailyRevenue').textContent = '$' + (stats.daily_revenue || 0).toFixed(2);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }

    async showProducts() {
        this.hideAllSections();
        document.getElementById('products').style.display = 'block';
        await this.loadProducts();
    }

    async showCategories() {
        this.hideAllSections();
        document.getElementById('categories').style.display = 'block';
        await this.loadCategories();
    }

    async showSales() {
        this.hideAllSections();
        document.getElementById('sales').style.display = 'block';
        await this.loadSales();
    }

    async showReports() {
        this.hideAllSections();
        document.getElementById('reports').style.display = 'block';
        this.setupReportsEventListeners();
    }

    async showUsers() {
        this.hideAllSections();
        document.getElementById('users').style.display = 'block';
        await this.loadUsers();
    }

    async showMedia() {
        this.hideAllSections();
        document.getElementById('media').style.display = 'block';
        await this.loadMedia();
    }

    setupReportsEventListeners() {
        const salesReportForm = document.getElementById('salesReportForm');
        if (salesReportForm) {
            salesReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateSalesReport();
            });
        }
    }

    async generateSalesReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            this.showError('reportsError', 'Please select both start and end dates');
            return;
        }

        try {
            const data = await this.makeRequest('/api/reports/sales-report', {
                method: 'POST',
                body: JSON.stringify({ startDate, endDate })
            });

            this.displaySalesReport(data);
        } catch (error) {
            console.error('Failed to generate sales report:', error);
            this.showError('reportsError', error.message);
        }
    }

    displaySalesReport(data) {
        const { sales, summary } = data;
        
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = `Sales Report (${summary.startDate} to ${summary.endDate})`;
        
        let content = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>$${summary.totalSales}</h4>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>${summary.totalQuantity}</h4>
                            <p>Items Sold</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>${sales.length}</h4>
                            <p>Total Sales</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sales.forEach(sale => {
            content += `
                <tr>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                    <td>${this.escapeHtml(sale.name || 'N/A')}</td>
                    <td>${sale.qty}</td>
                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                    <td>$${parseFloat(sale.total).toFixed(2)}</td>
                </tr>
            `;
        });

        content += `
                    </tbody>
                </table>
            </div>
        `;

        contentElement.innerHTML = content;
        resultsDiv.style.display = 'block';
    }

    async showMonthlySales() {
        try {
            const data = await this.makeRequest('/api/monthly-sales');
            this.displayReportResults('Monthly Sales Report', data);
        } catch (error) {
            console.error('Failed to load monthly sales:', error);
            this.showError('reportsError', 'Failed to load monthly sales report');
        }
    }

    async showDailySales() {
        try {
            const data = await this.makeRequest('/api/daily-sales');
            this.displayReportResults('Daily Sales Report', data);
        } catch (error) {
            console.error('Failed to load daily sales:', error);
            this.showError('reportsError', 'Failed to load daily sales report');
        }
    }

    async showAnalytics() {
        try {
            const data = await this.makeRequest('/api/reports/analytics');
            this.displayReportResults('Sales Analytics', data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showError('reportsError', 'Failed to load analytics report');
        }
    }

    displayReportResults(title, data) {
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = title;
        
        if (data.sales) {
            // Handle sales report data
            contentElement.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.sales.map(sale => `
                                <tr>
                                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                                    <td>${this.escapeHtml(sale.product_name || sale.name)}</td>
                                    <td>${sale.qty || sale.quantity}</td>
                                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                                    <td>$${(parseFloat(sale.price) * parseInt(sale.qty || sale.quantity)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            // Handle other data formats
            contentElement.innerHTML = '<p>No data available for this report.</p>';
        }
        
        resultsDiv.style.display = 'block';
    }

    async showProducts() {
        this.hideAllSections();
        document.getElementById('products').style.display = 'block';
        await this.loadProducts();
    }

    async showCategories() {
        this.hideAllSections();
        document.getElementById('categories').style.display = 'block';
        await this.loadCategories();
    }

    async showSales() {
        this.hideAllSections();
        document.getElementById('sales').style.display = 'block';
        await this.loadSales();
    }

    async showReports() {
        this.hideAllSections();
        document.getElementById('reports').style.display = 'block';
        this.setupReportsEventListeners();
    }

    async showUsers() {
        this.hideAllSections();
        document.getElementById('users').style.display = 'block';
        await this.loadUsers();
    }

    async showMedia() {
        this.hideAllSections();
        document.getElementById('media').style.display = 'block';
        await this.loadMedia();
    }

    setupReportsEventListeners() {
        const salesReportForm = document.getElementById('salesReportForm');
        if (salesReportForm) {
            salesReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateSalesReport();
            });
        }
    }

    async generateSalesReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            this.showError('reportsError', 'Please select both start and end dates');
            return;
        }

        try {
            const data = await this.makeRequest('/api/reports/sales-report', {
                method: 'POST',
                body: JSON.stringify({ startDate, endDate })
            });

            this.displaySalesReport(data);
        } catch (error) {
            console.error('Failed to generate sales report:', error);
            this.showError('reportsError', error.message);
        }
    }

    displaySalesReport(data) {
        const { sales, summary } = data;
        
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = `Sales Report (${summary.startDate} to ${summary.endDate})`;
        
        let content = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>$${summary.totalSales}</h4>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>${summary.totalQuantity}</h4>
                            <p>Items Sold</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>${sales.length}</h4>
                            <p>Total Sales</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sales.forEach(sale => {
            content += `
                <tr>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                    <td>${this.escapeHtml(sale.name || 'N/A')}</td>
                    <td>${sale.qty}</td>
                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                    <td>$${parseFloat(sale.total).toFixed(2)}</td>
                </tr>
            `;
        });

        content += `
                    </tbody>
                </table>
            </div>
        `;

        contentElement.innerHTML = content;
        resultsDiv.style.display = 'block';
    }

    async showMonthlySales() {
        try {
            const data = await this.makeRequest('/api/monthly-sales');
            this.displayReportResults('Monthly Sales Report', data);
        } catch (error) {
            console.error('Failed to load monthly sales:', error);
            this.showError('reportsError', 'Failed to load monthly sales report');
        }
    }

    async showDailySales() {
        try {
            const data = await this.makeRequest('/api/daily-sales');
            this.displayReportResults('Daily Sales Report', data);
        } catch (error) {
            console.error('Failed to load daily sales:', error);
            this.showError('reportsError', 'Failed to load daily sales report');
        }
    }

    async showAnalytics() {
        try {
            const data = await this.makeRequest('/api/reports/analytics');
            this.displayReportResults('Sales Analytics', data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showError('reportsError', 'Failed to load analytics report');
        }
    }

    displayReportResults(title, data) {
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = title;
        
        if (data.sales) {
            // Handle sales report data
            contentElement.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.sales.map(sale => `
                                <tr>
                                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                                    <td>${this.escapeHtml(sale.product_name || sale.name)}</td>
                                    <td>${sale.qty || sale.quantity}</td>
                                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                                    <td>$${(parseFloat(sale.price) * parseInt(sale.qty || sale.quantity)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            // Handle other data formats
            contentElement.innerHTML = '<p>No data available for this report.</p>';
        }
        
        resultsDiv.style.display = 'block';
    }

    async showProducts() {
        this.hideAllSections();
        document.getElementById('products').style.display = 'block';
        await this.loadProducts();
    }

    async showCategories() {
        this.hideAllSections();
        document.getElementById('categories').style.display = 'block';
        await this.loadCategories();
    }

    async showSales() {
        this.hideAllSections();
        document.getElementById('sales').style.display = 'block';
        await this.loadSales();
    }

    async showReports() {
        this.hideAllSections();
        document.getElementById('reports').style.display = 'block';
        this.setupReportsEventListeners();
    }

    async showUsers() {
        this.hideAllSections();
        document.getElementById('users').style.display = 'block';
        await this.loadUsers();
    }

    async showMedia() {
        this.hideAllSections();
        document.getElementById('media').style.display = 'block';
        await this.loadMedia();
    }

    setupReportsEventListeners() {
        const salesReportForm = document.getElementById('salesReportForm');
        if (salesReportForm) {
            salesReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateSalesReport();
            });
        }
    }

    async generateSalesReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            this.showError('reportsError', 'Please select both start and end dates');
            return;
        }

        try {
            const data = await this.makeRequest('/api/reports/sales-report', {
                method: 'POST',
                body: JSON.stringify({ startDate, endDate })
            });

            this.displaySalesReport(data);
        } catch (error) {
            console.error('Failed to generate sales report:', error);
            this.showError('reportsError', error.message);
        }
    }

    displaySalesReport(data) {
        const { sales, summary } = data;
        
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = `Sales Report (${summary.startDate} to ${summary.endDate})`;
        
        let content = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>$${summary.totalSales}</h4>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>${summary.totalQuantity}</h4>
                            <p>Items Sold</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>${sales.length}</h4>
                            <p>Total Sales</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sales.forEach(sale => {
            content += `
                <tr>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                    <td>${this.escapeHtml(sale.name || 'N/A')}</td>
                    <td>${sale.qty}</td>
                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                    <td>$${parseFloat(sale.total).toFixed(2)}</td>
                </tr>
            `;
        });

        content += `
                    </tbody>
                </table>
            </div>
        `;

        contentElement.innerHTML = content;
        resultsDiv.style.display = 'block';
    }

    async showMonthlySales() {
        try {
            const data = await this.makeRequest('/api/monthly-sales');
            this.displayReportResults('Monthly Sales Report', data);
        } catch (error) {
            console.error('Failed to load monthly sales:', error);
            this.showError('reportsError', 'Failed to load monthly sales report');
        }
    }

    async showDailySales() {
        try {
            const data = await this.makeRequest('/api/daily-sales');
            this.displayReportResults('Daily Sales Report', data);
        } catch (error) {
            console.error('Failed to load daily sales:', error);
            this.showError('reportsError', 'Failed to load daily sales report');
        }
    }

    async showAnalytics() {
        try {
            const data = await this.makeRequest('/api/reports/analytics');
            this.displayReportResults('Sales Analytics', data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showError('reportsError', 'Failed to load analytics report');
        }
    }

    displayReportResults(title, data) {
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = title;
        
        if (data.sales) {
            // Handle sales report data
            contentElement.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.sales.map(sale => `
                                <tr>
                                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                                    <td>${this.escapeHtml(sale.product_name || sale.name)}</td>
                                    <td>${sale.qty || sale.quantity}</td>
                                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                                    <td>$${(parseFloat(sale.price) * parseInt(sale.qty || sale.quantity)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            // Handle other data formats
            contentElement.innerHTML = '<p>No data available for this report.</p>';
        }
        
        resultsDiv.style.display = 'block';
    }

    async showProducts() {
        this.hideAllSections();
        document.getElementById('products').style.display = 'block';
        await this.loadProducts();
    }

    async showCategories() {
        this.hideAllSections();
        document.getElementById('categories').style.display = 'block';
        await this.loadCategories();
    }

    async showSales() {
        this.hideAllSections();
        document.getElementById('sales').style.display = 'block';
        await this.loadSales();
    }

    async showReports() {
        this.hideAllSections();
        document.getElementById('reports').style.display = 'block';
        this.setupReportsEventListeners();
    }

    async showUsers() {
        this.hideAllSections();
        document.getElementById('users').style.display = 'block';
        await this.loadUsers();
    }

    async showMedia() {
        this.hideAllSections();
        document.getElementById('media').style.display = 'block';
        await this.loadMedia();
    }

    setupReportsEventListeners() {
        const salesReportForm = document.getElementById('salesReportForm');
        if (salesReportForm) {
            salesReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateSalesReport();
            });
        }
    }

    async generateSalesReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            this.showError('reportsError', 'Please select both start and end dates');
            return;
        }

        try {
            const data = await this.makeRequest('/api/reports/sales-report', {
                method: 'POST',
                body: JSON.stringify({ startDate, endDate })
            });

            this.displaySalesReport(data);
        } catch (error) {
            console.error('Failed to generate sales report:', error);
            this.showError('reportsError', error.message);
        }
    }

    displaySalesReport(data) {
        const { sales, summary } = data;
        
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = `Sales Report (${summary.startDate} to ${summary.endDate})`;
        
        let content = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>$${summary.totalSales}</h4>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>${summary.totalQuantity}</h4>
                            <p>Items Sold</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>${sales.length}</h4>
                            <p>Total Sales</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sales.forEach(sale => {
            content += `
                <tr>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                    <td>${this.escapeHtml(sale.name || 'N/A')}</td>
                    <td>${sale.qty}</td>
                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                    <td>$${parseFloat(sale.total).toFixed(2)}</td>
                </tr>
            `;
        });

        content += `
                    </tbody>
                </table>
            </div>
        `;

        contentElement.innerHTML = content;
        resultsDiv.style.display = 'block';
    }

    async showMonthlySales() {
        try {
            const data = await this.makeRequest('/api/monthly-sales');
            this.displayReportResults('Monthly Sales Report', data);
        } catch (error) {
            console.error('Failed to load monthly sales:', error);
            this.showError('reportsError', 'Failed to load monthly sales report');
        }
    }

    async showDailySales() {
        try {
            const data = await this.makeRequest('/api/daily-sales');
            this.displayReportResults('Daily Sales Report', data);
        } catch (error) {
            console.error('Failed to load daily sales:', error);
            this.showError('reportsError', 'Failed to load daily sales report');
        }
    }

    async showAnalytics() {
        try {
            const data = await this.makeRequest('/api/reports/analytics');
            this.displayReportResults('Sales Analytics', data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showError('reportsError', 'Failed to load analytics report');
        }
    }

    displayReportResults(title, data) {
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = title;
        
        if (data.sales) {
            // Handle sales report data
            contentElement.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.sales.map(sale => `
                                <tr>
                                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                                    <td>${this.escapeHtml(sale.product_name || sale.name)}</td>
                                    <td>${sale.qty || sale.quantity}</td>
                                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                                    <td>$${(parseFloat(sale.price) * parseInt(sale.qty || sale.quantity)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            // Handle other data formats
            contentElement.innerHTML = '<p>No data available for this report.</p>';
        }
        
        resultsDiv.style.display = 'block';
    }

    async showProducts() {
        this.hideAllSections();
        document.getElementById('products').style.display = 'block';
        await this.loadProducts();
    }

    async showCategories() {
        this.hideAllSections();
        document.getElementById('categories').style.display = 'block';
        await this.loadCategories();
    }

    async showSales() {
        this.hideAllSections();
        document.getElementById('sales').style.display = 'block';
        await this.loadSales();
    }

    async showReports() {
        this.hideAllSections();
        document.getElementById('reports').style.display = 'block';
        this.setupReportsEventListeners();
    }

    async showUsers() {
        this.hideAllSections();
        document.getElementById('users').style.display = 'block';
        await this.loadUsers();
    }

    async showMedia() {
        this.hideAllSections();
        document.getElementById('media').style.display = 'block';
        await this.loadMedia();
    }

    setupReportsEventListeners() {
        const salesReportForm = document.getElementById('salesReportForm');
        if (salesReportForm) {
            salesReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateSalesReport();
            });
        }
    }

    async generateSalesReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            this.showError('reportsError', 'Please select both start and end dates');
            return;
        }

        try {
            const data = await this.makeRequest('/api/reports/sales-report', {
                method: 'POST',
                body: JSON.stringify({ startDate, endDate })
            });

            this.displaySalesReport(data);
        } catch (error) {
            console.error('Failed to generate sales report:', error);
            this.showError('reportsError', error.message);
        }
    }

    displaySalesReport(data) {
        const { sales, summary } = data;
        
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = `Sales Report (${summary.startDate} to ${summary.endDate})`;
        
        let content = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>$${summary.totalSales}</h4>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>${summary.totalQuantity}</h4>
                            <p>Items Sold</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>${sales.length}</h4>
                            <p>Total Sales</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sales.forEach(sale => {
            content += `
                <tr>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                    <td>${this.escapeHtml(sale.name || 'N/A')}</td>
                    <td>${sale.qty}</td>
                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                    <td>$${parseFloat(sale.total).toFixed(2)}</td>
                </tr>
            `;
        });

        content += `
                    </tbody>
                </table>
            </div>
        `;

        contentElement.innerHTML = content;
        resultsDiv.style.display = 'block';
    }

    async showMonthlySales() {
        try {
            const data = await this.makeRequest('/api/monthly-sales');
            this.displayReportResults('Monthly Sales Report', data);
        } catch (error) {
            console.error('Failed to load monthly sales:', error);
            this.showError('reportsError', 'Failed to load monthly sales report');
        }
    }

    async showDailySales() {
        try {
            const data = await this.makeRequest('/api/daily-sales');
            this.displayReportResults('Daily Sales Report', data);
        } catch (error) {
            console.error('Failed to load daily sales:', error);
            this.showError('reportsError', 'Failed to load daily sales report');
        }
    }

    async showAnalytics() {
        try {
            const data = await this.makeRequest('/api/reports/analytics');
            this.displayReportResults('Sales Analytics', data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showError('reportsError', 'Failed to load analytics report');
        }
    }

    displayReportResults(title, data) {
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = title;
        
        if (data.sales) {
            // Handle sales report data
            contentElement.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.sales.map(sale => `
                                <tr>
                                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                                    <td>${this.escapeHtml(sale.product_name || sale.name)}</td>
                                    <td>${sale.qty || sale.quantity}</td>
                                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                                    <td>$${(parseFloat(sale.price) * parseInt(sale.qty || sale.quantity)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            // Handle other data formats
            contentElement.innerHTML = '<p>No data available for this report.</p>';
        }
        
        resultsDiv.style.display = 'block';
    }

    async showProducts() {
        this.hideAllSections();
        document.getElementById('products').style.display = 'block';
        await this.loadProducts();
    }

    async showCategories() {
        this.hideAllSections();
        document.getElementById('categories').style.display = 'block';
        await this.loadCategories();
    }

    async showSales() {
        this.hideAllSections();
        document.getElementById('sales').style.display = 'block';
        await this.loadSales();
    }

    async showReports() {
        this.hideAllSections();
        document.getElementById('reports').style.display = 'block';
        this.setupReportsEventListeners();
    }

    async showUsers() {
        this.hideAllSections();
        document.getElementById('users').style.display = 'block';
        await this.loadUsers();
    }

    async showMedia() {
        this.hideAllSections();
        document.getElementById('media').style.display = 'block';
        await this.loadMedia();
    }

    setupReportsEventListeners() {
        const salesReportForm = document.getElementById('salesReportForm');
        if (salesReportForm) {
            salesReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateSalesReport();
            });
        }
    }

    async generateSalesReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            this.showError('reportsError', 'Please select both start and end dates');
            return;
        }

        try {
            const data = await this.makeRequest('/api/reports/sales-report', {
                method: 'POST',
                body: JSON.stringify({ startDate, endDate })
            });

            this.displaySalesReport(data);
        } catch (error) {
            console.error('Failed to generate sales report:', error);
            this.showError('reportsError', error.message);
        }
    }

    displaySalesReport(data) {
        const { sales, summary } = data;
        
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = `Sales Report (${summary.startDate} to ${summary.endDate})`;
        
        let content = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>$${summary.totalSales}</h4>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>${summary.totalQuantity}</h4>
                            <p>Items Sold</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>${sales.length}</h4>
                            <p>Total Sales</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sales.forEach(sale => {
            content += `
                <tr>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                    <td>${this.escapeHtml(sale.name || 'N/A')}</td>
                    <td>${sale.qty}</td>
                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                    <td>$${parseFloat(sale.total).toFixed(2)}</td>
                </tr>
            `;
        });

        content += `
                    </tbody>
                </table>
            </div>
        `;

        contentElement.innerHTML = content;
        resultsDiv.style.display = 'block';
    }

    async showMonthlySales() {
        try {
            const data = await this.makeRequest('/api/monthly-sales');
            this.displayReportResults('Monthly Sales Report', data);
        } catch (error) {
            console.error('Failed to load monthly sales:', error);
            this.showError('reportsError', 'Failed to load monthly sales report');
        }
    }

    async showDailySales() {
        try {
            const data = await this.makeRequest('/api/daily-sales');
            this.displayReportResults('Daily Sales Report', data);
        } catch (error) {
            console.error('Failed to load daily sales:', error);
            this.showError('reportsError', 'Failed to load daily sales report');
        }
    }

    async showAnalytics() {
        try {
            const data = await this.makeRequest('/api/reports/analytics');
            this.displayReportResults('Sales Analytics', data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showError('reportsError', 'Failed to load analytics report');
        }
    }

    displayReportResults(title, data) {
        const resultsDiv = document.getElementById('reportsResults');
        const titleElement = document.getElementById('reportsTitle');
        const contentElement = document.getElementById('reportsContent');

        titleElement.textContent = title;
        
        if (data.sales) {
            // Handle sales report data
            contentElement.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.sales.map(sale => `
                                <tr>
                                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                                    <td>${this.escapeHtml(sale.product_name || sale.name)}</td>
                                    <td>${sale.qty || sale.quantity}</td>
                                    <td>$${parseFloat(sale.price).toFixed(2)}</td>
                                    <td>$${(parseFloat(sale.price) * parseInt(sale.qty || sale.quantity)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            // Handle other data formats
            contentElement.innerHTML = '<p>No data available for this report.</p>';
        }
        
        resultsDiv.style.display = 'block';
    }

    async showProducts() {
        this.hideAllSections();
        document.getElementById('products').style.display = 'block';
        await this.loadProducts();
    }

    async showCategories() {
        this.hideAllSections();
        document.getElementById('categories').style.display = 'block';
        await this.loadCategories();
    }

    async showSales() {
        this.hideAllSections();
        document.getElementById('sales').style.display = 'block';
        await this.loadSales();
    }

    async showReports() {
        this.hideAllSections();
        document.getElementById('reports').style.display = 'block';
        this.setupReportsEventListeners();
    }

    async showUsers() {
        this.hideAllSections();
        document.getElementById('users').style.display = 'block';
        await this.loadUsers();
    }

    async showMedia() {
        this.hideAllSections();
        document.getElementById('media').style.display = 'block';
        await this.loadMedia();
    }

    // ============ PRODUCT CRUD OPERATIONS ============
    
    async showAddProductModal() {
        // Load categories for the dropdown
        try {
            const data = await this.makeRequest('/api/categories');
            const categories = data.data || data;
            const categorySelect = document.getElementById('productCategory');
            
            categorySelect.innerHTML = '<option value="">Select Category</option>' +
                categories.map(cat => `<option value="${cat.id}">${this.escapeHtml(cat.name)}</option>`).join('');
            
            const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
            modal.show();
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.showError('productsError', 'Failed to load categories');
        }
    }

    async addProduct() {
        const formData = new FormData();
        formData.append('name', document.getElementById('productName').value);
        formData.append('categorie_id', document.getElementById('productCategory').value);
        formData.append('quantity', document.getElementById('productQuantity').value);
        formData.append('buy_price', document.getElementById('productBuyPrice').value);
        formData.append('sale_price', document.getElementById('productSalePrice').value);
        
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await this.makeRequest('/api/products', {
                method: 'POST',
                body: formData,
                headers: {} // Remove Content-Type to allow multipart
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            modal.hide();
            document.getElementById('addProductForm').reset();
            
            this.showSuccess('productsSuccess', 'Product added successfully');
            await this.loadProducts();
        } catch (error) {
            console.error('Failed to add product:', error);
            this.showError('addProductError', error.message);
        }
    }

    async editProduct(id) {
        try {
            const data = await this.makeRequest(`/api/products/${id}`);
            const product = data.data || data;
            
            // Populate edit form
            document.getElementById('editProductId').value = product.id;
            document.getElementById('editProductName').value = product.name;
            document.getElementById('editProductCategory').value = product.categorie_id;
            document.getElementById('editProductQuantity').value = product.quantity;
            document.getElementById('editProductBuyPrice').value = product.buy_price;
            document.getElementById('editProductSalePrice').value = product.sale_price;
            
            // Load categories for the dropdown
            const categoriesData = await this.makeRequest('/api/categories');
            const categories = categoriesData.data || categoriesData;
            const categorySelect = document.getElementById('editProductCategory');
            
            categorySelect.innerHTML = categories.map(cat => 
                `<option value="${cat.id}" ${cat.id == product.categorie_id ? 'selected' : ''}>${this.escapeHtml(cat.name)}</option>`
            ).join('');
            
            const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
            modal.show();
        } catch (error) {
            console.error('Failed to load product:', error);
            this.showError('productsError', error.message);
        }
    }

    async updateProduct() {
        const id = document.getElementById('editProductId').value;
        const formData = new FormData();
        formData.append('name', document.getElementById('editProductName').value);
        formData.append('categorie_id', document.getElementById('editProductCategory').value);
        formData.append('quantity', document.getElementById('editProductQuantity').value);
        formData.append('buy_price', document.getElementById('editProductBuyPrice').value);
        formData.append('sale_price', document.getElementById('editProductSalePrice').value);
        
        const imageFile = document.getElementById('editProductImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await this.makeRequest(`/api/products/${id}`, {
                method: 'PUT',
                body: formData,
                headers: {} // Remove Content-Type for multipart
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
            modal.hide();
            
            this.showSuccess('productsSuccess', 'Product updated successfully');
            await this.loadProducts();
        } catch (error) {
            console.error('Failed to update product:', error);
            this.showError('editProductError', error.message);
        }
    }

    async deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await this.makeRequest(`/api/products/${id}`, {
                    method: 'DELETE'
                });
                
                this.showSuccess('productsSuccess', 'Product deleted successfully');
                await this.loadProducts();
            } catch (error) {
                console.error('Failed to delete product:', error);
                this.showError('productsError', error.message);
            }
        }
    }

    // ============ CATEGORY CRUD OPERATIONS ============
    
    async showAddCategoryModal() {
        const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
        modal.show();
    }

    async addCategory() {
        const name = document.getElementById('categoryName').value;

        try {
            await this.makeRequest('/api/categories', {
                method: 'POST',
                body: JSON.stringify({ name })
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
            modal.hide();
            document.getElementById('addCategoryForm').reset();
            
            this.showSuccess('categoriesSuccess', 'Category added successfully');
            await this.loadCategories();
        } catch (error) {
            console.error('Failed to add category:', error);
            this.showError('addCategoryError', error.message);
        }
    }

    async editCategory(id) {
        try {
            const data = await this.makeRequest(`/api/categories/${id}`);
            const category = data.data || data;
            
            document.getElementById('editCategoryId').value = category.id;
            document.getElementById('editCategoryName').value = category.name;
            
            const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
            modal.show();
        } catch (error) {
            console.error('Failed to load category:', error);
            this.showError('categoriesError', error.message);
        }
    }

    async updateCategory() {
        const id = document.getElementById('editCategoryId').value;
        const name = document.getElementById('editCategoryName').value;

        try {
            await this.makeRequest(`/api/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name })
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
            modal.hide();
            
            this.showSuccess('categoriesSuccess', 'Category updated successfully');
            await this.loadCategories();
        } catch (error) {
            console.error('Failed to update category:', error);
            this.showError('editCategoryError', error.message);
        }
    }

    async deleteCategory(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                await this.makeRequest(`/api/categories/${id}`, {
                    method: 'DELETE'
                });
                
                this.showSuccess('categoriesSuccess', 'Category deleted successfully');
                await this.loadCategories();
            } catch (error) {
                console.error('Failed to delete category:', error);
                this.showError('categoriesError', error.message);
            }
        }
    }

    // ============ SALES CRUD OPERATIONS ============
    
    async showAddSaleModal() {
        try {
            // Load products for the dropdown
            const data = await this.makeRequest('/api/products');
            const products = data.data || data;
            const productSelect = document.getElementById('saleProduct');
            
            productSelect.innerHTML = '<option value="">Select Product</option>' +
                products.map(product => `<option value="${product.id}" data-price="${product.sale_price}">${this.escapeHtml(product.name)} - $${parseFloat(product.sale_price).toFixed(2)}</option>`).join('');
            
            const modal = new bootstrap.Modal(document.getElementById('addSaleModal'));
            modal.show();
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('salesError', 'Failed to load products');
        }
    }

    async addSale() {
        const productId = document.getElementById('saleProduct').value;
        const quantity = document.getElementById('saleQuantity').value;
        const price = document.getElementById('salePrice').value;

        try {
            await this.makeRequest('/api/sales', {
                method: 'POST',
                body: JSON.stringify({
                    product_id: parseInt(productId),
                    qty: parseInt(quantity),
                    price: parseFloat(price)
                })
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('addSaleModal'));
            modal.hide();
            document.getElementById('addSaleForm').reset();
            
            this.showSuccess('salesSuccess', 'Sale added successfully');
            await this.loadSales();
        } catch (error) {
            console.error('Failed to add sale:', error);
            this.showError('addSaleError', error.message);
        }
    }

    async editSale(id) {
        try {
            const data = await this.makeRequest(`/api/sales/${id}`);
            const sale = data.data || data;
            
            // Load products for the dropdown
            const productsData = await this.makeRequest('/api/products');
            const products = productsData.data || productsData;
            const productSelect = document.getElementById('editSaleProduct');
            
            productSelect.innerHTML = products.map(product => 
                `<option value="${product.id}" data-price="${product.sale_price}" ${product.id == sale.product_id ? 'selected' : ''}>${this.escapeHtml(product.name)} - $${parseFloat(product.sale_price).toFixed(2)}</option>`
            ).join('');
            
            document.getElementById('editSaleId').value = sale.id;
            document.getElementById('editSaleQuantity').value = sale.qty;
            document.getElementById('editSalePrice').value = sale.price;
            
            const modal = new bootstrap.Modal(document.getElementById('editSaleModal'));
            modal.show();
        } catch (error) {
            console.error('Failed to load sale:', error);
            this.showError('salesError', error.message);
        }
    }

    async updateSale() {
        const id = document.getElementById('editSaleId').value;
        const productId = document.getElementById('editSaleProduct').value;
        const quantity = document.getElementById('editSaleQuantity').value;
        const price = document.getElementById('editSalePrice').value;

        try {
            await this.makeRequest(`/api/sales/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    product_id: parseInt(productId),
                    qty: parseInt(quantity),
                    price: parseFloat(price)
                })
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('editSaleModal'));
            modal.hide();
            
            this.showSuccess('salesSuccess', 'Sale updated successfully');
            await this.loadSales();
        } catch (error) {
            console.error('Failed to update sale:', error);
            this.showError('editSaleError', error.message);
        }
    }

    async deleteSale(id) {
        if (confirm('Are you sure you want to delete this sale?')) {
            try {
                await this.makeRequest(`/api/sales/${id}`, {
                    method: 'DELETE'
                });
                
                this.showSuccess('salesSuccess', 'Sale deleted successfully');
                await this.loadSales();
            } catch (error) {
                console.error('Failed to delete sale:', error);
                this.showError('salesError', error.message);
            }
        }
    }

    // ============ USER CRUD OPERATIONS ============
    
    async showAddUserModal() {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    }

    async addUser() {
        const formData = new FormData();
        formData.append('name', document.getElementById('userName').value);
        formData.append('username', document.getElementById('userUsername').value);
        formData.append('password', document.getElementById('userPassword').value);
        formData.append('user_level', document.getElementById('userLevel').value);
        
        const imageFile = document.getElementById('userImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await this.makeRequest('/api/users', {
                method: 'POST',
                body: formData,
                headers: {} // Remove Content-Type for multipart
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            document.getElementById('addUserForm').reset();
            
            this.showSuccess('usersSuccess', 'User added successfully');
            await this.loadUsers();
        } catch (error) {
            console.error('Failed to add user:', error);
            this.showError('addUserError', error.message);
        }
    }

    async editUser(id) {
        try {
            const data = await this.makeRequest(`/api/users/${id}`);
            const user = data.data || data;
            
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUserName').value = user.name;
            document.getElementById('editUserUsername').value = user.username;
            document.getElementById('editUserLevel').value = user.user_level;
            document.getElementById('editUserStatus').value = user.status;
            
            const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
            modal.show();
        } catch (error) {
            console.error('Failed to load user:', error);
            this.showError('usersError', error.message);
        }
    }

    async updateUser() {
        const id = document.getElementById('editUserId').value;
        const formData = new FormData();
        formData.append('name', document.getElementById('editUserName').value);
        formData.append('username', document.getElementById('editUserUsername').value);
        formData.append('user_level', document.getElementById('editUserLevel').value);
        formData.append('status', document.getElementById('editUserStatus').value);
        
        const password = document.getElementById('editUserPassword').value;
        if (password) {
            formData.append('password', password);
        }
        
        const imageFile = document.getElementById('editUserImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await this.makeRequest(`/api/users/${id}`, {
                method: 'PUT',
                body: formData,
                headers: {} // Remove Content-Type for multipart
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            
            this.showSuccess('usersSuccess', 'User updated successfully');
            await this.loadUsers();
        } catch (error) {
            console.error('Failed to update user:', error);
            this.showError('editUserError', error.message);
        }
    }

    async deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await this.makeRequest(`/api/users/${id}`, {
                    method: 'DELETE'
                });
                
                this.showSuccess('usersSuccess', 'User deleted successfully');
                await this.loadUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
                this.showError('usersError', error.message);
            }
        }
    }

    // ============ MEDIA CRUD OPERATIONS ============
    
    async loadMedia() {
        try {
            const data = await this.makeRequest('/api/media');
            const media = data.data || data;
            const tbody = document.getElementById('mediaTableBody');
            
            tbody.innerHTML = media.map(item => `
                <tr>
                    <td>${item.id}</td>
                    <td>
                        <img src="/uploads/media/${item.file_name}" class="media-thumbnail" alt="${this.escapeHtml(item.file_name)}" style="width: 50px; height: 50px; object-fit: cover;">
                    </td>
                    <td>${this.escapeHtml(item.file_name)}</td>
                    <td>${item.file_type}</td>
                    <td>${new Date(item.upload_date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteMedia(${item.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Failed to load media:', error);
            this.showError('mediaError', 'Failed to load media');
        }
    }

    async showAddMediaModal() {
        const modal = new bootstrap.Modal(document.getElementById('addMediaModal'));
        modal.show();
    }

    async addMedia() {
        const formData = new FormData();
        const fileInput = document.getElementById('mediaFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showError('addMediaError', 'Please select a file');
            return;
        }
        
        formData.append('file', file);

        try {
            await this.makeRequest('/api/media', {
                method: 'POST',
                body: formData,
                headers: {} // Remove Content-Type for multipart
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('addMediaModal'));
            modal.hide();
            document.getElementById('addMediaForm').reset();
            
            this.showSuccess('mediaSuccess', 'Media uploaded successfully');
            await this.loadMedia();
        } catch (error) {
            console.error('Failed to upload media:', error);
            this.showError('addMediaError', error.message);
        }
    }

    async deleteMedia(id) {
        if (confirm('Are you sure you want to delete this media file?')) {
            try {
                await this.makeRequest(`/api/media/${id}`, {
                    method: 'DELETE'
                });
                
                this.showSuccess('mediaSuccess', 'Media deleted successfully');
                await this.loadMedia();
            } catch (error) {
                console.error('Failed to delete media:', error);
                this.showError('mediaError', error.message);
            }
        }
    }

    // ============ UTILITY METHODS ============
      calculateSaleTotal() {
        const quantity = parseFloat(document.getElementById('saleQuantity').value) || 0;
        const price = parseFloat(document.getElementById('salePrice').value) || 0;
        const total = quantity * price;
        
        const totalElement = document.getElementById('saleTotal');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    }

    calculateEditSaleTotal() {
        const quantity = parseFloat(document.getElementById('editSaleQuantity').value) || 0;
        const price = parseFloat(document.getElementById('editSalePrice').value) || 0;
        const total = quantity * price;
        
        const totalElement = document.getElementById('editSaleTotal');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = 'alert alert-success';
            element.style.display = 'block';
            setTimeout(() => {
                element.style.display = 'none';
                element.className = 'alert alert-danger';
            }, 3000);
        }
    }

    hideError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }
}

// Global functions for navigation
function showDashboard() {
    app.showDashboard();
}

function showProducts() {
    app.showProducts();
}

function showCategories() {
    app.showCategories();
}

function showSales() {
    app.showSales();
}

function showReports() {
    app.showReports();
}

function showUsers() {
    app.showUsers();
}

function showMedia() {
    app.showMedia();
}

function showAddProductModal() {
    app.showAddProductModal();
}

function showAddCategoryModal() {
    app.showAddCategoryModal();
}

function showAddSaleModal() {
    app.showAddSaleModal();
}

function showAddUserModal() {
    app.showAddUserModal();
}

function showAddMediaModal() {
    app.showAddMediaModal();
}

function editUser(id) {
    app.editUser(id);
}

function editProduct(id) {
    app.editProduct(id);
}

function editCategory(id) {
    app.editCategory(id);
}

function editSale(id) {
    app.editSale(id);
}

function deleteUser(id) {
    app.deleteUser(id);
}

function deleteProduct(id) {
    app.deleteProduct(id);
}

function deleteCategory(id) {
    app.deleteCategory(id);
}

function deleteSale(id) {
    app.deleteSale(id);
}

function deleteMedia(id) {
    app.deleteMedia(id);
}

function showMonthlySales() {
    app.showMonthlySales();
}

function showDailySales() {
    app.showDailySales();
}

function showAnalytics() {
    app.showAnalytics();
}

function logout() {
    app.logout();
}

// Initialize the app
const app = new InventoryApp();
