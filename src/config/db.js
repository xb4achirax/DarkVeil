import mysql from 'mysql2';
import fs from 'fs';

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { ca: fs.readFileSync('./ca.pem') },
    waitForConnections: true,
    connectionLimit: 5,
})

await db.getConnection((err, connection) => {
    if (err) return console.log(' ❗ There was an error while connecting to the database: ❗ ', err.message);
    return console.log(' 🟢 Connected to the database 🟢 ')
});



export default db;