import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Creates a connection pool — reuses connections instead of opening a new one per request
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "devcollab",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
