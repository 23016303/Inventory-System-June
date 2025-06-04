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

// GET /api/sales - Get all sales with product information
router.get('/', async (req, res) => {
  try {
    // Check user permission level (equivalent to page_require_level(3))
    if (!req.user || req.user.user_level < 3) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all sales with joined product data (equivalent to find_all_sale())
    const query = `
      SELECT s.id, s.qty, s.price, s.date,
             p.name
      FROM sales s
      LEFT JOIN products p ON p.id = s.product_id
      ORDER BY s.date DESC
    `;
    
    const sales = await db.query(query);
    
    res.json({
      success: true,
      sales: sales,
      message: session.getMsg()
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sales' 
    });
  }
});

// GET /api/sales/:id - Get single sale
router.get('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 3) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const saleId = parseInt(req.params.id);
    const query = `
      SELECT s.*, p.name as product_name
      FROM sales s
      LEFT JOIN products p ON p.id = s.product_id
      WHERE s.id = ?
    `;
    
    const sales = await db.query(query, [saleId]);
    
    if (sales.length === 0) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    res.json({
      success: true,
      sale: sales[0]
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sale' 
    });
  }
});

// POST /api/sales - Add new sale
router.post('/', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 3) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { product_id, quantity, price, total } = req.body;
    
    // Validate required fields
    const requiredFields = ['product_id', 'quantity', 'price', 'total'];
    const errors = functions.validateFields(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors 
      });
    }

    // Clean and validate data
    const cleanProductId = parseInt(product_id);
    const cleanQuantity = parseInt(quantity);
    const cleanTotal = parseFloat(total);
    const date = functions.makeDate();

    // Check if product exists and has enough quantity
    const productQuery = 'SELECT quantity FROM products WHERE id = ?';
    const products = await db.query(productQuery, [cleanProductId]);
    
    if (products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    if (products[0].quantity < cleanQuantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient product quantity' 
      });
    }

    // Insert sale record
    const insertQuery = `
      INSERT INTO sales (product_id, qty, price, date)
      VALUES (?, ?, ?, ?)
    `;
    
    await db.query(insertQuery, [cleanProductId, cleanQuantity, cleanTotal, date]);
    
    // Update product quantity (equivalent to update_product_qty())
    const updateQuery = 'UPDATE products SET quantity = quantity - ? WHERE id = ?';
    await db.query(updateQuery, [cleanQuantity, cleanProductId]);
    
    session.setMsg('s', 'Sale added successfully');
    res.json({
      success: true,
      message: 'Sale added successfully'
    });
  } catch (error) {
    console.error('Error adding sale:', error);
    session.setMsg('d', 'Sorry, failed to add sale');
    res.status(500).json({ 
      success: false, 
      message: 'Error adding sale' 
    });
  }
});

// PUT /api/sales/:id - Update sale
router.put('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 3) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const saleId = parseInt(req.params.id);
    const { product_id, quantity, price, total } = req.body;
    
    // Get current sale data
    const currentSale = await db.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (currentSale.length === 0) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    const oldQuantity = currentSale[0].qty;
    const oldProductId = currentSale[0].product_id;
    
    // Validate required fields
    const requiredFields = ['product_id', 'quantity', 'price', 'total'];
    const errors = functions.validateFields(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors 
      });
    }

    const cleanProductId = parseInt(product_id);
    const cleanQuantity = parseInt(quantity);
    const cleanTotal = parseFloat(total);

    // Revert old quantity if product changed or quantity changed
    if (oldProductId !== cleanProductId || oldQuantity !== cleanQuantity) {
      await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [oldQuantity, oldProductId]);
      
      // Check new product availability
      const productQuery = 'SELECT quantity FROM products WHERE id = ?';
      const products = await db.query(productQuery, [cleanProductId]);
      
      if (products.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }
      
      if (products[0].quantity < cleanQuantity) {
        // Revert the quantity change we just made
        await db.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [oldQuantity, oldProductId]);
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient product quantity' 
        });
      }
      
      // Apply new quantity
      await db.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [cleanQuantity, cleanProductId]);
    }

    // Update sale record
    const updateQuery = `
      UPDATE sales 
      SET product_id = ?, qty = ?, price = ?
      WHERE id = ?
    `;
    
    await db.query(updateQuery, [cleanProductId, cleanQuantity, cleanTotal, saleId]);
    
    session.setMsg('s', 'Sale updated successfully');
    res.json({
      success: true,
      message: 'Sale updated successfully'
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    session.setMsg('d', 'Sorry, failed to update sale');
    res.status(500).json({ 
      success: false, 
      message: 'Error updating sale' 
    });
  }
});

// DELETE /api/sales/:id - Delete sale
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const saleId = parseInt(req.params.id);
    
    // Get sale data to revert product quantity
    const sale = await db.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (sale.length === 0) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Revert product quantity
    await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', 
      [sale[0].qty, sale[0].product_id]);
    
    // Delete the sale
    await db.query('DELETE FROM sales WHERE id = ?', [saleId]);
    
    session.setMsg('s', 'Sale deleted successfully');
    res.json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sale:', error);
    session.setMsg('d', 'Sorry, failed to delete sale');
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting sale' 
    });
  }
});

// GET /api/sales/search/products - Search products for sale (AJAX endpoint)
router.get('/search/products', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 3) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { term } = req.query;
    
    if (!term || term.length < 2) {
      return res.json({ products: [] });
    }

    const query = `
      SELECT id, name, quantity, sale_price
      FROM products 
      WHERE name LIKE ? AND quantity > 0
      ORDER BY name ASC
      LIMIT 10
    `;
    
    const products = await db.query(query, [`%${term}%`]);
    
    res.json({
      success: true,
      products: products
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching products' 
    });
  }
});

module.exports = router;
