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
                    case 'logout':
                        this.logout();
                        break;
                }
            }
        });

        // Product selection for sales
        document.addEventListener('change', (e) => {
            if (e.target.id === 'saleProduct') {
                const selectedOption = e.target.selectedOptions[0];
                if (selectedOption && selectedOption.dataset.price) {
                    document.getElementById('salePrice').value = selectedOption.dataset.price;
                    this.calculateSaleTotal();
                }
            }
        });

        // Sale calculation
        document.addEventListener('input', (e) => {
            if (e.target.id === 'saleQuantity' || e.target.id === 'salePrice') {
                this.calculateSaleTotal();
            }
        });
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
            if (error.message.includes('token') || error.message.includes('Unauthorized')) {
                this.logout();
            }
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
            const stats = await this.makeRequest('/api/home/dashboard');
            document.getElementById('totalProducts').textContent = stats.total_products || 0;
            document.getElementById('totalCategories').textContent = stats.total_categories || 0;
            document.getElementById('dailySales').textContent = stats.daily_sales || 0;
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

    async showUsers() {
        this.hideAllSections();
        document.getElementById('users').style.display = 'block';
        await this.loadUsers();
    }    async showMedia() {
        this.hideAllSections();
        document.getElementById('media').style.display = 'block';
        await this.loadMedia();
    }

    hideAllSections() {
        const sections = ['dashboard', 'products', 'categories', 'sales', 'users', 'media', 'reports'];
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
            
            tbody.innerHTML = products.map(product => `
                <tr>
                    <td>
                        ${product.image ? 
                            `<img src="/api/media/file/${product.image}" class="product-image" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;">` : 
                            '<i class="fas fa-image text-muted"></i>'
                        }
                    </td>
                    <td>${this.escapeHtml(product.name)}</td>
                    <td>${this.escapeHtml(product.categorie || 'N/A')}</td>
                    <td><span class="badge ${product.quantity > 10 ? 'bg-success' : product.quantity > 0 ? 'bg-warning' : 'bg-danger'}">${product.quantity}</span></td>
                    <td>$${parseFloat(product.buy_price || 0).toFixed(2)}</td>
                    <td>$${parseFloat(product.sale_price || 0).toFixed(2)}</td>
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
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('productsError', 'Failed to load products');
        }
    }

    async loadCategories() {
        try {
            const data = await this.makeRequest('/api/categories');
            const categories = data.categories || data;
            const tbody = document.getElementById('categoriesTableBody');
            
            tbody.innerHTML = categories.map(category => `
                <tr>
                    <td>${category.id}</td>
                    <td>${this.escapeHtml(category.name)}</td>
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
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.showError('categoriesError', 'Failed to load categories');
        }
    }

    async loadSales() {
        try {
            const data = await this.makeRequest('/api/sales');
            const sales = data.sales || data;
            const tbody = document.getElementById('salesTableBody');
            
            tbody.innerHTML = sales.map(sale => `
                <tr>
                    <td>${sale.id}</td>
                    <td>${this.escapeHtml(sale.name || 'N/A')}</td>
                    <td>${sale.qty}</td>
                    <td>$${parseFloat(sale.price || 0).toFixed(2)}</td>
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
        } catch (error) {
            console.error('Failed to load sales:', error);
            this.showError('salesError', 'Failed to load sales');
        }
    }

    async loadUsers() {
        try {
            const data = await this.makeRequest('/api/users');
            const users = data.users || data;
            const tbody = document.getElementById('usersTableBody');
            
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${this.escapeHtml(user.name)}</td>
                    <td>${this.escapeHtml(user.username)}</td>
                    <td>${this.escapeHtml(user.group_name || 'N/A')}</td>
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
        } catch (error) {
            console.error('Failed to load users:', error);
            this.showError('usersError', 'Failed to load users');
        }
    }

    async loadMedia() {
        try {
            const data = await this.makeRequest('/api/media');
            const media = data.media || data;
            const tbody = document.getElementById('mediaTableBody');
            
            tbody.innerHTML = media.map(file => `
                <tr>
                    <td>${file.id}</td>
                    <td>
                        <img src="/api/media/file/${file.file_name}" class="media-thumbnail" alt="${file.file_name}" style="width: 50px; height: 50px; object-fit: cover;">
                    </td>
                    <td>${this.escapeHtml(file.file_name)}</td>
                    <td>${file.file_type}</td>
                    <td>${this.formatFileSize(file.file_size)}</td>
                    <td>${new Date(file.upload_date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteMedia(${file.id})">
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

    async showAddProductModal() {
        try {
            const data = await this.makeRequest('/api/categories');
            const categories = data.categories || data;
            const select = document.getElementById('productCategory');
            select.innerHTML = '<option value="">Select Category</option>' + 
                categories.map(cat => `<option value="${cat.id}">${this.escapeHtml(cat.name)}</option>`).join('');

            // Load media for selection
            const mediaData = await this.makeRequest('/api/media');
            const mediaFiles = mediaData.media || mediaData;
            const mediaSelect = document.getElementById('productMedia');
            if (mediaSelect) {
                mediaSelect.innerHTML = '<option value="">No Image</option>' + 
                    mediaFiles.map(media => `<option value="${media.id}">${this.escapeHtml(media.file_name)}</option>`).join('');
            }
        } catch (error) {
            console.error('Failed to load categories/media:', error);
        }

        const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
        modal.show();
    }

    async addProduct() {
        const name = document.getElementById('productName').value;
        const categorie_id = document.getElementById('productCategory').value;
        const quantity = document.getElementById('productQuantity').value;
        const buy_price = document.getElementById('productBuyPrice').value;
        const sale_price = document.getElementById('productSalePrice').value;
        const media_id = document.getElementById('productMedia')?.value || 0;

        try {
            await this.makeRequest('/api/products', {
                method: 'POST',
                body: JSON.stringify({ 
                    name, 
                    categorie_id: parseInt(categorie_id), 
                    quantity: parseInt(quantity), 
                    buy_price: parseFloat(buy_price), 
                    sale_price: parseFloat(sale_price),
                    media_id: parseInt(media_id) || 0
                })
            });

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
        try {
            const data = await this.makeRequest('/api/products');
            const products = data.products || data;
            const select = document.getElementById('saleProduct');
            select.innerHTML = '<option value="">Select Product</option>' + 
                products.filter(product => product.quantity > 0).map(product => 
                    `<option value="${product.id}" data-price="${product.sale_price}">${this.escapeHtml(product.name)} (Stock: ${product.quantity})</option>`
                ).join('');
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
        document.getElementById('saleTotal').textContent = total.toFixed(2);
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

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            console.error(`Error element ${elementId} not found. Message: ${message}`);
        }
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }    showSuccess(message) {
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

    // User management methods
    async editUser(id) {
        try {
            // First, fetch the user data
            const response = await fetch(`/api/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            const data = await response.json();
            const user = data.user;
            
            // Populate the edit form
            document.getElementById('editUserName').value = user.name;
            document.getElementById('editUserUsername').value = user.username;
            document.getElementById('editUserLevel').value = user.user_level;
            document.getElementById('editUserStatus').value = user.status;
            document.getElementById('editUserId').value = user.id;
            
            // Show the edit modal
            const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
            modal.show();
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            this.showError('userError', 'Failed to load user data');
        }
    }

    async updateUser() {
        const id = document.getElementById('editUserId').value;
        const name = document.getElementById('editUserName').value.trim();
        const username = document.getElementById('editUserUsername').value.trim();
        const user_level = document.getElementById('editUserLevel').value;
        const status = document.getElementById('editUserStatus').value;
        const password = document.getElementById('editUserPassword').value.trim();

        if (!name || !username) {
            this.showError('editUserError', 'Name and username are required');
            return;
        }

        try {
            const requestBody = { name, username, user_level, status };
            if (password) {
                requestBody.password = password;
            }

            const response = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }

            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            document.getElementById('editUserForm').reset();
            await this.loadUsers();
            this.showSuccess('User updated successfully!');
        } catch (error) {
            console.error('Failed to update user:', error);
            this.showError('editUserError', error.message);
        }
    }

    async deleteUser(id) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            await this.loadUsers();
            this.showSuccess('User deleted successfully!');
        } catch (error) {
            console.error('Failed to delete user:', error);
            this.showError('userError', error.message);
        }
    }

    async deleteMedia(id) {
        if (!confirm('Are you sure you want to delete this media file? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/media/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete media');
            }

            await this.loadMedia();
            this.showSuccess('Media deleted successfully!');
        } catch (error) {
            console.error('Failed to delete media:', error);
            this.showError('mediaError', error.message);
        }
    }

    showAddUserModal() {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    }

    async addUser() {
        const name = document.getElementById('userName').value.trim();
        const username = document.getElementById('userUsername').value.trim();
        const password = document.getElementById('userPassword').value.trim();
        const user_level = document.getElementById('userLevel').value;

        if (!name || !username || !password) {
            this.showError('addUserError', 'All fields are required');
            return;
        }

        try {
            await this.makeRequest('/api/users', {
                method: 'POST',
                body: JSON.stringify({ name, username, password, user_level, status: '1' })
            });

            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            document.getElementById('addUserForm').reset();
            await this.loadUsers();
            this.showSuccess('User added successfully!');
        } catch (error) {
            console.error('Failed to add user:', error);
            this.showError('addUserError', error.message);
        }
    }

    showAddMediaModal() {
        const modal = new bootstrap.Modal(document.getElementById('addMediaModal'));
        modal.show();
    }

    async addMedia() {
        const fileInput = document.getElementById('mediaFile');
        const file = fileInput.files[0];

        if (!file) {
            this.showError('addMediaError', 'Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            await fetch('/api/media', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            bootstrap.Modal.getInstance(document.getElementById('addMediaModal')).hide();
            document.getElementById('addMediaForm').reset();
            await this.loadMedia();
            this.showSuccess('Media uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload media:', error);
            this.showError('addMediaError', error.message);
        }
    }

    // Reports functionality
    showReports() {
        this.hideAllSections();
        document.getElementById('reports').style.display = 'block';
    }
}


