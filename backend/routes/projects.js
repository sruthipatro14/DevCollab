import express from "express";
import pool from "../db.js";
import { authenticate } from "./auth.js";

const router = express.Router();

// ── GET /api/projects ──────────────────────────────────────────────
// Returns all projects with owner name
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, u.name AS owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `);

    // Shape to match what the frontend already expects
    const projects = rows.map(p => ({
      id:          p.id,
      title:       p.title,
      description: p.description,
      skills:      p.skills,
      slots:       p.slots,
      type:        p.type,
      ownerName:   p.owner_name,
      faculty:     p.type === "faculty" ? p.owner_name : null,
      createdBy:   p.type,
    }));

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/projects ─────────────────────────────────────────────
// Create a new project (auth required)
router.post("/", authenticate, async (req, res) => {
  const { title, description, skills, slots, type } = req.body;

  if (!title || !description || !skills || !slots) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO projects (title, description, skills, slots, type, owner_id) VALUES (?, ?, ?, ?, ?, ?)",
      [title, description, skills, parseInt(slots), type || req.user.role, req.user.id]
    );

    const [rows] = await pool.execute(
      "SELECT p.*, u.name AS owner_name FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.id = ?",
      [result.insertId]
    );

    const p = rows[0];
    res.status(201).json({
      id:          p.id,
      title:       p.title,
      description: p.description,
      skills:      p.skills,
      slots:       p.slots,
      type:        p.type,
      ownerName:   p.owner_name,
      faculty:     p.type === "faculty" ? p.owner_name : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/projects/:id ───────────────────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT owner_id FROM projects WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    await pool.execute("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
