/**
 * JU Bankers' Forum — Shared App Utilities
 * Auth, API client, navbar state, toast notifications
 */

const API_BASE = 'http://localhost:8000'; // ← change to your production API URL

// ──────────────────────────────────────────────
// TOKEN / AUTH HELPERS
// ──────────────────────────────────────────────
const Auth = {
  setToken(token, username, role) {
    localStorage.setItem('jubf_token', token);
    localStorage.setItem('jubf_user', username);
    localStorage.setItem('jubf_role', role);
  },
  getToken() { return localStorage.getItem('jubf_token'); },
  getUser()  { return localStorage.getItem('jubf_user'); },
  getRole()  { return localStorage.getItem('jubf_role'); },
  isLoggedIn() { return !!localStorage.getItem('jubf_token'); },
  isAdmin()    { return localStorage.getItem('jubf_role') === 'admin'; },
  logout() {
    localStorage.removeItem('jubf_token');
    localStorage.removeItem('jubf_user');
    localStorage.removeItem('jubf_role');
    window.location.href = 'index.html';
  },
};

// ──────────────────────────────────────────────
// API CLIENT
// ──────────────────────────────────────────────
const API = {
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (Auth.isLoggedIn()) {
      headers['Authorization'] = `Bearer ${Auth.getToken()}`;
    }
    const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (resp.status === 401) { Auth.logout(); return; }
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.detail || 'Request failed');
    return data;
  },
  get(path)         { return API.request(path); },
  post(path, body)  { return API.request(path, { method: 'POST', body: JSON.stringify(body) }); },

  async login(username, password) {
    const body = new URLSearchParams({ username, password });
    const resp = await fetch(`${API_BASE}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },

  getAlumni(params = {}) {
    const q = new URLSearchParams(params).toString();
    return API.get(`/api/alumni${q ? '?' + q : ''}`);
  },
  getAlumniById(id) { return API.get(`/api/alumni/${id}`); },
  getFilters()      { return API.get('/api/filters'); },
  getStats()        { return API.get('/api/stats'); },
  register(data)    { return API.post('/api/auth/register', data); },
  refreshCache()    { return API.request('/api/admin/refresh', { method: 'POST' }); },
};

// ──────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ──────────────────────────────────────────────
function showToast(message, type = 'success', duration = 3500) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ──────────────────────────────────────────────
// NAVBAR INIT
// ──────────────────────────────────────────────
function initNavbar() {
  const authSection = document.getElementById('nav-auth');
  if (!authSection) return;

  if (Auth.isLoggedIn()) {
    authSection.innerHTML = `
      <span style="color:rgba(255,255,255,.75);font-size:.85rem;margin-right:.5rem">
        👤 ${Auth.getUser()}${Auth.isAdmin() ? ' <span style="color:var(--gold)">[Admin]</span>' : ''}
      </span>
      ${Auth.isAdmin() ? `<button class="btn-nav btn-nav-outline" onclick="adminRefresh()">↺ Refresh</button>` : ''}
      <button class="btn-nav btn-nav-outline" onclick="Auth.logout()">Logout</button>
    `;
  } else {
    authSection.innerHTML = `
      <a href="login.html" class="btn-nav btn-nav-outline">Login</a>
      <a href="register.html" class="btn-nav btn-nav-solid">Join</a>
    `;
  }

  // Mobile toggle
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Active link
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

async function adminRefresh() {
  try {
    const res = await API.refreshCache();
    showToast(res.message);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ──────────────────────────────────────────────
// AVATAR HELPER
// ──────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function avatarHTML(photoUrl, name, cls = '') {
  if (photoUrl) {
    return `<img src="${photoUrl}" alt="${name}" class="${cls}" onerror="this.replaceWith(makePlaceholder('${getInitials(name)}','${cls}'))">`;
  }
  return `<div class="${cls}-placeholder">${getInitials(name)}</div>`;
}

function makePlaceholder(initials, cls) {
  const d = document.createElement('div');
  d.className = cls + '-placeholder';
  d.textContent = initials;
  return d;
}

// ──────────────────────────────────────────────
// INIT ON DOM READY
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initNavbar);
