import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "devcollab_secret_change_in_prod";

// ── POST /api/auth/register ────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, role]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: result.insertId, name, email, role }
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        bio:        user.bio,
        resumeLink: user.resume_link,
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT /api/auth/profile ──────────────────────────────────────────
router.put("/profile", authenticate, async (req, res) => {
  const { name, bio, resumeLink } = req.body;

  try {
    await pool.execute(
      "UPDATE users SET name = ?, bio = ?, resume_link = ? WHERE id = ?",
      [name, bio, resumeLink, req.user.id]
    );

    const [rows] = await pool.execute(
      "SELECT id, name, email, role, bio, resume_link FROM users WHERE id = ?",
      [req.user.id]
    );

    const u = rows[0];
    res.json({
      id:         u.id,
      name:       u.name,
      email:      u.email,
      role:       u.role,
      bio:        u.bio,
      resumeLink: u.resume_link,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Middleware: verify JWT ─────────────────────────────────────────
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export default router;
