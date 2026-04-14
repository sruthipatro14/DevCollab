import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { api, saveSession, clearSession } from "./api.js";
import './App.css';

// ── Utility Functions ──────────────────────────────────────────────
function validateEmail(email) {
  return email && email.includes('@') && email.includes('.');
}

function validateForm(fields, setError) {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || value.trim() === '') {
      setError(`${key.charAt(0).toUpperCase() + key.slice(1)} is required`);
      return false;
    }
  }
  return true;
}
const Logo = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M3 5.5L10 2l7 3.5v9L10 18 3 14.5v-9z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M10 2v16M3 5.5l7 3.5 7-3.5" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
  </svg>
);

// ── Role Selection ────────────────────────────────────────────────────────────
function RoleSelection({ onSelect }) {
  return (
    <>
      <div className="login-brand">
        <div className="brand-icon"><Logo /></div>
        <span className="brand-text">Dev<span>Collab</span></span>
      </div>
      <div className="login-heading">
        <h1>Welcome to DevCollab</h1>
        <p>Select your role to continue</p>
      </div>
      <div className="role-grid">
        <button className="role-btn student" onClick={() => onSelect("student")}>
          <span className="role-emoji">🎓</span>
          <span className="role-name">Student</span>
          <span className="role-desc">Browse and apply to projects</span>
        </button>
        <button className="role-btn faculty" onClick={() => onSelect("faculty")}>
          <span className="role-emoji">🏛️</span>
          <span className="role-name">Faculty</span>
          <span className="role-desc">Create and manage projects</span>
        </button>
      </div>
    </>
  );
}

