// Database Configuration for ConstruxFlow
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root', // Change this to your MySQL password
    database: 'construxflow',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify for async/await
const promisePool = pool.promise();

module.exports = promisePool;
