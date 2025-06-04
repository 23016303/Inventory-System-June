const express = require('express');
const router = express.Router();
const db = require('./includes/database');
const { verifyToken, requireLevel } = require('./includes/session');
const { remove_junk } = require('./includes/functions');

/**
 * Admin Dashboard Route - replaces admin.php
 * Provides admin dashboard data with statistics and recent activity
 */
router.get('/', verifyToken, requireLevel(1), async (req, res) => {
    try {
        // Get dashboard statistics
        const stats = await getDashboardStats();
        
        // Get recent activity data
        const recentData = await getRecentActivity();
        
        res.json({
            success: true,
            data: {
                statistics: stats,
                recent_activity: recentData
            }
        });
        
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading admin dashboard'
        });
    }
});

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
    try {
        // Count totals for each entity
        const [categoriesCount] = await db.execute('SELECT COUNT(*) as total FROM categories');
        const [productsCount] = await db.execute('SELECT COUNT(*) as total FROM products');
        const [salesCount] = await db.execute('SELECT COUNT(*) as total FROM sales');
        const [usersCount] = await db.execute('SELECT COUNT(*) as total FROM users');
        
        return {
            categories: categoriesCount[0].total,
            products: productsCount[0].total,
            sales: salesCount[0].total,
            users: usersCount[0].total
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return {
            categories: 0,
            products: 0,
            sales: 0,
            users: 0
        };
    }
}

/**
 * Get recent activity data
 */
async function getRecentActivity() {
    try {
        // Get highest selling products (equivalent to find_higest_saleing_product)
        const [topProducts] = await db.execute(`
            SELECT 
                p.name,
                SUM(s.qty) as total_sold,
                SUM(s.qty * s.price) as total_revenue
            FROM sales s
            JOIN products p ON s.product_id = p.id
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 10
        `);
        
        // Get recent products added (equivalent to find_recent_product_added)
        const [recentProducts] = await db.execute(`
            SELECT 
                id,
                name,
                quantity,
                buy_price,
                sale_price,
                date
            FROM products
            ORDER BY date DESC
            LIMIT 5
        `);
        
        // Get recent sales (equivalent to find_recent_sale_added)
        const [recentSales] = await db.execute(`
            SELECT 
                s.id,
                s.qty,
                s.price,
                s.date,
                p.name as product_name,
                u.name as user_name
            FROM sales s
            JOIN products p ON s.product_id = p.id
            JOIN users u ON s.user_id = u.id
            ORDER BY s.date DESC
            LIMIT 5
        `);
        
        return {
            top_selling_products: topProducts.map(product => ({
                name: remove_junk(product.name),
                total_sold: parseInt(product.total_sold),
                total_revenue: parseFloat(product.total_revenue).toFixed(2)
            })),
            recent_products: recentProducts.map(product => ({
                id: product.id,
                name: remove_junk(product.name),
                quantity: parseInt(product.quantity),
                buy_price: parseFloat(product.buy_price).toFixed(2),
                sale_price: parseFloat(product.sale_price).toFixed(2),
                date: product.date
            })),
            recent_sales: recentSales.map(sale => ({
                id: sale.id,
                product_name: remove_junk(sale.product_name),
                qty: parseInt(sale.qty),
                price: parseFloat(sale.price).toFixed(2),
                total: (sale.qty * sale.price).toFixed(2),
                user_name: remove_junk(sale.user_name),
                date: sale.date
            }))
        };
    } catch (error) {
        console.error('Error getting recent activity:', error);
        return {
            top_selling_products: [],
            recent_products: [],
            recent_sales: []
        };
    }
}

module.exports = router;
