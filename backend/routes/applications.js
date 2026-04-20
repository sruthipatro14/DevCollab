import express from "express";
import pool from "../db.js";
import { authenticate } from "./auth.js";

const router = express.Router();

// ── GET /api/applications ──────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    let rows;

    if (req.user.role === "faculty") {
      [rows] = await pool.execute(`
        SELECT a.*, u.name, u.email,
               p.title AS project_title
        FROM applications a
        JOIN users    u ON a.student_id  = u.id
        JOIN projects p ON a.project_id  = p.id
        WHERE p.owner_id = ?
        ORDER BY a.applied_at DESC
      `, [req.user.id]);
    } else {
      [rows] = await pool.execute(`
        SELECT a.*, p.title AS project_title
        FROM applications a
        JOIN projects p ON a.project_id = p.id
        WHERE a.student_id = ?
        ORDER BY a.applied_at DESC
      `, [req.user.id]);
    }

    const apps = rows.map(a => ({
      id:           a.id,
      projectId:    a.project_id,
      projectTitle: a.project_title,
      name:         a.name  || null,
      email:        a.email || null,
      skills:       a.skills,
      resume:       a.resume_link,
      message:      a.message,
      status:       a.status,
      rating:       a.rating,
      feedback:     a.feedback,
      skillsGained: a.skills_gained,
      progress:     a.progress ?? 0,
      remarks:      a.remarks || null,
      appliedAt:    new Date(a.applied_at).toLocaleDateString(),
    }));

    res.json(apps);
  } catch (err) {
    console.error("[GET /applications]", err.message);
    res.status(500).json({
      error: "Failed to fetch applications",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

// ── POST /api/applications ─────────────────────────────────────────
router.post("/", authenticate, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Only students can apply" });
  }

  const { projectId, skills, resumeLink, message } = req.body;

  if (!projectId || !skills) {
    return res.status(400).json({ error: "projectId and skills required" });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO applications (project_id, student_id, skills, resume_link, message)
       VALUES (?, ?, ?, ?, ?)`,
      [projectId, req.user.id, skills, resumeLink || null, message || null]
    );

    const [rows] = await pool.execute(`
      SELECT a.*, p.title AS project_title
      FROM applications a
      JOIN projects p ON a.project_id = p.id
      WHERE a.id = ?
    `, [result.insertId]);

    const a = rows[0];
    res.status(201).json({
      id:           a.id,
      projectId:    a.project_id,
      projectTitle: a.project_title,
      skills:       a.skills,
      resume:       a.resume_link,
      message:      a.message,
      status:       a.status,
      progress:     a.progress ?? 0,
      remarks:      a.remarks || null,
      appliedAt:    new Date(a.applied_at).toLocaleDateString(),
    });
  } catch (err) {
    console.error("[POST /applications]", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Already applied to this project" });
    }
    res.status(500).json({
      error: "Failed to submit application",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

// ── PATCH /api/applications/:id ────────────────────────────────────
// Faculty: update status, rating, feedback, skillsGained
router.patch("/:id", authenticate, async (req, res) => {
  if (req.user.role !== "faculty") {
    return res.status(403).json({ error: "Only faculty can update applications" });
  }

  const { status, rating, feedback, skillsGained } = req.body;

  try {
    const [check] = await pool.execute(`
      SELECT a.id FROM applications a
      JOIN projects p ON a.project_id = p.id
      WHERE a.id = ? AND p.owner_id = ?
    `, [req.params.id, req.user.id]);

    if (check.length === 0) return res.status(403).json({ error: "Forbidden" });

    await pool.execute(
      `UPDATE applications
       SET status        = COALESCE(?, status),
           rating        = COALESCE(?, rating),
           feedback      = COALESCE(?, feedback),
           skills_gained = COALESCE(?, skills_gained)
       WHERE id = ?`,
      [status || null, rating || null, feedback || null, skillsGained || null, req.params.id]
    );

    const [rows] = await pool.execute(
      "SELECT * FROM applications WHERE id = ?",
      [req.params.id]
    );

    const a = rows[0];
    res.json({
      id:           a.id,
      status:       a.status,
      rating:       a.rating,
      feedback:     a.feedback,
      skillsGained: a.skills_gained,
      progress:     a.progress ?? 0,
      remarks:      a.remarks || null,
    });
  } catch (err) {
    console.error("[PATCH /applications/:id]", err.message);
    res.status(500).json({
      error: "Failed to update application",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

// ── PUT /api/applications/:id/progress ────────────────────────────
// Faculty: set progress (0-100) and remarks for an accepted student
router.put("/:id/progress", authenticate, async (req, res) => {
  if (req.user.role !== "faculty") {
    return res.status(403).json({ error: "Only faculty can update progress" });
  }

  const { progress, remarks } = req.body;

  if (progress === undefined || progress === null) {
    return res.status(400).json({ error: "progress is required" });
  }

  const pct = parseInt(progress, 10);
  if (isNaN(pct) || pct < 0 || pct > 100) {
    return res.status(400).json({ error: "progress must be 0–100" });
  }

  try {
    // Verify this application belongs to one of the faculty's projects
    const [check] = await pool.execute(`
      SELECT a.id FROM applications a
      JOIN projects p ON a.project_id = p.id
      WHERE a.id = ? AND p.owner_id = ?
    `, [req.params.id, req.user.id]);

    if (check.length === 0) return res.status(403).json({ error: "Forbidden" });

    await pool.execute(
      `UPDATE applications SET progress = ?, remarks = ? WHERE id = ?`,
      [pct, remarks || null, req.params.id]
    );

    const [rows] = await pool.execute(
      "SELECT id, progress, remarks FROM applications WHERE id = ?",
      [req.params.id]
    );

    const a = rows[0];
    res.json({
      id:       a.id,
      progress: a.progress,
      remarks:  a.remarks,
    });
  } catch (err) {
    console.error("[PUT /applications/:id/progress]", err.message);
    res.status(500).json({
      error: "Failed to update progress",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

export default router;
