import express from "express";
import pool from "../db.js";
import { authenticate } from "./auth.js";

const router = express.Router();

// ── GET /api/projects ──────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, u.name AS owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `);

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
    console.error("[GET /projects]", err.message);
    res.status(500).json({
      error: "Failed to fetch projects",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

// ── POST /api/projects ─────────────────────────────────────────────
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
    console.error("[POST /projects]", err.message);
    res.status(500).json({
      error: "Failed to create project",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

// ── DELETE /api/projects/:id ───────────────────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT owner_id FROM projects WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Project not found" });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    await pool.execute("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /projects/:id]", err.message);
    res.status(500).json({
      error: "Failed to delete project",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

export default router;
