const express = require('express');
const router = express.Router();
const { Database } = require('./includes/database');
const { SQL } = require('./includes/sql');
const { Functions } = require('./includes/functions');
const { Session } = require('./includes/session');

const db = new Database();
const sql = new SQL();
const functions = new Functions();
const session = new Session();

// GET /api/products - Get all products with category and media information
router.get('/', async (req, res) => {
  try {
    // Check user permission level (equivalent to page_require_level(2))
    if (!req.user || req.user.user_level < 2) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all products with joined data (equivalent to join_product_table())
    const query = `
      SELECT p.id, p.name, p.quantity, p.buy_price, p.sale_price, p.date,
             c.name as categorie, m.file_name as image, p.media_id
      FROM products p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN media m ON m.id = p.media_id
      ORDER BY p.id ASC
    `;
    
    const products = await db.query(query);
    
    res.json({
      success: true,
      products: products,
      message: session.getMsg()
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching products' 
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 2) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const productId = parseInt(req.params.id);
    const query = `
      SELECT p.*, c.name as categorie_name, m.file_name as image
      FROM products p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN media m ON m.id = p.media_id
      WHERE p.id = ?
    `;
    
    const products = await db.query(query, [productId]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({
      success: true,
      product: products[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching product' 
    });
  }
});

// POST /api/products - Add new product
router.post('/', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 2) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, categorie_id, quantity, buy_price, sale_price, media_id } = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'categorie_id', 'quantity', 'buy_price', 'sale_price'];
    const errors = functions.validateFields(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors 
      });
    }

    // Clean and escape data
    const cleanName = functions.removeJunk(name);
    const cleanCategorieId = parseInt(categorie_id);
    const cleanQuantity = parseInt(quantity);
    const cleanBuyPrice = parseFloat(buy_price);
    const cleanSalePrice = parseFloat(sale_price);
    const cleanMediaId = media_id || 0;
    const date = functions.makeDate();

    const query = `
      INSERT INTO products (name, quantity, buy_price, sale_price, categorie_id, media_id, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `;
    
    await db.query(query, [
      cleanName, 
      cleanQuantity, 
      cleanBuyPrice, 
      cleanSalePrice, 
      cleanCategorieId, 
      cleanMediaId, 
      date
    ]);
    
    session.setMsg('s', 'Product added successfully');
    res.json({
      success: true,
      message: 'Product added successfully'
    });
  } catch (error) {
    console.error('Error adding product:', error);
    session.setMsg('d', 'Sorry, failed to add product');
    res.status(500).json({ 
      success: false, 
      message: 'Error adding product' 
    });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 2) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const productId = parseInt(req.params.id);
    const { name, categorie_id, quantity, buy_price, sale_price, media_id } = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'categorie_id', 'quantity', 'buy_price', 'sale_price'];
    const errors = functions.validateFields(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors 
      });
    }

    // Clean and escape data
    const cleanName = functions.removeJunk(name);
    const cleanCategorieId = parseInt(categorie_id);
    const cleanQuantity = parseInt(quantity);
    const cleanBuyPrice = parseFloat(buy_price);
    const cleanSalePrice = parseFloat(sale_price);
    const cleanMediaId = media_id || 0;

    const query = `
      UPDATE products 
      SET name = ?, quantity = ?, buy_price = ?, sale_price = ?, 
          categorie_id = ?, media_id = ?
      WHERE id = ?
    `;
    
    const result = await db.query(query, [
      cleanName, 
      cleanQuantity, 
      cleanBuyPrice, 
      cleanSalePrice, 
      cleanCategorieId, 
      cleanMediaId,
      productId
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    session.setMsg('s', 'Product updated successfully');
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    session.setMsg('d', 'Sorry, failed to update product');
    res.status(500).json({ 
      success: false, 
      message: 'Error updating product' 
    });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const productId = parseInt(req.params.id);
    
    // Check if product exists
    const existingProduct = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (existingProduct.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Delete the product
    await db.query('DELETE FROM products WHERE id = ?', [productId]);
    
    session.setMsg('s', 'Product deleted successfully');
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    session.setMsg('d', 'Sorry, failed to delete product');
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting product' 
    });
  }
});

module.exports = router;
