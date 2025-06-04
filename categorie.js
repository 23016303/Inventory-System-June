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

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    // Check user permission level (equivalent to page_require_level(1))
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all categories (equivalent to find_all('categories'))
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const categories = await db.query(query);
    
    res.json({
      success: true,
      categories: categories,
      message: session.getMsg()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories' 
    });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const categoryId = parseInt(req.params.id);
    const query = 'SELECT * FROM categories WHERE id = ?';
    const categories = await db.query(query, [categoryId]);
    
    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    res.json({
      success: true,
      category: categories[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category' 
    });
  }
});

// POST /api/categories - Add new category
router.post('/', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name } = req.body;
    
    // Validate required fields
    const requiredFields = ['name'];
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
    
    if (!cleanName || cleanName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name cannot be empty' 
      });
    }

    // Check if category already exists
    const existingCategory = await db.query('SELECT id FROM categories WHERE name = ?', [cleanName]);
    if (existingCategory.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category already exists' 
      });
    }

    const query = 'INSERT INTO categories (name) VALUES (?)';
    await db.query(query, [cleanName]);
    
    session.setMsg('s', 'Successfully added new category');
    res.json({
      success: true,
      message: 'Category added successfully'
    });
  } catch (error) {
    console.error('Error adding category:', error);
    session.setMsg('d', 'Sorry, failed to add category');
    res.status(500).json({ 
      success: false, 
      message: 'Error adding category' 
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const categoryId = parseInt(req.params.id);
    const { name } = req.body;
    
    // Validate required fields
    const requiredFields = ['name'];
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
    
    if (!cleanName || cleanName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name cannot be empty' 
      });
    }

    // Check if category exists
    const existingCategory = await db.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (existingCategory.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if name already exists for another category
    const duplicateCategory = await db.query('SELECT id FROM categories WHERE name = ? AND id != ?', [cleanName, categoryId]);
    if (duplicateCategory.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name already exists' 
      });
    }

    const query = 'UPDATE categories SET name = ? WHERE id = ?';
    await db.query(query, [cleanName, categoryId]);
    
    session.setMsg('s', 'Category updated successfully');
    res.json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    session.setMsg('d', 'Sorry, failed to update category');
    res.status(500).json({ 
      success: false, 
      message: 'Error updating category' 
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const categoryId = parseInt(req.params.id);
    
    // Check if category exists
    const existingCategory = await db.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (existingCategory.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Check if category is being used by products
    const productsUsingCategory = await db.query('SELECT id FROM products WHERE categorie_id = ?', [categoryId]);
    if (productsUsingCategory.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete category - it is being used by products' 
      });
    }
    
    // Delete the category
    await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    
    session.setMsg('s', 'Category deleted successfully');
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    session.setMsg('d', 'Sorry, failed to delete category');
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting category' 
    });
  }
});

module.exports = router;
