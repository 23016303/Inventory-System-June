// Reports API endpoints - converts sales_report.php and monthly_sales.php to JavaScript
const express = require('express');
const router = express.Router();
const db = require('./includes/database');
const { authenticate, requireLevel } = require('./includes/session');

// Get sales report by date range
router.post('/sales-report', authenticate, requireLevel(3), async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Start date and end date are required' 
            });
        }

        const query = `
            SELECT 
                s.id,
                s.qty,
                s.price,
                s.date,
                p.name,
                (s.qty * s.price) as total
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id 
            WHERE DATE(s.date) BETWEEN ? AND ?
            ORDER BY s.date DESC
        `;
        
        const [sales] = await db.execute(query, [startDate, endDate]);
        
        // Calculate totals
        const totalSales = sales.reduce((sum, sale) => sum + (sale.qty * sale.price), 0);
        const totalQuantity = sales.reduce((sum, sale) => sum + sale.qty, 0);
        
        res.json({
            success: true,
            sales,
            summary: {
                totalSales: totalSales.toFixed(2),
                totalQuantity,
                startDate,
                endDate
            }
        });
    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate sales report' 
        });
    }
});

// Get monthly sales for current year
router.get('/monthly-sales/:year?', authenticate, requireLevel(3), async (req, res) => {
    try {
        const year = req.params.year || new Date().getFullYear();
        
        const query = `
            SELECT 
                s.id,
                s.qty,
                s.price,
                s.date,
                p.name,
                (s.qty * s.price) as total_saleing_price
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id 
            WHERE YEAR(s.date) = ?
            ORDER BY s.date DESC
        `;
        
        const [sales] = await db.execute(query, [year]);
        
        // Group by month for summary
        const monthlySummary = sales.reduce((acc, sale) => {
            const month = new Date(sale.date).toLocaleString('default', { month: 'long' });
            if (!acc[month]) {
                acc[month] = {
                    month,
                    totalSales: 0,
                    totalQuantity: 0,
                    salesCount: 0
                };
            }
            acc[month].totalSales += (sale.qty * sale.price);
            acc[month].totalQuantity += sale.qty;
            acc[month].salesCount += 1;
            return acc;
        }, {});
        
        res.json({
            success: true,
            sales,
            year,
            monthlySummary: Object.values(monthlySummary)
        });
    } catch (error) {
        console.error('Monthly sales error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get monthly sales' 
        });
    }
});

// Get daily sales summary
router.get('/daily-sales/:date?', authenticate, requireLevel(3), async (req, res) => {
    try {
        const date = req.params.date || new Date().toISOString().split('T')[0];
        
        const query = `
            SELECT 
                s.id,
                s.qty,
                s.price,
                s.date,
                p.name,
                (s.qty * s.price) as total
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id 
            WHERE DATE(s.date) = ?
            ORDER BY s.date DESC
        `;
        
        const [sales] = await db.execute(query, [date]);
        
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.qty * sale.price), 0);
        const totalQuantity = sales.reduce((sum, sale) => sum + sale.qty, 0);
        
        res.json({
            success: true,
            date,
            sales,
            summary: {
                totalRevenue: totalRevenue.toFixed(2),
                totalQuantity,
                salesCount: sales.length
            }
        });
    } catch (error) {
        console.error('Daily sales error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get daily sales' 
        });
    }
});

// Get sales analytics/dashboard data
router.get('/analytics', authenticate, requireLevel(3), async (req, res) => {
    try {
        // Get today's sales
        const todayQuery = `
            SELECT 
                COUNT(*) as sales_count,
                COALESCE(SUM(qty * price), 0) as total_revenue,
                COALESCE(SUM(qty), 0) as total_quantity
            FROM sales 
            WHERE DATE(date) = CURDATE()
        `;
        
        // Get this month's sales
        const monthQuery = `
            SELECT 
                COUNT(*) as sales_count,
                COALESCE(SUM(qty * price), 0) as total_revenue,
                COALESCE(SUM(qty), 0) as total_quantity
            FROM sales 
            WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())
        `;
        
        // Get top selling products
        const topProductsQuery = `
            SELECT 
                p.name,
                SUM(s.qty) as total_sold,
                SUM(s.qty * s.price) as total_revenue
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id
            WHERE DATE(s.date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY p.id, p.name
            ORDER BY total_sold DESC
            LIMIT 5
        `;
        
        const [todayStats] = await db.execute(todayQuery);
        const [monthStats] = await db.execute(monthQuery);
        const [topProducts] = await db.execute(topProductsQuery);
        
        res.json({
            success: true,
            today: todayStats[0],
            thisMonth: monthStats[0],
            topProducts
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get analytics data' 
        });
    }
});

module.exports = router;
