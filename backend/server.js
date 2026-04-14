import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes         from "./routes/auth.js";
import projectRoutes      from "./routes/projects.js";
import applicationRoutes  from "./routes/applications.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: "http://localhost:5173",   // Vite dev server
  credentials: true,
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/projects",     projectRoutes);
app.use("/api/applications", applicationRoutes);

// ── Health check ───────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`DevCollab backend running on http://localhost:${PORT}`);
});
