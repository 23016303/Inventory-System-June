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
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Add product form
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addProduct();
            });
        }

        // Add category form
        const addCategoryForm = document.getElementById('addCategoryForm');
        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCategory();
            });
        }

        // Add sale form
        const addSaleForm = document.getElementById('addSaleForm');
        if (addSaleForm) {
            addSaleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addSale();
            });
        }

        // Sale calculation
        const saleQuantity = document.getElementById('saleQuantity');
        const salePrice = document.getElementById('salePrice');
        if (saleQuantity) {
            saleQuantity.addEventListener('input', () => this.calculateSaleTotal());
        }
        if (salePrice) {
            salePrice.addEventListener('input', () => this.calculateSaleTotal());
        }

        // Product selection in sale form
        const saleProduct = document.getElementById('saleProduct');
        if (saleProduct) {
            saleProduct.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                if (selectedOption && selectedOption.dataset.price) {
                    document.getElementById('salePrice').value = selectedOption.dataset.price;
                    this.calculateSaleTotal();
                }
            });
        }
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
            const data = await this.makeRequest('/api/auth/login', {
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
            const data = await this.makeRequest('/api/auth/profile');
            this.currentUser = data.user;
            this.updateUserDisplay();
        } catch (error) {
            console.error('Failed to load user profile:', error);
            this.logout();
        }
    }

    updateUserDisplay() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.name || this.currentUser.username;
        }
    }

    showLogin() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('mainNav').style.display = 'none';
        this.hideAllSections();
    }

    showMainApp() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainNav').style.display = 'block';
    }

    async showDashboard() {
        this.hideAllSections();
        document.getElementById('dashboard').style.display = 'block';
        
        try {
            const data = await this.makeRequest('/api/home/dashboard');
            const stats = data.stats;
            
            document.getElementById('totalProducts').textContent = stats.total_products;
            document.getElementById('totalCategories').textContent = stats.total_categories;
            document.getElementById('dailySales').textContent = stats.daily_sales;
            document.getElementById('dailyRevenue').textContent = '$' + (stats.daily_revenue || 0).toFixed(2);
            
            // Load recent products
            if (data.recent_products) {
                this.displayRecentProducts(data.recent_products);
            }
            
            // Load low stock products
            if (data.low_stock_products) {
                this.displayLowStockProducts(data.low_stock_products);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }

    displayRecentProducts(products) {
        const container = document.getElementById('recentProducts');
        if (container) {
            container.innerHTML = products.map(product => `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title">${product.name}</h6>
                            <p class="card-text">
                                <small class="text-muted">Stock: ${product.quantity}</small><br>
                                <small class="text-muted">Price: $${parseFloat(product.sale_price).toFixed(2)}</small>
                            </p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    displayLowStockProducts(products) {
        const container = document.getElementById('lowStockProducts');
        if (container) {
            container.innerHTML = products.map(product => `
                <div class="alert alert-warning mb-2">
                    <strong>${product.name}</strong> - Only ${product.quantity} left in stock
                </div>
            `).join('') || '<div class="text-muted">No low stock items</div>';
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

    async showUsers() {
        this.hideAllSections();
        const usersSection = document.getElementById('users');
        if (usersSection) {
            usersSection.style.display = 'block';
            await this.loadUsers();
        }
    }

    async showMedia() {
        this.hideAllSections();
        const mediaSection = document.getElementById('media');
        if (mediaSection) {
            mediaSection.style.display = 'block';
            await this.loadMedia();
        }
    }

    hideAllSections() {
        const sections = ['dashboard', 'products', 'categories', 'sales', 'users', 'media'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    async loadProducts() {
        try {
            const data = await this.makeRequest('/api/products');
            const products = data.products || data;
            const tbody = document.getElementById('productsTableBody');
            
            if (tbody) {
                tbody.innerHTML = products.map((product, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            ${product.image ? 
                                `<img src="/uploads/products/${product.image}" class="product-image" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;">` : 
                                '<i class="fas fa-image text-muted"></i>'
                            }
                        </td>
                        <td>${product.name}</td>
                        <td>${product.categorie || 'N/A'}</td>
                        <td><span class="badge ${product.quantity > 10 ? 'bg-success' : product.quantity > 0 ? 'bg-warning' : 'bg-danger'}">${product.quantity}</span></td>
                        <td>$${parseFloat(product.buy_price).toFixed(2)}</td>
                        <td>$${parseFloat(product.sale_price).toFixed(2)}</td>
                        <td>${new Date(product.date).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    async loadCategories() {
        try {
            const data = await this.makeRequest('/api/categories');
            const categories = data.categories || data;
            const tbody = document.getElementById('categoriesTableBody');
            
            if (tbody) {
                tbody.innerHTML = categories.map(category => `
                    <tr>
                        <td>${category.id}</td>
                        <td>${category.name}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editCategory(${category.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadSales() {
        try {
            const data = await this.makeRequest('/api/sales');
            const sales = data.sales || data;
            const tbody = document.getElementById('salesTableBody');
            
            if (tbody) {
                tbody.innerHTML = sales.map((sale, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${sale.name || 'N/A'}</td>
                        <td>${sale.qty}</td>
                        <td>$${parseFloat(sale.price).toFixed(2)}</td>
                        <td>${new Date(sale.date).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editSale(${sale.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteSale(${sale.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load sales:', error);
        }
    }

    async loadUsers() {
        try {
            const data = await this.makeRequest('/api/users');
            const users = data.users || data;
            const tbody = document.getElementById('usersTableBody');
            
            if (tbody) {
                tbody.innerHTML = users.map((user, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${user.name}</td>
                        <td>${user.username}</td>
                        <td>${user.group_name || 'Level ' + user.user_level}</td>
                        <td>
                            <span class="badge ${user.status == 1 ? 'bg-success' : 'bg-danger'}">
                                ${user.status == 1 ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${user.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async loadMedia() {
        try {
            const data = await this.makeRequest('/api/media');
            const mediaFiles = data.media || data;
            const tbody = document.getElementById('mediaTableBody');
            
            if (tbody) {
                tbody.innerHTML = mediaFiles.map((media, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <img src="/uploads/products/${media.file_name}" 
                                 alt="${media.file_name}" 
                                 style="width: 80px; height: 80px; object-fit: cover;">
                        </td>
                        <td>${media.file_name}</td>
                        <td>${(media.file_size / 1024).toFixed(2)} KB</td>
                        <td>${new Date(media.upload_date).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteMedia(${media.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load media:', error);
        }
    }

    async showAddProductModal() {
        // Load categories for the dropdown
        try {
            const data = await this.makeRequest('/api/categories');
            const categories = data.categories || data;
            const select = document.getElementById('productCategory');
            if (select) {
                select.innerHTML = '<option value="">Select Category</option>' + 
                    categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }

        const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
        modal.show();
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
            formData.append('file', imageFile);
        }

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add product');
            }

            bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
            document.getElementById('addProductForm').reset();
            await this.loadProducts();
            this.showSuccess('Product added successfully!');
        } catch (error) {
            console.error('Failed to add product:', error);
            this.showError('addProductError', error.message);
        }
    }

    showAddCategoryModal() {
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

            bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
            document.getElementById('addCategoryForm').reset();
            await this.loadCategories();
            this.showSuccess('Category added successfully!');
        } catch (error) {
            console.error('Failed to add category:', error);
            this.showError('addCategoryError', error.message);
        }
    }

    async showAddSaleModal() {
        // Load products for the dropdown
        try {
            const data = await this.makeRequest('/api/products');
            const products = data.products || data;
            const select = document.getElementById('saleProduct');
            if (select) {
                select.innerHTML = '<option value="">Select Product</option>' + 
                    products.filter(product => product.quantity > 0)
                           .map(product => `<option value="${product.id}" data-price="${product.sale_price}">${product.name} (Stock: ${product.quantity})</option>`)
                           .join('');
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        }

        const modal = new bootstrap.Modal(document.getElementById('addSaleModal'));
        modal.show();
    }

    calculateSaleTotal() {
        const quantity = parseFloat(document.getElementById('saleQuantity').value) || 0;
        const price = parseFloat(document.getElementById('salePrice').value) || 0;
        const total = quantity * price;
        const totalElement = document.getElementById('saleTotal');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    }

    async addSale() {
        const product_id = document.getElementById('saleProduct').value;
        const quantity = document.getElementById('saleQuantity').value;
        const price = document.getElementById('salePrice').value;
        const total = parseFloat(quantity) * parseFloat(price);

        try {
            await this.makeRequest('/api/sales', {
                method: 'POST',
                body: JSON.stringify({ 
                    product_id: parseInt(product_id), 
                    quantity: parseInt(quantity), 
                    price: parseFloat(price),
                    total: total
                })
            });

            bootstrap.Modal.getInstance(document.getElementById('addSaleModal')).hide();
            document.getElementById('addSaleForm').reset();
            document.getElementById('saleTotal').textContent = '0.00';
            await this.loadSales();
            this.showSuccess('Sale recorded successfully!');
        } catch (error) {
            console.error('Failed to add sale:', error);
            this.showError('addSaleError', error.message);
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    showSuccess(message) {
        // Create a temporary success alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alert);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 3000);
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

function logout() {
    app.logout();
}

// Placeholder functions for edit/delete operations
function editProduct(id) {
    console.log('Edit product:', id);
    // TODO: Implement edit functionality
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        console.log('Delete product:', id);
        // TODO: Implement delete functionality
    }
}

function editCategory(id) {
    console.log('Edit category:', id);
    // TODO: Implement edit functionality
}

function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        console.log('Delete category:', id);
        // TODO: Implement delete functionality
    }
}

function editSale(id) {
    console.log('Edit sale:', id);
    // TODO: Implement edit functionality
}

function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale?')) {
        console.log('Delete sale:', id);
        // TODO: Implement delete functionality
    }
}

function editUser(id) {
    console.log('Edit user:', id);
    // TODO: Implement edit functionality
}

function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        console.log('Delete user:', id);
        // TODO: Implement delete functionality
    }
}

function deleteMedia(id) {
    if (confirm('Are you sure you want to delete this media file?')) {
        console.log('Delete media:', id);
        // TODO: Implement delete functionality
    }
}

// Initialize the app
const app = new InventoryApp();
