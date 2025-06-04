# Modern Inventory Management System

A modern web-based inventory management system built with Node.js, Express, and MySQL.

## Features

- User authentication with JWT tokens
- Dashboard with real-time statistics
- Product management (Add, View, Edit, Delete)
- Category management
- Sales tracking and reporting
- Image upload for products
- Responsive design with Bootstrap 5
- Modern UI with Font Awesome icons

## Prerequisites

- Node.js (version 14 or higher)
- MySQL Server
- Web browser

## Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env` file and update database credentials if needed
   - Default settings work with standard MySQL installation

3. **Set up MySQL database:**
   - Ensure MySQL server is running
   - The application will create the database automatically

4. **Initialize the database:**
   ```bash
   npm run init-db
   ```

5. **Start the application:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application:**
   - Open your web browser
   - Navigate to `http://localhost:3000`

## Default Login Credentials

- **Username:** admin
- **Password:** admin

**Important:** Please change the default password after first login.

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile (requires authentication)

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add new product (supports file upload)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Add new category

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Record new sale

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## File Structure

```
├── server.js              # Main server file
├── package.json           # Node.js dependencies
├── .env                   # Environment configuration
├── scripts/
│   └── init-db.js        # Database initialization script
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── main.css      # Custom styles
│   ├── js/
│   │   └── app.js        # Frontend JavaScript
│   └── uploads/          # File upload directory
└── README.md             # This file
```

## Usage

### Adding Products
1. Navigate to Products section
2. Click "Add Product" button
3. Fill in product details
4. Optionally upload an image
5. Select a category
6. Submit the form

### Managing Categories
1. Go to Categories section
2. Click "Add Category" to create new categories
3. View existing categories in the table

### Recording Sales
1. Access Sales section
2. Click "Add Sale" button
3. Select product from dropdown
4. Enter quantity and price
5. Submit to record the sale

### Dashboard
- View real-time statistics
- Monitor daily sales and revenue
- Track total products and categories

## Troubleshooting

### Database Connection Issues
- Ensure MySQL server is running
- Check database credentials in `.env` file
- Verify database user has proper permissions

### Port Already in Use
- Change the PORT in `.env` file
- Or kill the process using the port: `netstat -ano | findstr :3000`

### File Upload Issues
- Ensure `public/uploads/products/` directory exists
- Check file permissions
- Verify file size limits

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the project repository.
