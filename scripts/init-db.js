const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
});

async function initializeDatabase() {
  try {
    console.log('Creating database if it doesn\'t exist...');
    
    // Create database
    await db.promise().query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await db.promise().query(`USE ${process.env.DB_NAME}`);
    
    console.log('Creating tables...');
    
    // Create categories table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS categories (
        id int(11) unsigned NOT NULL AUTO_INCREMENT,
        name varchar(60) NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    // Create media table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS media (
        id int(11) unsigned NOT NULL AUTO_INCREMENT,
        file_name varchar(255) NOT NULL,
        file_type varchar(100) NOT NULL,
        file_size varchar(50) DEFAULT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    // Create products table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS products (
        id int(11) unsigned NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        quantity varchar(50) DEFAULT NULL,
        buy_price decimal(25,2) DEFAULT NULL,
        sale_price decimal(25,2) NOT NULL,
        categorie_id int(11) unsigned DEFAULT NULL,
        media_id int(11) DEFAULT 0,
        date datetime NOT NULL,
        PRIMARY KEY (id),
        KEY categorie_id (categorie_id),
        CONSTRAINT products_ibfk_1 FOREIGN KEY (categorie_id) REFERENCES categories (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    // Create user_groups table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id int(11) NOT NULL AUTO_INCREMENT,
        group_name varchar(150) NOT NULL,
        group_level int(11) NOT NULL,
        group_status int(1) NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1
    `);

    // Create users table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS users (
        id int(11) unsigned NOT NULL AUTO_INCREMENT,
        name varchar(60) NOT NULL,
        username varchar(50) NOT NULL,
        password varchar(255) NOT NULL,
        user_level int(11) NOT NULL,
        image varchar(255) DEFAULT 'no_image.jpg',
        status int(1) NOT NULL,
        last_login datetime DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY username (username),
        KEY user_level (user_level)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1
    `);

    // Create sales table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS sales (
        id int(11) unsigned NOT NULL AUTO_INCREMENT,
        product_id int(11) unsigned NOT NULL,
        qty int(11) NOT NULL,
        price decimal(25,2) NOT NULL,
        date datetime NOT NULL,
        PRIMARY KEY (id),
        KEY product_id (product_id),
        CONSTRAINT sales_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    console.log('Inserting sample data...');

    // Insert sample categories
    await db.promise().query(`
      INSERT IGNORE INTO categories (id, name) VALUES
      (1, 'Demo Category'),
      (2, 'Raw Materials'),
      (3, 'Finished Goods'),
      (4, 'Packing Materials'),
      (5, 'Machinery'),
      (6, 'Work in Progress'),
      (7, 'Electronics'),
      (8, 'Stationery Items')
    `);

    // Insert sample user groups
    await db.promise().query(`
      INSERT IGNORE INTO user_groups (id, group_name, group_level, group_status) VALUES
      (1, 'Admin', 1, 1),
      (2, 'Special', 2, 1),
      (3, 'User', 3, 1)
    `);

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin', 10);
    await db.promise().query(`
      INSERT IGNORE INTO users (id, name, username, password, user_level, status) VALUES
      (1, 'Administrator', 'admin', ?, 1, 1)
    `, [hashedPassword]);

    // Insert sample products
    await db.promise().query(`
      INSERT IGNORE INTO products (id, name, quantity, buy_price, sale_price, categorie_id, date) VALUES
      (1, 'Demo Product 1', '50', '10.00', '15.00', 1, NOW()),
      (2, 'Sample Item', '25', '5.50', '8.99', 2, NOW()),
      (3, 'Test Product', '100', '2.25', '3.75', 3, NOW())
    `);

    console.log('Database initialization completed successfully!');
    console.log('Default admin user created:');
    console.log('Username: admin');
    console.log('Password: admin');
    console.log('Please change the default password after first login.');

    db.end();
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
