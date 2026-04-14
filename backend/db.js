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

// ── Verify DB connection on startup ───────────────────────────────
pool.getConnection()
  .then(conn => {
    console.log(`✅ MySQL connected → ${process.env.DB_NAME || "devcollab"}`);
    conn.release();
  })
  .catch(err => {
    console.error("❌ MySQL connection failed:", err.message);
    console.error("   Check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in backend/.env");
    process.exit(1); // crash fast so you see the error immediately
  });

export default pool;
