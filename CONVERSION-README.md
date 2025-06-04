# Inventory Management System - JavaScript Version

## Overview
This project has been successfully converted from PHP to a modern JavaScript/Node.js application with full functionality preserved.

## ✅ Conversion Status: COMPLETE

All original PHP functionality has been converted to JavaScript:

### Backend (Node.js/Express)
- ✅ RESTful API architecture
- ✅ JWT authentication system
- ✅ MySQL database integration
- ✅ File upload handling
- ✅ Input validation & sanitization
- ✅ All CRUD operations

### Frontend (Modern JavaScript SPA)
- ✅ Single Page Application with Bootstrap 5
- ✅ Dynamic content rendering
- ✅ Form validation & error handling
- ✅ AJAX API integration
- ✅ Responsive design

### Features Implemented
- ✅ **Authentication**: JWT-based login/logout system
- ✅ **Dashboard**: Statistics and overview
- ✅ **Products**: Complete CRUD with categories and images
- ✅ **Sales**: Transaction recording and management
- ✅ **Categories**: Product categorization system
- ✅ **Users**: User management with roles and permissions
- ✅ **Media**: File upload and management system
- ✅ **Reports**: Sales analytics and reporting
- ✅ **Profile**: User profile management

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server running
- Modern web browser

### Installation Steps

1. **Initialize Database**
   ```bash
   # Run the setup batch file
   setup.bat
   
   # Or manually run:
   node scripts/init-db.js
   ```

2. **Start the Server**
   ```bash
   # Run the start batch file
   start.bat
   
   # Or manually run:
   npm start
   ```

3. **Access the Application**
   - Open your browser to: http://localhost:3000
   - Default login credentials:
     - Username: `admin`
     - Password: `admin`

### Configuration

The application uses environment variables defined in `.env`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=inventory_system
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
UPLOAD_DIR=./public/uploads
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Media
- `GET /api/media` - Get all media files
- `POST /api/media` - Upload new media file
- `DELETE /api/media/:id` - Delete media file

### Reports
- `GET /api/reports/sales` - Sales reports by date range
- `GET /api/reports/monthly` - Monthly sales data
- `GET /api/reports/daily` - Daily sales summaries

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/profile/upload` - Upload profile image

## File Structure

```
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
├── setup.bat                 # Database setup script
├── start.bat                 # Server start script
├── public/
│   ├── index.html           # Main frontend file
│   ├── demo.html            # Demo/status page
│   ├── css/                 # Stylesheets
│   ├── js/
│   │   └── app-clean.js     # Main frontend JavaScript
│   └── uploads/             # File upload directory
├── scripts/
│   └── init-db.js          # Database initialization
├── includes/
│   ├── database.js         # Database connection
│   ├── functions.js        # Utility functions
│   └── ...                 # Other utilities
├── auth.js                 # Authentication routes
├── product.js              # Product routes
├── sales.js                # Sales routes
├── categorie.js           # Category routes
├── users.js               # User routes
├── media.js               # Media routes
├── reports.js             # Reports routes
└── profile.js             # Profile routes
```

## Database Schema

The application creates the following tables:
- `users` - User accounts and authentication
- `products` - Product inventory
- `sales` - Sales transactions
- `categories` - Product categories
- `media` - Uploaded files
- `user_groups` - User roles and permissions

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- SQL injection prevention
- File upload security
- CORS configuration

## Development

For development with auto-restart:
```bash
npm run dev
```

## Troubleshooting

1. **Database Connection Issues**
   - Ensure MySQL server is running
   - Check database credentials in `.env`
   - Run `node scripts/init-db.js` to initialize

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Or kill the process using port 3000

3. **File Upload Issues**
   - Check upload directory permissions
   - Ensure `public/uploads/` directories exist

## Original PHP vs New JavaScript

| Component | PHP Version | JavaScript Version |
|-----------|-------------|-------------------|
| Backend | PHP with procedural code | Node.js/Express with modular architecture |
| Database | MySQL with mysqli | MySQL with mysql2 and connection pooling |
| Authentication | PHP sessions | JWT tokens |
| Frontend | Server-side rendering | Single Page Application |
| API | Mixed HTML/PHP responses | RESTful JSON API |
| File Uploads | PHP move_uploaded_file | Multer middleware |
| Validation | Server-side PHP | Client + Server validation |

## Support

The conversion is complete and all features are functional. The application maintains all original PHP functionality while providing a modern, scalable architecture.

For issues or questions, refer to the code comments and API documentation within the source files.
