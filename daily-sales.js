const express = require('express');
const router = express.Router();
const db = require('./includes/database');
const { verifyToken, requireLevel } = require('./includes/session');
const { remove_junk } = require('./includes/functions');

/**
 * Daily Sales Route - replaces daily_sales.php
 * Provides daily sales data for current or specified month/year
 */

/**
 * Get daily sales for current month
 */
router.get('/', verifyToken, requireLevel(3), async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // JavaScript months are 0-based
        
        const dailySales = await getDailySales(year, month);
        
        res.json({
            success: true,
            data: {
                sales: dailySales,
                year: year,
                month: month,
                month_name: now.toLocaleString('default', { month: 'long' }),
                total_records: dailySales.length
            }
        });
        
    } catch (error) {
        console.error('Daily sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily sales data'
        });
    }
});

/**
 * Get daily sales for specific month and year
 */
router.get('/:year/:month', verifyToken, requireLevel(3), async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        
        // Validate year and month
        if (isNaN(year) || isNaN(month) || 
            year < 2000 || year > new Date().getFullYear() + 1 ||
            month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid year or month provided'
            });
        }
        
        const dailySales = await getDailySales(year, month);
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        res.json({
            success: true,
            data: {
                sales: dailySales,
                year: year,
                month: month,
                month_name: monthNames[month - 1],
                total_records: dailySales.length
            }
        });
        
    } catch (error) {
        console.error('Daily sales by month error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily sales data'
        });
    }
});

/**
 * Get daily sales summary for current month
 */
router.get('/summary', verifyToken, requireLevel(3), async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        // Get daily sales summary
        const query = `
            SELECT 
                DATE(s.date) as sale_date,
                COUNT(s.id) as total_sales,
                SUM(s.qty) as total_quantity,
                SUM(s.qty * s.price) as total_amount
            FROM sales s
            WHERE YEAR(s.date) = ? AND MONTH(s.date) = ?
            GROUP BY DATE(s.date)
            ORDER BY sale_date DESC
        `;
        
        const [results] = await db.execute(query, [year, month]);
        
        // Calculate totals
        let totalSales = 0;
        let totalQuantity = 0;
        let totalAmount = 0;
        
        const summaryData = results.map(row => {
            const sales = parseInt(row.total_sales);
            const quantity = parseInt(row.total_quantity);
            const amount = parseFloat(row.total_amount);
            
            totalSales += sales;
            totalQuantity += quantity;
            totalAmount += amount;
            
            return {
                date: row.sale_date,
                total_sales: sales,
                total_quantity: quantity,
                total_amount: amount.toFixed(2)
            };
        });
        
        res.json({
            success: true,
            data: {
                daily_summary: summaryData,
                totals: {
                    total_sales: totalSales,
                    total_quantity: totalQuantity,
                    total_amount: totalAmount.toFixed(2)
                },
                year: year,
                month: month
            }
        });
        
    } catch (error) {
        console.error('Daily sales summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily sales summary'
        });
    }
});

/**
 * Helper function to get daily sales data (equivalent to dailySales() PHP function)
 */
async function getDailySales(year, month) {
    try {
        const query = `
            SELECT 
                s.id,
                s.qty,
                s.price,
                s.date,
                p.name as product_name,
                p.sale_price,
                u.name as user_name,
                (s.qty * s.price) as total_sale
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE YEAR(s.date) = ? AND MONTH(s.date) = ?
            ORDER BY s.date DESC
        `;
        
        const [results] = await db.execute(query, [year, month]);
        
        return results.map((sale, index) => ({
            id: sale.id,
            counter: index + 1,
            product_name: remove_junk(sale.product_name),
            qty: parseInt(sale.qty),
            price: parseFloat(sale.price).toFixed(2),
            total_sale: parseFloat(sale.total_sale).toFixed(2),
            date: sale.date,
            user_name: remove_junk(sale.user_name)
        }));
        
    } catch (error) {
        console.error('Error in getDailySales:', error);
        return [];
    }
}

module.exports = router;
