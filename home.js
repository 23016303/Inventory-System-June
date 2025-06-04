// Home dashboard functionality
const express = require('express');
const { sql, session } = require('./includes/load');

const router = express.Router();

// Get dashboard data
router.get('/dashboard', session.isUserLoggedIn(), async (req, res) => {
    try {
        // Get dashboard statistics
        const [
            totalProducts,
            totalCategories,
            totalUsers,
            totalSales,
            dailySales,
            lowStockProducts,
            recentSales
        ] = await Promise.all([
            sql.count('products'),
            sql.count('categories'),
            sql.count('users'),
            sql.count('sales'),
            sql.getDailySalesTotal(),
            sql.getLowStockProducts(10),
            sql.getRecentSales(5)
        ]);

        // Calculate additional metrics
        const totalRevenue = await sql.findBySql(`
            SELECT SUM(qty * price) as total 
            FROM sales 
            WHERE MONTH(date) = MONTH(CURRENT_DATE()) 
            AND YEAR(date) = YEAR(CURRENT_DATE())
        `);

        const monthlyRevenue = totalRevenue[0]?.total || 0;

        res.json({
            success: true,
            data: {
                statistics: {
                    totalProducts,
                    totalCategories,
                    totalUsers,
                    totalSales,
                    dailySales: dailySales.total_sales || 0,
                    dailyRevenue: dailySales.total_revenue || 0,
                    monthlyRevenue
                },
                lowStockProducts: lowStockProducts.slice(0, 5),
                recentSales: recentSales,
                alerts: await generateAlerts()
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard data'
        });
    }
});

// Generate system alerts
async function generateAlerts() {
    const alerts = [];

    try {
        // Check for low stock products
        const lowStock = await sql.getLowStockProducts(5);
        if (lowStock.length > 0) {
            alerts.push({
                type: 'warning',
                title: 'Low Stock Alert',
                message: `${lowStock.length} products are running low on stock`,
                action: 'View Products',
                actionUrl: '/products'
            });
        }

        // Check for products with no sales in last 30 days
        const noSalesProducts = await sql.findBySql(`
            SELECT p.name 
            FROM products p 
            LEFT JOIN sales s ON p.id = s.product_id 
            AND s.date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            WHERE s.id IS NULL
            LIMIT 5
        `);

        if (noSalesProducts.length > 0) {
            alerts.push({
                type: 'info',
                title: 'No Recent Sales',
                message: `${noSalesProducts.length} products have no sales in the last 30 days`,
                action: 'View Report',
                actionUrl: '/sales/report'
            });
        }

        // Check for users who haven't logged in recently
        const inactiveUsers = await sql.findBySql(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE last_login < DATE_SUB(NOW(), INTERVAL 30 DAY) 
            AND status = 1
        `);

        if (inactiveUsers[0]?.count > 0) {
            alerts.push({
                type: 'info',
                title: 'Inactive Users',
                message: `${inactiveUsers[0].count} users haven't logged in recently`,
                action: 'Manage Users',
                actionUrl: '/users'
            });
        }

    } catch (error) {
        console.error('Error generating alerts:', error);
    }

    return alerts;
}

// Get quick stats for widgets
router.get('/quick-stats', session.isUserLoggedIn(), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date();
        const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);

        const [todaySales, monthSales, lastMonthSales] = await Promise.all([
            sql.findBySql('SELECT COUNT(*) as count, SUM(qty * price) as revenue FROM sales WHERE DATE(date) = ?', [today]),
            sql.findBySql('SELECT COUNT(*) as count, SUM(qty * price) as revenue FROM sales WHERE MONTH(date) = ? AND YEAR(date) = ?', 
                [thisMonth.getMonth() + 1, thisMonth.getFullYear()]),
            sql.findBySql('SELECT COUNT(*) as count, SUM(qty * price) as revenue FROM sales WHERE MONTH(date) = ? AND YEAR(date) = ?', 
                [lastMonth.getMonth() + 1, lastMonth.getFullYear()])
        ]);

        const todayData = todaySales[0] || { count: 0, revenue: 0 };
        const monthData = monthSales[0] || { count: 0, revenue: 0 };
        const lastMonthData = lastMonthSales[0] || { count: 0, revenue: 0 };

        // Calculate percentage changes
        const salesChange = lastMonthData.count > 0 ? 
            ((monthData.count - lastMonthData.count) / lastMonthData.count * 100) : 0;
        
        const revenueChange = lastMonthData.revenue > 0 ? 
            ((monthData.revenue - lastMonthData.revenue) / lastMonthData.revenue * 100) : 0;

        res.json({
            success: true,
            data: {
                today: {
                    sales: todayData.count,
                    revenue: todayData.revenue || 0
                },
                month: {
                    sales: monthData.count,
                    revenue: monthData.revenue || 0,
                    salesChange: Math.round(salesChange * 100) / 100,
                    revenueChange: Math.round(revenueChange * 100) / 100
                }
            }
        });

    } catch (error) {
        console.error('Quick stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load quick stats'
        });
    }
});

module.exports = router;
