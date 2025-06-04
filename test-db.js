const mysql = require('mysql2');
require('dotenv').config();

console.log('Testing database connection...');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Check database credentials in .env file');
    console.log('3. Ensure database user has proper permissions');
    console.log('4. Run "setup.bat" to initialize the database');
  } else {
    console.log('✅ Database connected successfully!');
    console.log('You can now start the server with "npm start" or "start.bat"');
  }
  db.end();
});