// ── Login Form ─────────────────────────────────────────────────────────────────
function LoginForm({ role, onBack, onLoginSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const login = async () => {
    setError(null);
    if (!validateForm({ email: form.email, password: form.password }, setError)) return;
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.auth.login(form.email.trim(), form.password);
      if (user.role !== role) { 
        setError(`This account is registered as ${user.role}, not ${role}.`);
        return; 
      }
      saveSession(token, user);
      onLoginSuccess(user);
      navigate(`/${role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    setError(null);
    const fields = mode === "signup" ? { name: form.name, email: form.email, password: form.password, confirm: form.confirm } : { email: form.email, password: form.password };
    if (!validateForm(fields, setError)) return;
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (mode === "signup" && form.password !== form.confirm) { 
      setError("Passwords do not match.");
      return; 
    }
    setLoading(true);
    try {
      const { token, user } = await api.auth.register(form.name.trim(), form.email.trim(), form.password, role);
      saveSession(token, user);
      onLoginSuccess(user);
      navigate(`/${role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setForm({ name: "", email: "", password: "", confirm: "" });
    setError(null);
    setMode(nextMode);
  };

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>← Back</button>
      <div className="login-brand">
        <div className="brand-icon"><Logo /></div>
        <span className="brand-text">Dev<span>Collab</span></span>
      </div>
      <div className="login-heading">
        <h1>{mode === "login" ? `${role === "student" ? "Student" : "Faculty"} Login` : `Create ${role === "student" ? "Student" : "Faculty"} Account`}</h1>
        <p>{mode === "login" ? `Sign in to access your ${role} workspace` : `Create a new ${role} account to start collaborating`}</p>
      </div>
      {mode === "signup" && (
        <div className="input-field">
          <label>Full Name</label>
          <div className="input-wrap">
            <input name="name" type="text" placeholder="Your full name" value={form.name} onChange={handle} />
          </div>
        </div>
      )}
      <div className="input-field">
        <label>Email</label>
        <div className="input-wrap">
          <span className="input-icon"><IconMail /></span>
          <input name="email" type="email" placeholder={`${role}@university.edu`} value={form.email} onChange={handle} />
        </div>
      </div>
      <div className="input-field">
        <label>Password</label>
        <div className="input-wrap">
          <span className="input-icon"><IconLock /></span>
          <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} />
        </div>
      </div>
      {mode === "signup" && (
        <div className="input-field">
          <label>Confirm Password</label>
          <div className="input-wrap">
            <span className="input-icon"><IconLock /></span>
            <input name="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={handle} />
          </div>
        </div>
      )}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <button className="btn-primary" onClick={mode === "login" ? login : createAccount} disabled={loading} style={{ width: "100%", marginTop: "1rem", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Processing..." : mode === "login" ? "Sign In →" : "Create Account →"}
      </button>
      <div className="login-extra">
        {mode === "login" ? (
          <button type="button" className="link-button" onClick={() => switchMode("signup")}>
            Don’t have an account? Create account
          </button>
        ) : (
          <button type="button" className="link-button" onClick={() => switchMode("login")}>
            Already have an account? Sign in
          </button>
        )}
      </div>
    </>
  );
}

function LoginFlow({ roleOverride, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(roleOverride || null);
  const [step, setStep] = useState(roleOverride ? "login" : "select");

  const startLogin = (role) => { setSelectedRole(role); setStep("login"); };
  const goBack     = ()     => { setStep("select"); setSelectedRole(null); };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-glow g1" />
      <div className="login-glow g2" />
      <div className="login-card">
        <div className="login-panel" key={step}>
          {step === "select" ? (
            <RoleSelection onSelect={startLogin} />
          ) : (
            selectedRole && (
              <LoginForm
                role={selectedRole}
                onBack={goBack}
                onLoginSuccess={onLoginSuccess}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ role, activePage, setActivePage }) {
  const navigate = useNavigate();
  const isStudent = role === "student";

  const mainItems = isStudent
    ? [
        { label: "Dashboard", icon: "⊞" },
        { label: "Browse Projects", icon: "⬡" },
        { label: "My Applications", icon: "⊕" },
        { label: "My Collaborations", icon: "◈" },
        { label: "Team", icon: "◎" },
        { label: "Grades", icon: "★" },
      ]
    : [
        { label: "Dashboard", icon: "⊞" },
        { label: "Applications", icon: "⊕" },
        { label: "My Projects", icon: "⬡" },
        { label: "Students", icon: "◎" },
        { label: "Reports", icon: "★" },
      ];

  const bottomItems = [{ label: "Profile", icon: "👤" }];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sb-brand">
          <div className="sb-logo"><Logo /></div>
          <span>DevCollab</span>
        </div>
        <div className="sb-role-pill">
          {isStudent ? "🎓 Student" : "🏛️ Faculty"}
        </div>
        <nav className="sb-nav">
          {mainItems.map((item) => (
            <div
              className={`sb-nav-item ${activePage === item.label ? "active" : ""}`}
              key={item.label}
              onClick={() => setActivePage(item.label)}
            >
              <span className="sb-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom-section">
        <div className="sb-bottom">
          {bottomItems.map((item) => (
            <div
              className={`sb-nav-item ${activePage === item.label ? "active" : ""}`}
              key={item.label}
              onClick={() => setActivePage(item.label)}
            >
              <span className="sb-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <button className="sb-logout" onClick={() => { clearSession(); navigate("/"); }} style={{ marginTop: "12px" }}>← Log out</button>
      </div>
    </aside>
  );
}

// ── Apply Modal ────────────────────────────────────────────────────────────────
function ApplyModal({ project, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", email: "", skills: "", resume: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError(null);
    if (!validateForm({ name: form.name, email: form.email, skills: form.skills }, setError)) return;
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ ...form, projectId: project.id, projectTitle: project.title, status: "Pending", appliedAt: new Date().toLocaleDateString() });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="modal-success">
            <div className="success-icon">✓</div>
            <h2>Application Sent!</h2>
            <p>Your application for <strong>{project.title}</strong> has been submitted.</p>
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div>
                <h2>Apply for Project</h2>
                <p className="modal-sub">{project.title} · {project.faculty || project.ownerName}</p>
              </div>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-project-info">
                <p>{project.description}</p>
                <span className="skills-needed">Skills needed: {project.skills}</span>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-row">
                <div className="input-field">
                  <label>Full Name *</label>
                  <div className="input-wrap">
                    <input name="name" placeholder="Your full name" value={form.name} onChange={handle} />
                  </div>
                </div>
                <div className="input-field">
                  <label>Email *</label>
                  <div className="input-wrap">
                    <input name="email" type="email" placeholder="alex@university.edu" value={form.email} onChange={handle} />
                  </div>
                </div>
              </div>

              <div className="input-field">
                <label>Your Skills *</label>
                <div className="input-wrap">
                  <input name="skills" placeholder="e.g. Python, React, Machine Learning" value={form.skills} onChange={handle} />
                </div>
              </div>

              <div className="input-field">
                <label>Resume Link</label>
                <div className="input-wrap">
                  <input name="resume" placeholder="https://drive.google.com/..." value={form.resume} onChange={handle} />
                </div>
              </div>

              <div className="input-field">
                <label>Why this project?</label>
                <textarea name="message" className="modal-textarea" placeholder="Tell the faculty why you're a great fit..." value={form.message} onChange={handle} rows={3} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost-cancel" onClick={onClose} disabled={loading}>Cancel</button>
              <button className="btn-primary" onClick={submit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Application →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Create Project Modal ───────────────────────────────────────────────────────
function CreateProjectModal({ onClose, onSubmit, ownerName }) {
  const [form, setForm] = useState({ title: "", skills: "", slots: "", description: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError(null);
    if (!validateForm({ title: form.title, skills: form.skills, slots: form.slots, description: form.description }, setError)) return;
    if (isNaN(form.slots) || parseInt(form.slots) <= 0) {
      setError("Please enter a valid number of slots");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        id: Date.now(),
        faculty: ownerName || "Faculty",
        slots: parseInt(form.slots),
        type: "faculty",
        createdBy: "faculty",
        ownerName: ownerName || "Faculty"
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Create New Project</h2>
            <p className="modal-sub">Post a project for students to apply</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="input-field">
            <label>Project Title *</label>
            <div className="input-wrap">
              <input name="title" placeholder="e.g. AI Research Assistant" value={form.title} onChange={handle} />
            </div>
          </div>

          <div className="input-field">
            <label>Skills Required *</label>
            <div className="input-wrap">
              <input name="skills" placeholder="e.g. Python, ML, NLP" value={form.skills} onChange={handle} />
            </div>
          </div>

          <div className="input-field">
            <label>Available Slots *</label>
            <div className="input-wrap">
              <input name="slots" type="number" placeholder="e.g. 3" value={form.slots} onChange={handle} />
            </div>
          </div>

          <div className="input-field">
            <label>Project Description *</label>
            <textarea name="description" className="modal-textarea" placeholder="Describe the project requirements and goals..." value={form.description} onChange={handle} rows={4} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Creating..." : "Create Project →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Student Collaboration Project Modal ───────────────────────────────────────────────────────────
function CreateStudentProjectModal({ onClose, onSubmit, ownerName }) {
  const [form, setForm] = useState({ title: "", skills: "", slots: "", description: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError(null);
    if (!validateForm({ title: form.title, skills: form.skills, slots: form.slots, description: form.description }, setError)) return;
    if (isNaN(form.slots) || parseInt(form.slots) <= 0) {
      setError("Please enter a valid number of slots");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        id: Date.now(),
        slots: parseInt(form.slots),
        type: "student",
        createdBy: "student",
        ownerName: ownerName || "Student"
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Create Collaboration Project</h2>
            <p className="modal-sub">Find teammates for your student project</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="input-field">
            <label>Project Title *</label>
            <div className="input-wrap">
              <input name="title" placeholder="e.g. Mobile Game Development" value={form.title} onChange={handle} />
            </div>
          </div>

          <div className="input-field">
            <label>Skills Required *</label>
            <div className="input-wrap">
              <input name="skills" placeholder="e.g. Swift, Game Design, 3D Modeling" value={form.skills} onChange={handle} />
            </div>
          </div>

          <div className="input-field">
            <label>Team Size (Slots) *</label>
            <div className="input-wrap">
              <input name="slots" type="number" placeholder="e.g. 4" value={form.slots} onChange={handle} />
            </div>
          </div>

          <div className="input-field">
            <label>Project Description *</label>
            <textarea name="description" className="modal-textarea" placeholder="Describe your project idea and what you're building..." value={form.description} onChange={handle} rows={4} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Creating..." : "Create Project →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const isSaveDisabled = !form.name?.trim() || !form.email?.trim() || loading;

  const handleSave = async () => {
    setError(null);
    if (!validateForm({ name: form.name, email: form.email }, setError)) return;
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
        {saved ? (
          <div className="modal-success" style={{ textAlign: "center", padding: "40px" }}>
            <div className="success-icon" style={{ fontSize: "48px", marginBottom: "16px", color: "#34d399"}}>✓</div>
            <h2>Saved Successfully!</h2>
            <p style={{ color: "rgba(255,255,255,0.7)" }}>Your profile has been updated.</p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div><h2>Edit Profile</h2></div>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="input-field">
                <label>Name *</label>
                <div className="input-wrap">
                  <input name="name" placeholder="Your full name" value={form.name} onChange={handle} />
                </div>
              </div>

              <div className="input-field">
                <label>Email *</label>
                <div className="input-wrap">
                  <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handle} />
                </div>
              </div>

              <div className="input-field">
                <label>Bio</label>
                <textarea name="bio" className="modal-textarea" placeholder="Tell us about yourself..." value={form.bio} onChange={handle} rows={4} />
              </div>

              <div className="input-field">
                <label>Resume Link</label>
                <div className="input-wrap">
                  <input name="resume" placeholder="https://drive.google.com/..." value={form.resume} onChange={handle} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost-cancel" onClick={onClose}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleSave} 
                disabled={isSaveDisabled}
                style={{ opacity: isSaveDisabled ? 0.5 : 1, cursor: isSaveDisabled ? "not-allowed" : "pointer" }}
              >
                {loading ? "Saving..." : "Save Changes →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
          </div>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: "rgba(255,255,255,0.8)", margin: 0 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => dismiss(t.id)}
        >
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Project Details Modal ─────────────────────────────────────────────────────
function ProjectDetailsModal({ project, applications, onClose, onApply }) {
  const isFaculty = project.type === "faculty";
  const alreadyApplied = applications.some(a => a.projectId === project.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className={`project-type-badge ${isFaculty ? "badge-faculty" : "badge-student"}`}>
                {isFaculty ? "Faculty Project" : "Student Collaboration"}
              </span>
            </div>
            <h2>{project.title}</h2>
            <p className="modal-sub">{project.faculty || project.ownerName} · {project.slots} open slots</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="proj-detail-section">
            <span className="proj-detail-label">About this project</span>
            <p className="proj-detail-desc">{project.description}</p>
          </div>

          <div className="proj-detail-section">
            <span className="proj-detail-label">Skills required</span>
            <div className="skills-tags" style={{ marginTop: "8px" }}>
              {project.skills.split(",").map(s => (
                <span className="skill-tag" key={s}>{s.trim()}</span>
              ))}
            </div>
          </div>

          <div className="proj-detail-meta-row">
            <div className="proj-detail-meta-item">
              <span className="proj-detail-label">Owner</span>
              <span className="proj-detail-value">{project.faculty || project.ownerName}</span>
            </div>
            <div className="proj-detail-meta-item">
              <span className="proj-detail-label">Open Slots</span>
              <span className="proj-detail-value">{project.slots}</span>
            </div>
            <div className="proj-detail-meta-item">
              <span className="proj-detail-label">Type</span>
              <span className="proj-detail-value">{isFaculty ? "Faculty" : "Student"}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost-cancel" onClick={onClose}>Close</button>
          {alreadyApplied ? (
            <span className="applied-badge" style={{ padding: "10px 20px" }}>✓ Already Applied</span>
          ) : (
            <button className="btn-primary" onClick={() => { onApply(project); onClose(); }}>
              Apply Now →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Notifications Modal ───────────────────────────────────────────────────────
function NotificationsModal({ notifications, onClose }) {
  const typeIcon = (type) => {
    if (type === "accepted") return "✅";
    if (type === "rejected") return "❌";
    if (type === "pending")  return "⏳";
    if (type === "project")  return "⬡";
    return "🔔";
  };

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notif-header">
          <div className="notif-title-row">
            <h2 className="notif-title">Notifications</h2>
            {notifications.length > 0 && (
              <span className="notif-count">{notifications.length}</span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="notif-body">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <span className="notif-empty-icon">🔕</span>
              <p>You're all caught up</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div className="notif-item" key={i}>
                <div className="notif-icon">{typeIcon(n.type)}</div>
                <div className="notif-content">
                  <p className="notif-text">{n.text}</p>
                  <span className="notif-date">{n.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Student Dashboard ──────────────────────────────────────────────────────────
function StudentDashboard({ profile, saveProfile }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [applications, setApplications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewProject, setViewProject] = useState(null);
  const { toasts, push: pushToast, dismiss: dismissToast } = useToast();

  const currentUserName  = profile.name  || "User";

  // ── Load all data from backend ─────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [apps, projs] = await Promise.all([
        api.applications.getAll(),
        api.projects.getAll(),
      ]);
      setApplications(apps);
      setProjects(projs);
    } catch (err) {
      setError(err.message || "Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Student submits an application ────────────────────────────
  const applyToProject = async (app) => {
    setSaving(true);
    try {
      await api.applications.submit({
        projectId:  app.projectId,
        skills:     app.skills,
        resumeLink: app.resume,
        message:    app.message,
      });
      await fetchData();
      pushToast("Application submitted successfully!", "success");
    } catch (err) {
      pushToast(err.message || "Failed to submit application", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Student creates a collaboration project ────────────────────
  const createStudentProject = async (project) => {
    setSaving(true);
    try {
      const created = await api.projects.create(project);
      await fetchData();
      setShowCreateModal(false);
      pushToast(`Project "${created.title}" created!`, "success");
    } catch (err) {
      pushToast(err.message || "Failed to create project", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Student-project owner accepts/rejects applicants ──────────
  const handleApplicantResponse = async (appId, status) => {
    setSaving(true);
    try {
      await api.applications.update(appId, { status });
      await fetchData();
      pushToast(
        `Application ${status.toLowerCase()}`,
        status === "Accepted" ? "success" : "info"
      );
    } catch (err) {
      pushToast(err.message || "Failed to update application", "error");
    } finally {
      setSaving(false);
    }
  };

  const myStudentProjects       = projects.filter(p => p.type === "student" && p.ownerName === currentUserName);
  const applicantsForMyProjects = applications.filter(app =>
    myStudentProjects.some(p => p.id === app.projectId)
  );

  // ── Loading / error guards ─────────────────────────────────────
  if (loading) return (
    <div className="app-layout">
      <Sidebar role="student" activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading your dashboard…</p>
        </div>
      </main>
    </div>
  );

  if (error && !applications.length && !projects.length) return (
    <div className="app-layout">
      <Sidebar role="student" activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <div className="dashboard-error">
          <span className="error-icon">⚠️</span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchData}>Try again</button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar role="student" activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        {error && (
          <div className="error-toast" onClick={() => setError(null)}>
            ⚠️ {error} <span className="error-toast-close">✕</span>
          </div>
        )}

        {/* ── Dashboard Page ── */}
        {activePage === "Dashboard" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">Student Dashboard</h1>
                <p className="page-sub">Welcome back, {currentUserName} </p>
              </div>
              <div className="topbar-actions">
                <button className="btn-ghost notif-bell" onClick={() => setShowNotifications(true)}>
                  🔔
                  {applications.some(a => a.status !== "Pending") && (
                    <span className="notif-dot" />
                  )}
                </button>
                <div className="avatar" onClick={() => setActivePage("Profile")}>{profile.name ? profile.name.charAt(0).toUpperCase() : "U"}</div>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card accent-indigo"><span className="stat-val">{projects.length}</span><span className="stat-lbl">Open Projects</span></div>
              <div className="stat-card accent-amber"><span className="stat-val">{applications.length}</span><span className="stat-lbl">My Applications</span></div>
              <div className="stat-card accent-teal"><span className="stat-val">{applications.filter(a => a.status === "Accepted").length}</span><span className="stat-lbl">Accepted</span></div>
              <div className="stat-card accent-green"><span className="stat-val">{myStudentProjects.length}</span><span className="stat-lbl">My Collaborations</span></div>
            </div>
            <div className="section-header">
              <h2 className="section-title">Available Projects</h2>
              <div className="topbar-actions">
                <button className="btn-ghost-secondary" onClick={() => setShowCreateModal(true)}>+ Create Collaboration Project</button>
                <button className="btn-primary" onClick={() => setActivePage("Browse Projects")}>Browse All →</button>
              </div>
            </div>
            <div className="cards-grid">
              {projects.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                  <div className="empty-icon">📂</div>
                  <h3>No projects available</h3>
                  <p>Check back soon for new opportunities</p>
                </div>
              ) : projects.slice(0, 3).map((p) => {
                const alreadyApplied = applications.some(a => a.projectId === p.id);
                const isFacultyProject = p.type === "faculty";
                const isOwnProject = p.ownerName && p.ownerName === currentUserName;
                return (
                  <div className="p-card" key={p.id} onClick={() => setViewProject(p)}>
                    <div className={`p-tag ${isFacultyProject ? "tag-indigo" : "tag-teal"}`}>
                      {isFacultyProject ? "Faculty" : "Student"}
                    </div>
                    <h3 className="p-name">{p.title}</h3>
                    <p className="p-due">{isFacultyProject ? p.faculty : p.ownerName} · {p.slots} slots</p>
                    <p className="p-desc">{p.description}</p>
                    {isOwnProject && (
                      <button className="btn-ghost-secondary" onClick={(e) => { e.stopPropagation(); setActivePage("My Collaborations"); }}>Manage →</button>
                    )}
                    {!isOwnProject && alreadyApplied && (
                      <span className="applied-badge">✓ Applied</span>
                    )}
                    {!isOwnProject && !alreadyApplied && (
                      <button
                        className="btn-apply"
                        disabled={saving}
                        onClick={(e) => { e.stopPropagation(); setSelectedProject(p); }}
                      >Apply Now →</button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Browse Projects Page ── */}
        {activePage === "Browse Projects" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">Browse Projects</h1>
                <p className="page-sub">Find and apply to faculty and student collaboration projects</p>
              </div>
            </div>
            <div className="projects-list">
              {projects.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h3>No projects available</h3>
                  <p>Check back soon for new opportunities</p>
                </div>
              ) : projects.map((p) => {
                const alreadyApplied = applications.some(a => a.projectId === p.id);
                const isFacultyProject = p.type === "faculty";
                const isOwnProject = p.ownerName && p.ownerName === currentUserName;
                const projectApplicants = applications.filter(a => a.projectId === p.id);
                return (
                  <div className="project-row" key={p.id} onClick={() => setViewProject(p)}>
                    <div className="project-row-left">
                      <div className="project-row-icon">⬡</div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h3 className="project-row-title">{p.title}</h3>
                          <span className={`project-type-badge ${isFacultyProject ? "badge-faculty" : "badge-student"}`}>
                            {isFacultyProject ? "Faculty Project" : "Student Collaboration"}
                          </span>
                        </div>
                        <p className="project-row-meta">
                          {isFacultyProject ? p.faculty : p.ownerName} · {p.slots} open slots
                          {projectApplicants.length > 0 && !isFacultyProject && (
                            <span> · {projectApplicants.length} applicant{projectApplicants.length !== 1 ? "s" : ""}</span>
                          )}
                        </p>
                        <p className="project-row-desc">{p.description}</p>
                        <div className="skills-tags">
                          {p.skills.split(",").map(s => (
                            <span className="skill-tag" key={s}>{s.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="project-row-right">
                      {isOwnProject ? (
                        <button className="btn-ghost-secondary" onClick={(e) => { e.stopPropagation(); setActivePage("My Collaborations"); }}>
                          Manage →
                        </button>
                      ) : alreadyApplied ? (
                        <span className="applied-badge">✓ Applied</span>
                      ) : (
                        <button
                          className="btn-apply"
                          disabled={saving}
                          onClick={(e) => { e.stopPropagation(); setSelectedProject(p); }}
                        >Apply Now →</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── My Applications Page ── */}
        {activePage === "My Applications" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">My Applications</h1>
                <p className="page-sub">Track the status of your project applications</p>
              </div>
            </div>
            {applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No applications yet</h3>
                <p>Browse projects and apply to get started</p>
                <button className="btn-primary" onClick={() => setActivePage("Browse Projects")}>Browse Projects</button>
              </div>
            ) : (
              <div className="applications-list">
                {applications.map((app, i) => (
                  <div className="app-row" key={i}>
                    <div className="app-row-left">
                      <div className={`status-dot ${app.status === "Accepted" ? "dot-green" : app.status === "Rejected" ? "dot-red" : "dot-amber"}`} />
                      <div>
                        <h3 className="app-row-title">{app.projectTitle}</h3>
                        <p className="app-row-meta">Applied on {app.appliedAt} · Skills: {app.skills}</p>
                      </div>
                    </div>
                    <span className={`status-badge badge-${app.status === "Accepted" ? "green" : app.status === "Rejected" ? "red" : "amber"}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Collaborations Page ── */}
        {activePage === "My Collaborations" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">My Collaborations</h1>
                <p className="page-sub">Manage projects you've created and review applicants</p>
              </div>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Project</button>
            </div>
            
            {myStudentProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚀</div>
                <h3>No collaboration projects yet</h3>
                <p>Create a project to find teammates for your ideas</p>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Collaboration Project</button>
              </div>
            ) : (
              <>
                {myStudentProjects.map((p) => {
                  const projectApplicants = applicantsForMyProjects.filter(a => a.projectId === p.id);
                  const pendingApplicants = projectApplicants.filter(a => a.status === "Pending");
                  const acceptedApplicants = projectApplicants.filter(a => a.status === "Accepted");
                  
                  return (
                    <div key={p.id}>
                      <div className="collab-project-card">
                        <div className="collab-project-header">
                          <div>
                            <h3 className="collab-project-title">{p.title}</h3>
                            <p className="collab-project-meta">
                              {p.slots} slots · {acceptedApplicants.length} accepted · {projectApplicants.length} total applicants
                            </p>
                          </div>
                          <span className={`status-badge ${pendingApplicants.length > 0 ? "badge-amber" : "badge-green"}`}>
                            {pendingApplicants.length > 0 ? `${pendingApplicants.length} Pending` : "All Reviewed"}
                          </span>
                        </div>
                        
                        <div className="collab-project-body">
                          <p className="collab-desc">{p.description}</p>
                          <div className="skills-tags" style={{marginTop: "12px"}}>
                            {p.skills.split(",").map(s => (
                              <span className="skill-tag" key={s}>{s.trim()}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {projectApplicants.length === 0 ? (
                        <div className="empty-state" style={{marginBottom: "24px"}}>
                          <div className="empty-icon">📭</div>
                          <p>No applicants yet</p>
                        </div>
                      ) : (
                        <div className="faculty-apps-list">
                          {projectApplicants.map((app, i) => (
                            <div className="faculty-app-card" key={i}>
                              <div className="fac-app-top">
                                <div className="fac-app-avatar">{app.name?.charAt(0) || "?"}</div>
                                <div className="fac-app-info">
                                  <h3 className="fac-app-name">{app.name}</h3>
                                  <p className="fac-app-meta">{app.email} · Applied {app.appliedAt}</p>
                                </div>
                                <span className={`status-badge badge-${app.status === "Accepted" ? "green" : app.status === "Rejected" ? "red" : "amber"}`}>
                                  {app.status}
                                </span>
                              </div>

                              <div className="fac-app-body">
                                <div className="fac-app-field">
                                  <span className="fac-field-label">Skills</span>
                                  <span className="fac-field-value">{app.skills}</span>
                                </div>
                                {app.resume && (
                                  <div className="fac-app-field">
                                    <span className="fac-field-label">Resume</span>
                                    <a href={app.resume} target="_blank" rel="noreferrer" className="fac-field-link">View Resume ↗</a>
                                  </div>
                                )}
                                {app.message && (
                                  <div className="fac-app-field full">
                                    <span className="fac-field-label">Message</span>
                                    <span className="fac-field-value">{app.message}</span>
                                  </div>
                                )}
                              </div>

                              {app.status === "Pending" && (
                                <div className="fac-app-actions">
                                  <button
                                    className="btn-accept"
                                    onClick={() => handleApplicantResponse(app.id, "Accepted")}
                                  >
                                    ✓ Accept
                                  </button>
                                  <button
                                    className="btn-reject"
                                    onClick={() => handleApplicantResponse(app.id, "Rejected")}
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── Team Page ── */}
        {activePage === "Team" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">My Team</h1>
                <p className="page-sub">People you're collaborating with on accepted projects</p>
              </div>
            </div>

            {applications.filter(a => a.status === "Accepted").length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No team yet</h3>
                <p>Get accepted to a project to see your team here</p>
                <button className="btn-primary" onClick={() => setActivePage("Browse Projects")}>Browse Projects</button>
              </div>
            ) : (
              <div className="team-grid">
                {applications.filter(a => a.status === "Accepted").map((app, i) => {
                  const project = projects.find(p => p.id === app.projectId);
                  const teammates = applications.filter(
                    a => a.projectId === app.projectId && a.status === "Accepted" && a.email !== app.email
                  );
                  return (
                    <div className="team-card" key={i}>
                      <div className="team-card-header">
                        <div className="team-project-icon">⬡</div>
                        <div>
                          <h3 className="team-project-title">{app.projectTitle}</h3>
                          <p className="team-project-meta">
                            {project ? (project.faculty || project.ownerName) : "—"} · {project?.slots || "—"} slots
                          </p>
                        </div>
                        <span className="status-badge badge-green">Active</span>
                      </div>

                      <div className="team-you-row">
                        <div className="team-member-avatar you">{currentUserName.charAt(0).toUpperCase()}</div>
                        <div className="team-member-info">
                          <span className="team-member-name">{currentUserName} <span className="team-you-tag">You</span></span>
                          <span className="team-member-role">Contributor · {app.skills}</span>
                        </div>
                      </div>

                      {teammates.length > 0 && (
                        <div className="team-members-list">
                          <span className="team-section-label">Teammates</span>
                          {teammates.map((t, j) => (
                            <div className="team-member-row" key={j}>
                              <div className="team-member-avatar">{t.name?.charAt(0)?.toUpperCase() || "?"}</div>
                              <div className="team-member-info">
                                <span className="team-member-name">{t.name}</span>
                                <span className="team-member-role">{t.email} · {t.skills}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="team-skills-row">
                        <span className="team-section-label">Project Skills</span>
                        <div className="skills-tags" style={{ marginTop: "6px" }}>
                          {(project?.skills || app.skills).split(",").map(s => (
                            <span className="skill-tag" key={s}>{s.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Grades Page ── */}
        {activePage === "Grades" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">My Performance</h1>
                <p className="page-sub">Your project ratings, feedback, and skills gained</p>
              </div>
              {applications.filter(a => a.status === "Accepted" && a.rating).length > 0 && (
                <div className="grades-avg-badge">
                  <span className="grades-avg-stars">
                    {"⭐".repeat(Math.round(
                      applications.filter(a => a.status === "Accepted" && a.rating)
                        .reduce((sum, a) => sum + parseFloat(a.rating || 0), 0) /
                      applications.filter(a => a.status === "Accepted" && a.rating).length
                    ))}
                  </span>
                  <span className="grades-avg-label">
                    {(
                      applications.filter(a => a.status === "Accepted" && a.rating)
                        .reduce((sum, a) => sum + parseFloat(a.rating || 0), 0) /
                      applications.filter(a => a.status === "Accepted" && a.rating).length
                    ).toFixed(1)} avg
                  </span>
                </div>
              )}
            </div>

            {applications.filter(a => a.status === "Accepted").length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No grades yet</h3>
                <p>Get accepted to projects to see your performance here</p>
              </div>
            ) : (
              <div className="grades-grid">
                {applications.filter(a => a.status === "Accepted").map((app, i) => {
                  const rating = parseFloat(app.rating) || 0;
                  const fullStars = Math.floor(rating);
                  const hasHalf = rating - fullStars >= 0.5;
                  const starsDisplay = "⭐".repeat(fullStars) + (hasHalf ? "✨" : "");

                  return (
                    <div className="grade-card" key={i}>
                      <div className="grade-card-header">
                        <div className="grade-project-icon">⬡</div>
                        <div className="grade-project-info">
                          <h3 className="grade-project-title">{app.projectTitle}</h3>
                          <p className="grade-project-meta">Completed · {app.appliedAt}</p>
                        </div>
                        <span className="status-badge badge-green">Accepted</span>
                      </div>

                      <div className="grade-rating-row">
                        {rating > 0 ? (
                          <>
                            <span className="grade-stars">{starsDisplay}</span>
                            <span className="grade-score">{rating.toFixed(1)} / 5.0</span>
                          </>
                        ) : (
                          <span className="grade-no-rating">Not rated yet</span>
                        )}
                      </div>

                      {app.feedback ? (
                        <div className="grade-feedback-block">
                          <span className="grade-section-label">Faculty Feedback</span>
                          <p className="grade-feedback">"{app.feedback}"</p>
                        </div>
                      ) : (
                        <p className="grade-no-feedback">No feedback provided yet</p>
                      )}

                      <div className="grade-skills-block">
                        <span className="grade-section-label">Skills Gained</span>
                        <div className="skills-tags" style={{ marginTop: "8px" }}>
                          {app.skillsGained
                            ? app.skillsGained.split(",").map(s => (
                                <span className="skill-tag skill-tag-gained" key={s}>{s.trim()}</span>
                              ))
                            : <span className="grade-no-feedback">No skills recorded yet</span>
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Profile Page ── */}
        {activePage === "Profile" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">My Profile</h1>
                <p className="page-sub">View and manage your profile information</p>
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-avatar">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{profile.name || "Your Name"}</h2>
                <p className="profile-email">{profile.email || "your@email.com"}</p>
                <p className="profile-bio">{profile.bio || "Add a short bio about yourself to let others know your skills and interests..."}</p>
                {profile.resume && (
                  <a href={profile.resume} target="_blank" rel="noreferrer" className="btn-resume">
                    View Resume ↗
                  </a>
                )}
              </div>
              <button className="btn-primary btn-edit-profile" onClick={() => setEditProfile(true)}>
                Edit Profile
              </button>
            </div>
          </>
        )}

      </main>

      {selectedProject && (
        <ApplyModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onSubmit={(app) => { applyToProject(app); setSelectedProject(null); }}
        />
      )}

      {viewProject && (
        <ProjectDetailsModal
          project={viewProject}
          applications={applications}
          onClose={() => setViewProject(null)}
          onApply={(p) => { setSelectedProject(p); setViewProject(null); }}
        />
      )}

      {showCreateModal && (
        <CreateStudentProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createStudentProject}
          ownerName={currentUserName}
        />
      )}

      {editProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditProfile(false)}
          onSave={saveProfile}
        />
      )}

      {showNotifications && (
        <NotificationsModal
          notifications={[
            ...applications.map(app => ({
              type: app.status === "Accepted" ? "accepted" : app.status === "Rejected" ? "rejected" : "pending",
              text: app.status === "Pending"
                ? `Application submitted for "${app.projectTitle}"`
                : `Your application for "${app.projectTitle}" was ${app.status.toLowerCase()}`,
              date: app.appliedAt || "Recently",
            })),
            ...projects.slice(0, 5).map(p => ({
              type: "project",
              text: `New project available: "${p.title}"`,
              date: "Recently",
            })),
          ]}
          onClose={() => setShowNotifications(false)}
        />
      )}
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}

// ── Faculty Dashboard ──────────────────────────────────────────────────────────
function FacultyDashboard({ profile, saveProfile }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [applications, setApplications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const currentUserName  = profile.name  || "Faculty";

  const [editProfile, setEditProfile] = useState(false);
  const { toasts, push: pushToast, dismiss: dismissToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // ── Load all data from backend ─────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [apps, projs] = await Promise.all([
        api.applications.getAll(),
        api.projects.getAll(),
      ]);
      setApplications(apps);
      setProjects(projs.filter(p => p.type === "faculty"));
    } catch (err) {
      setError(err.message || "Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Accept / Reject an application ────────────────────────────
  const updateStatus = async (appId, status) => {
    setSaving(true);
    try {
      await api.applications.update(appId, { status });
      await fetchData();
      pushToast(
        `Application ${status.toLowerCase()}`,
        status === "Accepted" ? "success" : status === "Rejected" ? "error" : "info"
      );
    } catch (err) {
      pushToast(err.message || "Failed to update application", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Update grade fields (rating / feedback / skillsGained) ────
  const updateGrade = async (appId, field, value) => {
    try {
      await api.applications.update(appId, { [field]: value });
      await fetchData();
      pushToast("Grade saved", "success");
    } catch (err) {
      pushToast(err.message || "Failed to save grade", "error");
    }
  };

  // ── Create a new faculty project ──────────────────────────────
  const createProject = async (project) => {
    setSaving(true);
    try {
      const created = await api.projects.create(project);
      await fetchData();
      setShowCreateModal(false);
      pushToast(`Project "${created.title}" created!`, "success");
    } catch (err) {
      pushToast(err.message || "Failed to create project", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete a faculty project ───────────────────────────────────
  const deleteProject = async (project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setSaving(true);
    try {
      await api.projects.remove(projectToDelete.id);
      await fetchData();
      pushToast(`"${projectToDelete.title}" deleted`, "info");
    } catch (err) {
      pushToast(err.message || "Failed to delete project", "error");
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  // ── Loading / error guards ─────────────────────────────────────
  if (loading) return (
    <div className="app-layout">
      <Sidebar role="faculty" activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading your dashboard…</p>
        </div>
      </main>
    </div>
  );

  if (error && !applications.length && !projects.length) return (
    <div className="app-layout">
      <Sidebar role="faculty" activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <div className="dashboard-error">
          <span className="error-icon">⚠️</span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchData}>Try again</button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar role="faculty" activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        {error && (
          <div className="error-toast" onClick={() => setError(null)}>
            ⚠️ {error} <span className="error-toast-close">✕</span>
          </div>
        )}

        {/* ── Dashboard Page ── */}
        {activePage === "Dashboard" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">Faculty Dashboard</h1>
                <p className="page-sub">Welcome back, {currentUserName} 👋</p>
              </div>
              <div className="topbar-actions">
                <button className="btn-ghost notif-bell" onClick={() => setShowNotifications(true)}>
                  🔔
                  {applications.some(a => a.status === "Pending") && (
                    <span className="notif-dot" />
                  )}
                </button>
                <div className="avatar fac" onClick={() => setActivePage("Profile")}>{profile.name ? profile.name.charAt(0).toUpperCase() : "P"}</div>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card accent-indigo"><span className="stat-val">{applications.length}</span><span className="stat-lbl">Total Applications</span></div>
              <div className="stat-card accent-amber"><span className="stat-val">{applications.filter(a => a.status === "Pending").length}</span><span className="stat-lbl">Pending Review</span></div>
              <div className="stat-card accent-green"><span className="stat-val">{applications.filter(a => a.status === "Accepted").length}</span><span className="stat-lbl">Accepted</span></div>
              <div className="stat-card accent-teal"><span className="stat-val">{projects.length}</span><span className="stat-lbl">Active Projects</span></div>
            </div>
            <div className="section-header">
              <h2 className="section-title">Recent Applications</h2>
              <button className="btn-primary" onClick={() => setActivePage("Applications")}>View All →</button>
            </div>
            {applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No applications yet</h3>
                <p>Students haven't applied to your projects yet</p>
              </div>
            ) : (
              <div className="applications-list">
                {applications.slice(0, 3).map((app, i) => (
                  <div className="app-row" key={i}>
                    <div className="app-row-left">
                      <div className={`status-dot ${app.status === "Accepted" ? "dot-green" : app.status === "Rejected" ? "dot-red" : "dot-amber"}`} />
                      <div>
                        <h3 className="app-row-title">{app.name} → {app.projectTitle}</h3>
                        <p className="app-row-meta">{app.email} · {app.skills}</p>
                      </div>
                    </div>
                    <span className={`status-badge badge-${app.status === "Accepted" ? "green" : app.status === "Rejected" ? "red" : "amber"}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Applications Page ── */}
        {activePage === "Applications" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">Applications</h1>
                <p className="page-sub">Review and manage student applications</p>
              </div>
            </div>
            {applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No applications yet</h3>
                <p>Students haven't applied to your projects yet</p>
              </div>
            ) : (
              <div className="faculty-apps-list">
                {applications.map((app, i) => (
                  <div className="faculty-app-card" key={i}>
                    <div className="fac-app-top">
                      <div className="fac-app-avatar">{app.name?.charAt(0) || "?"}</div>
                      <div className="fac-app-info">
                        <h3 className="fac-app-name">{app.name}</h3>
                        <p className="fac-app-meta">{app.email} · Applied {app.appliedAt}</p>
                      </div>
                      <span className={`status-badge badge-${app.status === "Accepted" ? "green" : app.status === "Rejected" ? "red" : "amber"}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="fac-app-body">
                      <div className="fac-app-field">
                        <span className="fac-field-label">Project</span>
                        <span className="fac-field-value">{app.projectTitle}</span>
                      </div>
                      <div className="fac-app-field">
                        <span className="fac-field-label">Skills</span>
                        <span className="fac-field-value">{app.skills}</span>
                      </div>
                      {app.resume && (
                        <div className="fac-app-field">
                          <span className="fac-field-label">Resume</span>
                          <a href={app.resume} target="_blank" rel="noreferrer" className="fac-field-link">View Resume ↗</a>
                        </div>
                      )}
                      {app.message && (
                        <div className="fac-app-field full">
                          <span className="fac-field-label">Message</span>
                          <span className="fac-field-value">{app.message}</span>
                        </div>
                      )}
                    </div>

                    {app.status === "Pending" && (
                      <div className="fac-app-actions">
                        <button className="btn-accept" disabled={saving} onClick={() => updateStatus(app.id, "Accepted")}>✓ Accept</button>
                        <button className="btn-reject" disabled={saving} onClick={() => updateStatus(app.id, "Rejected")}>✕ Reject</button>
                      </div>
                    )}

                    {app.status === "Accepted" && (
                      <div className="grade-inputs">
                        <span className="grade-inputs-label">📊 Grade this student</span>
                        <div className="grade-inputs-row">
                          <div className="grade-input-wrap">
                            <label className="grade-input-label">Rating (1–5)</label>
                            <input
                              className="grade-input"
                              type="number"
                              min="1"
                              max="5"
                              step="0.5"
                              placeholder="e.g. 4.5"
                              defaultValue={app.rating || ""}
                              onBlur={(e) => updateGrade(app.id, "rating", e.target.value)}
                            />
                          </div>
                          <div className="grade-input-wrap grade-input-grow">
                            <label className="grade-input-label">Skills Gained</label>
                            <input
                              className="grade-input"
                              placeholder="e.g. Python, ML, React"
                              defaultValue={app.skillsGained || ""}
                              onBlur={(e) => updateGrade(app.id, "skillsGained", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grade-input-wrap">
                          <label className="grade-input-label">Feedback</label>
                          <input
                            className="grade-input"
                            placeholder="e.g. Great work on the ML models, showed strong initiative"
                            defaultValue={app.feedback || ""}
                            onBlur={(e) => updateGrade(app.id, "feedback", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Projects Page ── */}
        {activePage === "My Projects" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">My Projects</h1>
                <p className="page-sub">Projects you've posted for students</p>
              </div>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Add Project</button>
            </div>
            <div className="cards-grid">
              {projects.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                  <div className="empty-icon">📂</div>
                  <h3>No projects yet</h3>
                  <p>Create your first project to start receiving applications</p>
                  <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Add Project</button>
                </div>
              ) : projects.map((p) => (
                <div className="p-card" key={p.id}>
                  <div className="p-card-top-row">
                    <div className="p-tag tag-indigo">{p.skills.split(",")[0]}</div>
                    <button
                      className="btn-delete-project"
                      disabled={saving}
                      title="Delete project"
                      onClick={(e) => { e.stopPropagation(); deleteProject(p); }}
                    >
                      🗑
                    </button>
                  </div>
                  <h3 className="p-name">{p.title}</h3>
                  <p className="p-due">{p.slots} open slots · {applications.filter(a => a.projectId === p.id).length} applicants</p>
                  <p className="p-desc">{p.description}</p>
                  <div className="skills-tags" style={{marginTop: "8px"}}>
                    {p.skills.split(",").map(s => (
                      <span className="skill-tag" key={s}>{s.trim()}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Students Page ── */}
        {activePage === "Students" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">Students</h1>
                <p className="page-sub">Manage all student applications to your projects</p>
              </div>
              <div className="students-summary">
                <span className="students-stat"><span className="students-stat-val">{applications.length}</span> Total</span>
                <span className="students-stat accent-amber"><span className="students-stat-val">{applications.filter(a => a.status === "Pending").length}</span> Pending</span>
                <span className="students-stat accent-green"><span className="students-stat-val">{applications.filter(a => a.status === "Accepted").length}</span> Accepted</span>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎓</div>
                <h3>No students yet</h3>
                <p>No one has applied to your projects yet</p>
              </div>
            ) : (
              <div className="students-grid">
                {applications.map((app, i) => (
                  <div className="student-card" key={i}>
                    <div className="student-card-header">
                      <div className="student-avatar">{app.name?.charAt(0)?.toUpperCase() || "S"}</div>
                      <div className="student-header-info">
                        <h3 className="student-name">{app.name}</h3>
                        <p className="student-email">{app.email}</p>
                      </div>
                      <span className={`status-badge ${app.status === "Accepted" ? "badge-green" : app.status === "Rejected" ? "badge-red" : "badge-amber"}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="student-card-body">
                      <div className="student-field">
                        <span className="student-field-label">Project</span>
                        <span className="student-field-value">{app.projectTitle}</span>
                      </div>
                      <div className="student-field">
                        <span className="student-field-label">Skills</span>
                        <div className="skills-tags" style={{ marginTop: 0 }}>
                          {app.skills?.split(",").map(s => (
                            <span className="skill-tag" key={s}>{s.trim()}</span>
                          ))}
                        </div>
                      </div>
                      {app.appliedAt && (
                        <div className="student-field">
                          <span className="student-field-label">Applied</span>
                          <span className="student-field-value">{app.appliedAt}</span>
                        </div>
                      )}
                      {app.message && (
                        <div className="student-field student-field-full">
                          <span className="student-field-label">Message</span>
                          <span className="student-field-value student-message">{app.message}</span>
                        </div>
                      )}
                    </div>

                    <div className="student-card-footer">
                      {app.resume && (
                        <a href={app.resume} target="_blank" rel="noreferrer" className="btn-resume-link">
                          View Resume ↗
                        </a>
                      )}
                      {app.status === "Pending" && (
                        <div className="student-actions">
                          <button className="btn-accept" disabled={saving} onClick={() => updateStatus(app.id, "Accepted")}>✓ Accept</button>
                          <button className="btn-reject" disabled={saving} onClick={() => updateStatus(app.id, "Rejected")}>✕ Reject</button>
                        </div>
                      )}
                      {app.status !== "Pending" && (
                        <button
                          className="btn-undo"
                          onClick={() => updateStatus(app.id, "Pending")}
                        >
                          ↩ Undo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Reports Page ── */}
        {activePage === "Reports" && (
          <>
            <div className="topbar">
              <div>
                <h1 className="page-title">Reports & Insights</h1>
                <p className="page-sub">Analytics across your projects and student activity</p>
              </div>
            </div>

            {/* ── Summary Stats ── */}
            <div className="stats-grid" style={{ marginBottom: "var(--spacing-3xl)" }}>
              <div className="stat-card accent-indigo">
                <span className="stat-val">{projects.length}</span>
                <span className="stat-lbl">Total Projects</span>
              </div>
              <div className="stat-card accent-amber">
                <span className="stat-val">{applications.length}</span>
                <span className="stat-lbl">Total Applications</span>
              </div>
              <div className="stat-card accent-green">
                <span className="stat-val">{applications.filter(a => a.status === "Accepted").length}</span>
                <span className="stat-lbl">Accepted</span>
              </div>
              <div className="stat-card accent-teal">
                <span className="stat-val">{applications.filter(a => a.status === "Rejected").length}</span>
                <span className="stat-lbl">Rejected</span>
              </div>
            </div>

            {/* ── Acceptance Rate Bar ── */}
            {applications.length > 0 && (() => {
              const accepted = applications.filter(a => a.status === "Accepted").length;
              const rejected = applications.filter(a => a.status === "Rejected").length;
              const pending  = applications.filter(a => a.status === "Pending").length;
              const total    = applications.length;
              return (
                <div className="report-section">
                  <div className="section-header" style={{ marginBottom: "var(--spacing-lg)" }}>
                    <h2 className="section-title">Application Breakdown</h2>
                    <span className="report-total-label">{total} total</span>
                  </div>
                  <div className="report-bar-track">
                    {accepted > 0 && (
                      <div
                        className="report-bar-seg seg-green"
                        style={{ width: `${(accepted / total) * 100}%` }}
                        title={`Accepted: ${accepted}`}
                      />
                    )}
                    {pending > 0 && (
                      <div
                        className="report-bar-seg seg-amber"
                        style={{ width: `${(pending / total) * 100}%` }}
                        title={`Pending: ${pending}`}
                      />
                    )}
                    {rejected > 0 && (
                      <div
                        className="report-bar-seg seg-red"
                        style={{ width: `${(rejected / total) * 100}%` }}
                        title={`Rejected: ${rejected}`}
                      />
                    )}
                  </div>
                  <div className="report-bar-legend">
                    <span className="report-legend-item"><span className="legend-dot dot-green" /> Accepted ({accepted})</span>
                    <span className="report-legend-item"><span className="legend-dot dot-amber" /> Pending ({pending})</span>
                    <span className="report-legend-item"><span className="legend-dot dot-red" /> Rejected ({rejected})</span>
                  </div>
                </div>
              );
            })()}

            {/* ── Project Activity ── */}
            <div className="report-section">
              <div className="section-header" style={{ marginBottom: "var(--spacing-lg)" }}>
                <h2 className="section-title">Project Activity</h2>
              </div>
              {projects.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📂</div>
                  <h3>No projects yet</h3>
                  <p>Create a project to start seeing activity</p>
                </div>
              ) : (
                <div className="report-projects-list">
                  {projects
                    .map(p => ({ ...p, count: applications.filter(a => a.projectId === p.id).length }))
                    .sort((a, b) => b.count - a.count)
                    .map((p) => {
                      const accepted = applications.filter(a => a.projectId === p.id && a.status === "Accepted").length;
                      const maxCount = Math.max(...projects.map(pr => applications.filter(a => a.projectId === pr.id).length), 1);
                      const fill = Math.round((p.count / maxCount) * 100);
                      return (
                        <div className="report-project-row" key={p.id}>
                          <div className="report-project-left">
                            <div className="report-project-icon">⬡</div>
                            <div className="report-project-info">
                              <span className="report-project-title">{p.title}</span>
                              <span className="report-project-meta">
                                {p.slots} slots · {accepted} accepted
                              </span>
                            </div>
                          </div>
                          <div className="report-project-right">
                            <div className="report-mini-bar-track">
                              <div className="report-mini-bar-fill" style={{ width: `${fill}%` }} />
                            </div>
                            <span className="report-project-count">{p.count} app{p.count !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* ── Top Skills ── */}
            {applications.length > 0 && (() => {
              const skillFreq = {};
              applications.forEach(a => {
                (a.skills || "").split(",").forEach(s => {
                  const t = s.trim();
                  if (t) skillFreq[t] = (skillFreq[t] || 0) + 1;
                });
              });
              const sorted = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 12);
              const max = sorted[0]?.[1] || 1;
              return (
                <div className="report-section">
                  <div className="section-header" style={{ marginBottom: "var(--spacing-lg)" }}>
                    <h2 className="section-title">Top Skills Among Applicants</h2>
                  </div>
                  <div className="report-skills-grid">
                    {sorted.map(([skill, count]) => (
                      <div className="report-skill-item" key={skill}>
                        <div className="report-skill-header">
                          <span className="report-skill-name">{skill}</span>
                          <span className="report-skill-count">{count}</span>
                        </div>
                        <div className="report-skill-bar-track">
                          <div
                            className="report-skill-bar-fill"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ── Profile Page (Faculty) ── */}
        {activePage === "Profile" && (
          <div className="profile-card">
            <div className="profile-avatar">
              {profile.name ? profile.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{profile.name || "Your Name"}</h2>
              <p className="profile-email">{profile.email || "your@email.com"}</p>
              <p className="profile-bio">{profile.bio || "Add a short bio about yourself and your research interests..."}</p>
              {profile.resume && (
                <a href={profile.resume} target="_blank" rel="noreferrer" className="btn-resume">
                  View Profile Link ↗
                </a>
              )}
            </div>
            <button className="btn-primary btn-edit-profile" onClick={() => setEditProfile(true)}>
              Edit Profile
            </button>
          </div>
        )}

      </main>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createProject}
          ownerName={currentUserName}
        />
      )}

      {editProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditProfile(false)}
          onSave={saveProfile}
        />
      )}

      {showNotifications && (
        <NotificationsModal
          notifications={[
            ...applications.filter(a => a.status === "Pending").map(app => ({
              type: "pending",
              text: `New application from ${app.name} for "${app.projectTitle}"`,
              date: app.appliedAt || "Recently",
            })),
            ...applications.filter(a => a.status !== "Pending").map(app => ({
              type: app.status === "Accepted" ? "accepted" : "rejected",
              text: `You ${app.status.toLowerCase()} ${app.name}'s application for "${app.projectTitle}"`,
              date: app.appliedAt || "Recently",
            })),
            ...projects.map(p => ({
              type: "project",
              text: `Your project "${p.title}" is live with ${p.slots} open slots`,
              date: "Active",
            })),
          ]}
          onClose={() => setShowNotifications(false)}
        />
      )}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Project"
        message={projectToDelete ? (
          applications.filter(a => a.projectId === projectToDelete.id).length > 0
            ? `"${projectToDelete.title}" has ${applications.filter(a => a.projectId === projectToDelete.id).length} application${applications.filter(a => a.projectId === projectToDelete.id).length !== 1 ? "s" : ""}. Deleting it will remove all associated data. Continue?`
            : `Delete "${projectToDelete.title}"? This cannot be undone.`
        ) : ""}
        onConfirm={confirmDeleteProject}
        onCancel={() => { setShowDeleteConfirm(false); setProjectToDelete(null); }}
      />
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("devcollabProfile");
    return saved ? JSON.parse(saved) : {
      name: "",
      email: "",
      bio: "",
      resume: ""
    };
  });

  const saveProfile = async (data) => {
    try {
      const updated = await api.auth.updateProfile(data);
      setProfile(updated);
      localStorage.setItem("devcollabProfile", JSON.stringify(updated));
    } catch {
      // fallback: save locally if backend unreachable
      setProfile(data);
      localStorage.setItem("devcollabProfile", JSON.stringify(data));
    }
  };

  const handleLoginSuccess = (user) => setProfile(user);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<LoginFlow onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/login/student" element={<LoginFlow roleOverride="student" onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/login/faculty" element={<LoginFlow roleOverride="faculty" onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/student" element={<StudentDashboard profile={profile} saveProfile={saveProfile} />} />
        <Route path="/faculty" element={<FacultyDashboard profile={profile} saveProfile={saveProfile} />} />
      </Routes>
    </BrowserRouter>
  );
}