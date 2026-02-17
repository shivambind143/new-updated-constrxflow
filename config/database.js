// // Database Configuration for ConstruxFlow
// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: 'root', // Change this to your MySQL password
//     database: 'construxflow',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// // Promisify for async/await
// const promisePool = pool.promise();

// module.exports = promisePool;

// the above one is used to run on local host and the below is for render 

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

module.exports = promisePool;

