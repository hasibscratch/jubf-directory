/**
 * JU Bankers' Forum — Directory Page Logic
 * Filters, search, card rendering, member modal
 */

let allAlumni = [];
let activeFilters = { batch: '', subject: '', bank: '', hall: '', blood_group: '', search: '' };
let searchTimer;

// ──────────────────────────────────────────────
// PAGE INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadFilters();
  await loadAlumni();
  bindFilterEvents();
  bindSearchEvent();
  bindModalClose();

  if (Auth.isLoggedIn()) {
    const badge = document.getElementById('login-badge');
    if (badge) badge.style.display = 'none';
  }
});

// ──────────────────────────────────────────────
// DATA LOADING
// ──────────────────────────────────────────────
async function loadFilters() {
  try {
    const data = await API.getFilters();
    populateSelect('filter-batch',  data.batches,      'All Batches');
    populateSelect('filter-subject',data.subjects,     'All Departments');
    populateSelect('filter-bank',   data.banks,        'All Banks');
    populateSelect('filter-hall',   data.halls,        'All Halls');
    populateSelect('filter-blood',  data.blood_groups, 'All Blood Groups');
  } catch (e) {
    console.warn('Could not load filters:', e.message);
  }
}

function populateSelect(id, options, placeholder) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>` +
    options.map(o => `<option value="${o}">${o}</option>`).join('');
}

async function loadAlumni() {
  showLoading(true);
  try {
    const data = await API.getAlumni(buildParams());
    allAlumni = data.alumni || [];
    renderCards(allAlumni);
    updateCount(data.count);
  } catch (e) {
    showError(e.message);
  } finally {
    showLoading(false);
  }
}

function buildParams() {
  const p = {};
  if (activeFilters.batch)      p.batch      = activeFilters.batch;
  if (activeFilters.subject)    p.subject    = activeFilters.subject;
  if (activeFilters.bank)       p.bank       = activeFilters.bank;
  if (activeFilters.hall)       p.hall       = activeFilters.hall;
  if (activeFilters.blood_group)p.blood_group= activeFilters.blood_group;
  if (activeFilters.search)     p.search     = activeFilters.search;
  return p;
}

// ──────────────────────────────────────────────
// RENDERING
// ──────────────────────────────────────────────
function renderCards(alumni) {
  const grid = document.getElementById('alumni-grid');

  if (!alumni.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🔍</div>
        <h3>No alumni found</h3>
        <p>Try adjusting the filters or search term.</p>
      </div>`;
    return;
  }

  grid.innerHTML = alumni.map(a => `
    <div class="card" onclick="openModal('${a.id}')" title="View ${a.name}'s profile">
      ${a.photo_url
        ? `<img src="${a.photo_url}" alt="${a.name}" class="card-photo" onerror="this.outerHTML='<div class=card-photo-placeholder>${getInitials(a.name)}</div>'">`
        : `<div class="card-photo-placeholder">${getInitials(a.name)}</div>`
      }
      <div class="card-body">
        <div class="card-name" title="${a.name}">${a.name || '—'}</div>
        <div class="card-bank" title="${a.bank}">${a.bank || '—'}</div>
        <div class="card-tags">
          ${a.batch   ? `<span class="tag tag-gold">Batch ${a.batch}</span>` : ''}
          ${a.subject ? `<span class="tag">${a.subject}</span>` : ''}
          ${a.blood_group ? `<span class="tag">🩸 ${a.blood_group}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function updateCount(count) {
  const el = document.getElementById('result-count');
  if (el) el.innerHTML = `Showing <strong>${count}</strong> member${count !== 1 ? 's' : ''}`;
}

function showLoading(visible) {
  const loader = document.getElementById('loading');
  const grid   = document.getElementById('alumni-grid');
  if (loader) loader.style.display = visible ? 'flex' : 'none';
  if (grid)   grid.style.display   = visible ? 'none' : 'grid';
}

function showError(msg) {
  const grid = document.getElementById('alumni-grid');
  if (grid) grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">⚠️</div>
      <h3>Could not load alumni</h3>
      <p>${msg}</p>
    </div>`;
}

// ──────────────────────────────────────────────
// FILTERS & SEARCH
// ──────────────────────────────────────────────
function bindFilterEvents() {
  const map = {
    'filter-batch':   'batch',
    'filter-subject': 'subject',
    'filter-bank':    'bank',
    'filter-hall':    'hall',
    'filter-blood':   'blood_group',
  };

  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      activeFilters[key] = el.value;
      loadAlumni();
    });
  });

  const resetBtn = document.getElementById('reset-filters');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    activeFilters = { batch: '', subject: '', bank: '', hall: '', blood_group: '', search: '' };
    document.querySelectorAll('.filter-group select').forEach(s => s.value = '');
    const searchEl = document.getElementById('search-input');
    if (searchEl) searchEl.value = '';
    loadAlumni();
  });
}

function bindSearchEvent() {
  const searchEl = document.getElementById('search-input');
  if (!searchEl) return;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      activeFilters.search = searchEl.value.trim();
      loadAlumni();
    }, 350);
  });
}

// ──────────────────────────────────────────────
// MODAL
// ──────────────────────────────────────────────
async function openModal(alumniId) {
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;

  overlay.classList.add('active');
  body.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading profile…</span></div>';

  try {
    const a = await API.getAlumniById(alumniId);
    renderModal(a);
  } catch (e) {
    body.innerHTML = `<p style="color:#c0392b;padding:1rem">${e.message}</p>`;
  }
}

function renderModal(a) {
  const overlay  = document.getElementById('modal-overlay');
  const header   = document.getElementById('modal-header');
  const body     = document.getElementById('modal-body');
  const isLogged = Auth.isLoggedIn();

  // Avatar
  const avatarHTML = a.photo_url
    ? `<img src="${a.photo_url}" alt="${a.name}" class="modal-avatar" onerror="this.outerHTML='<div class=modal-avatar-placeholder>${getInitials(a.name)}</div>'">`
    : `<div class="modal-avatar-placeholder">${getInitials(a.name)}</div>`;

  header.innerHTML = `
    ${avatarHTML}
    <div class="modal-title">
      <h2>${a.name || '—'}</h2>
      <p>${a.position || ''} ${a.bank ? '@ ' + a.bank : ''}</p>
    </div>
    <button class="modal-close" onclick="closeModal()" aria-label="Close">✕</button>
  `;

  const locked = `<span class="detail-value locked">🔒 Login to view</span>`;

  body.innerHTML = `
    <div class="detail-grid">
      ${field('🎓 University Batch', a.batch)}
      ${field('📚 Department / Subject', a.subject)}
      ${field('🏦 Current Bank', a.bank)}
      ${field('💼 Position / Designation', a.position)}
      ${field('🏠 Hall of Residence', a.hall)}
      ${field('🩸 Blood Group', a.blood_group)}
      ${field('🎂 Birthday', a.birthday)}
      ${field('📍 Office Location', a.office_location)}
      ${field('🌟 Areas of Expertise', a.expertise)}
      <div class="detail-item">
        <div class="detail-label">📞 Phone Number</div>
        ${isLogged ? `<div class="detail-value">${a.phone || '—'}</div>` : locked}
      </div>
      <div class="detail-item">
        <div class="detail-label">📧 Email</div>
        ${isLogged
          ? `<div class="detail-value">${a.email ? `<a href="mailto:${a.email}">${a.email}</a>` : '—'}</div>`
          : locked}
      </div>
      <div class="detail-item full">
        <div class="detail-label">🏡 Permanent / Mailing Address</div>
        ${isLogged ? `<div class="detail-value">${a.address || '—'}</div>` : locked}
      </div>
    </div>
    ${!isLogged ? `
      <div style="margin-top:1.25rem;padding:.9rem;background:var(--green-light);border-radius:8px;text-align:center;font-size:.88rem;color:var(--green-dark)">
        <strong>🔒 Some information is hidden.</strong>
        <a href="login.html" style="color:var(--green);font-weight:700;margin-left:.3rem">Login as a member to see full details →</a>
      </div>` : ''}
  `;
}

function field(label, value) {
  return `
    <div class="detail-item">
      <div class="detail-label">${label}</div>
      <div class="detail-value">${value || '—'}</div>
    </div>`;
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

function bindModalClose() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}
