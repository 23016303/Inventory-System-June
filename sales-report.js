const express = require('express');
const router = express.Router();
const db = require('./includes/database');
const { verifyToken, requireLevel } = require('./includes/session');
const { remove_junk, validate_fields } = require('./includes/functions');

/**
 * Sales Report Routes - replaces sales_report.php and sale_report_process.php
 * Handles sales report generation by date range
 */

/**
 * Generate sales report by date range
 */
router.post('/generate', verifyToken, requireLevel(3), async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        // Validate required fields
        const errors = [];
        if (!startDate) errors.push('Start date is required');
        if (!endDate) errors.push('End date is required');
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        // Validate date format and range
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        
        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date'
            });
        }
        
        // Get sales data for the date range - equivalent to find_sale_by_dates()
        const query = `
            SELECT 
                s.id,
                s.qty,
                s.price,
                s.date,
                p.name as product_name,
                p.sale_price,
                p.buy_price,
                (s.qty * s.price) as total_sale,
                u.name as seller_name
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE DATE(s.date) BETWEEN ? AND ?
            ORDER BY s.date DESC
        `;
        
        const [results] = await db.execute(query, [startDate, endDate]);
        
        // Calculate totals
        let totalSales = 0;
        let totalQty = 0;
        
        const salesData = results.map(sale => {
            const saleTotal = parseFloat(sale.total_sale);
            totalSales += saleTotal;
            totalQty += parseInt(sale.qty);
            
            return {
                id: sale.id,
                product_name: remove_junk(sale.product_name),
                qty: parseInt(sale.qty),
                price: parseFloat(sale.price).toFixed(2),
                total_sale: saleTotal.toFixed(2),
                date: sale.date,
                seller_name: remove_junk(sale.seller_name)
            };
        });
        
        res.json({
            success: true,
            data: {
                sales: salesData,
                summary: {
                    total_sales: totalSales.toFixed(2),
                    total_qty: totalQty,
                    total_records: salesData.length,
                    start_date: startDate,
                    end_date: endDate
                }
            }
        });
        
    } catch (error) {
        console.error('Sales report generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating sales report'
        });
    }
});

/**
 * Get sales report template/form data
 */
router.get('/template', verifyToken, requireLevel(3), (req, res) => {
    try {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        res.json({
            success: true,
            data: {
                default_start_date: lastMonth.toISOString().split('T')[0],
                default_end_date: today.toISOString().split('T')[0],
                instructions: 'Select date range to generate sales report'
            }
        });
    } catch (error) {
        console.error('Sales report template error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading report template'
        });
    }
});

/**
 * Generate printable sales report (HTML format)
 */
router.post('/print', verifyToken, requireLevel(3), async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        // Get sales data
        const query = `
            SELECT 
                s.id,
                s.qty,
                s.price,
                s.date,
                p.name as product_name,
                (s.qty * s.price) as total_sale
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id
            WHERE DATE(s.date) BETWEEN ? AND ?
            ORDER BY s.date DESC
        `;
        
        const [results] = await db.execute(query, [startDate, endDate]);
        
        let totalSales = 0;
        let totalQty = 0;
        
        const salesData = results.map((sale, index) => {
            const saleTotal = parseFloat(sale.total_sale);
            totalSales += saleTotal;
            totalQty += parseInt(sale.qty);
            
            return {
                counter: index + 1,
                product_name: remove_junk(sale.product_name),
                qty: parseInt(sale.qty),
                price: parseFloat(sale.price).toFixed(2),
                total_sale: saleTotal.toFixed(2),
                date: new Date(sale.date).toLocaleDateString()
            };
        });
        
        // Generate HTML report
        const htmlReport = generateSalesReportHTML(salesData, {
            start_date: startDate,
            end_date: endDate,
            total_sales: totalSales.toFixed(2),
            total_qty: totalQty,
            total_records: salesData.length
        });
        
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlReport);
        
    } catch (error) {
        console.error('Print sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating printable report'
        });
    }
});

/**
 * Generate HTML for printable sales report
 */
function generateSalesReportHTML(salesData, summary) {
    return `
<!doctype html>
<html lang="en-US">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Sales Report - ${summary.start_date} to ${summary.end_date}</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css"/>
    <style>
        @media print {
            html,body{
                font-size: 9.5pt;
                margin: 0;
                padding: 0;
            }
            .page-break {
                page-break-before:always;
                width: auto;
                margin: auto;
            }
        }
        .page-break{
            width: 980px;
            margin: 0 auto;
        }
        .sale-head{
            margin: 40px 0;
            text-align: center;
        }
        .sale-head h1,.sale-head strong{
            padding: 10px 20px;
            display: block;
        }
        .sale-head h1{
            margin: 0;
            border-bottom: 1px solid #212121;
        }
        .table>thead:first-child>tr:first-child>th{
            border-top: 1px solid #000;
        }
        table thead tr th {
            text-align: center;
            border: 1px solid #ededed;
        }
        table tbody tr td{
            vertical-align: middle;
        }
        .sale-head,table.table thead tr th,table tbody tr td,table tfoot tr td{
            border: 1px solid #212121;
            white-space: nowrap;
        }
        .sale-head h1,table thead tr th,table tfoot tr td{
            background-color: #f8f8f8;
        }
        tfoot{
            color:#000;
            text-transform: uppercase;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="page-break">
        <div class="sale-head">
            <h1>Inventory Management System - Sales Report</h1>
            <strong>Sales Report from ${summary.start_date} to ${summary.end_date}</strong>
        </div>
        <table class="table table-border">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Quantity Sold</th>
                    <th>Price</th>
                    <th>Total Sale</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${salesData.map(sale => `
                <tr>
                    <td class="text-center">${sale.counter}</td>
                    <td>${sale.product_name}</td>
                    <td class="text-center">${sale.qty}</td>
                    <td class="text-center">$${sale.price}</td>
                    <td class="text-center">$${sale.total_sale}</td>
                    <td class="text-center">${sale.date}</td>
                </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr class="text-center">
                    <td colspan="2">Total Records: ${summary.total_records}</td>
                    <td>Total Quantity: ${summary.total_qty}</td>
                    <td colspan="2">Total Sales: $${summary.total_sales}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>
</body>
</html>`;
}

module.exports = router;
