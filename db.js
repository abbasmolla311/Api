const mysql = require('mysql2/promise'); // Use promise-based version
const dotenv = require('dotenv');
dotenv.config();

// Create a connection pool instead of single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Connected!');
    connection.release(); // Release the connection back to the pool
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  });

module.exports = pool;