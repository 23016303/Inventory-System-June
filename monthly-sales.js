const express = require('express');
const router = express.Router();
const db = require('./includes/database');
const { verifyToken, requireLevel } = require('./includes/session');
const { remove_junk } = require('./includes/functions');

/**
 * Monthly Sales Route - replaces monthly_sales.php
 * Displays monthly sales data for the current year
 */
router.get('/', verifyToken, requireLevel(3), async (req, res) => {
    try {
        const year = new Date().getFullYear();
        
        // Get monthly sales data - equivalent to monthlySales() function
        const query = `
            SELECT 
                p.name,
                SUM(s.qty) as qty,
                SUM(s.price * s.qty) as total_saleing_price,
                DATE_FORMAT(s.date, '%Y-%m') as date
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id
            WHERE YEAR(s.date) = ?
            GROUP BY p.id, DATE_FORMAT(s.date, '%Y-%m')
            ORDER BY s.date DESC
        `;
        
        const [results] = await db.execute(query, [year]);
        
        // Format results for frontend
        const sales = results.map((sale, index) => ({
            id: index + 1,
            name: remove_junk(sale.name),
            qty: parseInt(sale.qty),
            total_saleing_price: parseFloat(sale.total_saleing_price).toFixed(2),
            date: sale.date
        }));
        
        res.json({
            success: true,
            data: {
                sales: sales,
                year: year,
                total_records: sales.length
            }
        });
        
    } catch (error) {
        console.error('Monthly sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly sales data'
        });
    }
});

/**
 * Get monthly sales for specific year
 */
router.get('/:year', verifyToken, requireLevel(3), async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        
        if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid year provided'
            });
        }
        
        const query = `
            SELECT 
                p.name,
                SUM(s.qty) as qty,
                SUM(s.price * s.qty) as total_saleing_price,
                DATE_FORMAT(s.date, '%Y-%m') as date
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id
            WHERE YEAR(s.date) = ?
            GROUP BY p.id, DATE_FORMAT(s.date, '%Y-%m')
            ORDER BY s.date DESC
        `;
        
        const [results] = await db.execute(query, [year]);
        
        const sales = results.map((sale, index) => ({
            id: index + 1,
            name: remove_junk(sale.name),
            qty: parseInt(sale.qty),
            total_saleing_price: parseFloat(sale.total_saleing_price).toFixed(2),
            date: sale.date
        }));
        
        res.json({
            success: true,
            data: {
                sales: sales,
                year: year,
                total_records: sales.length
            }
        });
        
    } catch (error) {
        console.error('Monthly sales by year error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly sales data'
        });
    }
});

module.exports = router;
