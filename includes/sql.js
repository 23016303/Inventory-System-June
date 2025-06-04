// SQL operations and database queries
const Database = require('./database');

class SQL {
    constructor() {
        this.db = new Database();
    }

    // Find all records from a table
    async findAll(table) {
        try {
            const sql = `SELECT * FROM ${this.db.escape(table).replace(/'/g, '')}`;
            return await this.db.query(sql);
        } catch (error) {
            throw new Error(`Error finding all records from ${table}: ${error.message}`);
        }
    }

    // Execute custom SQL query
    async findBySql(sql, params = []) {
        try {
            return await this.db.query(sql, params);
        } catch (error) {
            throw new Error(`SQL query error: ${error.message}`);
        }
    }

    // Find record by ID
    async findById(table, id) {
        try {
            const sql = `SELECT * FROM ${this.db.escape(table).replace(/'/g, '')} WHERE id = ? LIMIT 1`;
            const results = await this.db.query(sql, [id]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            throw new Error(`Error finding record by ID from ${table}: ${error.message}`);
        }
    }

    // Delete record by ID
    async deleteById(table, id) {
        try {
            const sql = `DELETE FROM ${this.db.escape(table).replace(/'/g, '')} WHERE id = ? LIMIT 1`;
            const result = await this.db.query(sql, [id]);
            return result.affectedRows === 1;
        } catch (error) {
            throw new Error(`Error deleting record from ${table}: ${error.message}`);
        }
    }

    // Insert new record
    async insert(table, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map(() => '?').join(', ');
            const fieldNames = fields.join(', ');
            
            const sql = `INSERT INTO ${this.db.escape(table).replace(/'/g, '')} (${fieldNames}) VALUES (${placeholders})`;
            const result = await this.db.query(sql, values);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error inserting record into ${table}: ${error.message}`);
        }
    }

    // Update record by ID
    async updateById(table, id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            
            const sql = `UPDATE ${this.db.escape(table).replace(/'/g, '')} SET ${setClause} WHERE id = ? LIMIT 1`;
            const result = await this.db.query(sql, [...values, id]);
            return result.affectedRows === 1;
        } catch (error) {
            throw new Error(`Error updating record in ${table}: ${error.message}`);
        }
    }

    // Count records in table
    async count(table, whereClause = '', params = []) {
        try {
            let sql = `SELECT COUNT(*) as count FROM ${this.db.escape(table).replace(/'/g, '')}`;
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }
            const results = await this.db.query(sql, params);
            return results[0].count;
        } catch (error) {
            throw new Error(`Error counting records in ${table}: ${error.message}`);
        }
    }

    // Check if table exists
    async tableExists(table) {
        try {
            const sql = `SHOW TABLES LIKE ?`;
            const results = await this.db.query(sql, [table]);
            return results.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Get products with category information
    async getProductsWithCategories() {
        try {
            const sql = `
                SELECT p.*, c.name as category_name, m.file_name as image_name
                FROM products p
                LEFT JOIN categories c ON p.categorie_id = c.id
                LEFT JOIN media m ON p.media_id = m.id
                ORDER BY p.name
            `;
            return await this.db.query(sql);
        } catch (error) {
            throw new Error(`Error getting products with categories: ${error.message}`);
        }
    }

    // Get sales with product information
    async getSalesWithProducts() {
        try {
            const sql = `
                SELECT s.*, p.name as product_name
                FROM sales s
                LEFT JOIN products p ON s.product_id = p.id
                ORDER BY s.date DESC
            `;
            return await this.db.query(sql);
        } catch (error) {
            throw new Error(`Error getting sales with products: ${error.message}`);
        }
    }

    // Get users with group information
    async getUsersWithGroups() {
        try {
            const sql = `
                SELECT u.*, g.group_name
                FROM users u
                LEFT JOIN user_groups g ON u.user_level = g.group_level
                ORDER BY u.name
            `;
            return await this.db.query(sql);
        } catch (error) {
            throw new Error(`Error getting users with groups: ${error.message}`);
        }
    }

    // Get recent sales
    async getRecentSales(limit = 10) {
        try {
            const sql = `
                SELECT s.*, p.name as product_name
                FROM sales s
                LEFT JOIN products p ON s.product_id = p.id
                ORDER BY s.date DESC
                LIMIT ?
            `;
            return await this.db.query(sql, [limit]);
        } catch (error) {
            throw new Error(`Error getting recent sales: ${error.message}`);
        }
    }

    // Get low stock products
    async getLowStockProducts(threshold = 10) {
        try {
            const sql = `
                SELECT p.*, c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.categorie_id = c.id
                WHERE CAST(p.quantity AS UNSIGNED) <= ?
                ORDER BY CAST(p.quantity AS UNSIGNED) ASC
            `;
            return await this.db.query(sql, [threshold]);
        } catch (error) {
            throw new Error(`Error getting low stock products: ${error.message}`);
        }
    }

    // Get daily sales total
    async getDailySalesTotal(date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            const sql = `
                SELECT 
                    COUNT(*) as total_sales,
                    SUM(qty * price) as total_revenue
                FROM sales 
                WHERE DATE(date) = ?
            `;
            const results = await this.db.query(sql, [targetDate]);
            return results[0];
        } catch (error) {
            throw new Error(`Error getting daily sales total: ${error.message}`);
        }
    }

    // Get monthly sales report
    async getMonthlySalesReport(year, month) {
        try {
            const sql = `
                SELECT 
                    DATE(s.date) as sale_date,
                    COUNT(*) as total_sales,
                    SUM(s.qty * s.price) as total_revenue,
                    p.name as top_product
                FROM sales s
                LEFT JOIN products p ON s.product_id = p.id
                WHERE YEAR(s.date) = ? AND MONTH(s.date) = ?
                GROUP BY DATE(s.date), p.id
                ORDER BY total_revenue DESC
            `;
            return await this.db.query(sql, [year, month]);
        } catch (error) {
            throw new Error(`Error getting monthly sales report: ${error.message}`);
        }
    }

    // Close database connection
    close() {
        this.db.end();
    }
}

module.exports = SQL;