// Global functions for navigation and actions
function showDashboard() { app.showDashboard(); }
function showProducts() { app.showProducts(); }
function showCategories() { app.showCategories(); }
function showSales() { app.showSales(); }
function showUsers() { app.showUsers(); }
function showMedia() { app.showMedia(); }
function showReports() { app.showReports(); }
function showAddProductModal() { app.showAddProductModal(); }
function showAddCategoryModal() { app.showAddCategoryModal(); }
function showAddSaleModal() { app.showAddSaleModal(); }
function showAddUserModal() { app.showAddUserModal(); }
function showAddMediaModal() { app.showAddMediaModal(); }
function logout() { app.logout(); }

// Add event listeners for forms
document.addEventListener('DOMContentLoaded', function() {
    // Add Product Form
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            app.addProduct();
        });
    }

    // Add Category Form
    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            app.addCategory();
        });
    }

    // Add Sale Form
    const addSaleForm = document.getElementById('addSaleForm');
    if (addSaleForm) {
        addSaleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            app.addSale();
        });
    }

    // Add User Form
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            app.addUser();
        });
    }

    // Edit User Form
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            app.updateUser();
        });
    }

    // Add Media Form
    const addMediaForm = document.getElementById('addMediaForm');
    if (addMediaForm) {
        addMediaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            app.addMedia();
        });
    }
});

// Placeholder functions for edit/delete operations
function editProduct(id) {
    console.log('Edit product:', id);
    // TODO: Implement edit functionality
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        // TODO: Implement delete functionality
        console.log('Delete product:', id);
    }
}

function editCategory(id) {
    console.log('Edit category:', id);
    // TODO: Implement edit functionality
}

function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        // TODO: Implement delete functionality
        console.log('Delete category:', id);
    }
}

function editSale(id) {
    console.log('Edit sale:', id);
    // TODO: Implement edit functionality
}

function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale?')) {
        // TODO: Implement delete functionality
        console.log('Delete sale:', id);
    }
}

function editUser(id) {
    app.editUser(id);
}

function deleteUser(id) {
    app.deleteUser(id);
}

function deleteMedia(id) {
    app.deleteMedia(id);
}

// Initialize the app
const app = new InventoryApp();
