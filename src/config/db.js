import mysql from 'mysql2';
import fs from 'fs';
import path from 'path';

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { ca: fs.readFileSync(path.join(__dirname, '..', '..', 'ca.pem')) },
    waitForConnections: true,
    connectionLimit: 2,
});

export default db;