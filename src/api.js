// ── Central API client ─────────────────────────────────────────────
// All backend calls go through here. Components never use fetch directly.

const BASE = "http://localhost:5001/api";

// Reads the JWT token stored after login
const token = () => localStorage.getItem("devcollab_token");

const headers = () => ({
  "Content-Type": "application/json",
  ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
});

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  // Token expired or invalid — clear session and bounce to login
  if (res.status === 401) {
    localStorage.removeItem("devcollab_token");
    localStorage.removeItem("devcollabProfile");
    window.location.href = "/";
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || "Request failed");
  return data;
}

// ── Auth ───────────────────────────────────────────────────────────
export const api = {
  auth: {
    login:    (email, password)  => request("POST", "/auth/login",    { email, password }),
    register: (name, email, password, role) =>
                                    request("POST", "/auth/register",  { name, email, password, role }),
    updateProfile: (data)        => request("PUT",  "/auth/profile",   data),
  },

  // ── Projects ─────────────────────────────────────────────────────
  projects: {
    getAll:  ()       => request("GET",    "/projects"),
    create:  (data)   => request("POST",   "/projects",     data),
    remove:  (id)     => request("DELETE", `/projects/${id}`),
  },

  // ── Applications ─────────────────────────────────────────────────
  applications: {
    getAll:          ()           => request("GET",    "/applications"),
    submit:          (data)       => request("POST",   "/applications",              data),
    update:          (id, data)   => request("PATCH",  `/applications/${id}`,        data),
    updateProgress:  (id, data)   => request("PUT",    `/applications/${id}/progress`, data),
  },
};

// ── Auth helpers ───────────────────────────────────────────────────
export function saveSession(token, user) {
  localStorage.setItem("devcollab_token", token);
  localStorage.setItem("devcollabProfile", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("devcollab_token");
  localStorage.removeItem("devcollabProfile");
}

export function getStoredUser() {
  const raw = localStorage.getItem("devcollabProfile");
  return raw ? JSON.parse(raw) : null;
}
