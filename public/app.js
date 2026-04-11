/* =============================================
   LuminaQ — Public-first Quote Platform
   ============================================= */

const API = '/api/quotes';
const AUTH_API = '/api/auth';

/* ---- Auth helpers ---- */
function getToken() { return localStorage.getItem('luminaq_token'); }
function setAuth(token, user) {
  localStorage.setItem('luminaq_token', token);
  localStorage.setItem('luminaq_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('luminaq_token');
  localStorage.removeItem('luminaq_user');
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('luminaq_user')); }
  catch { return null; }
}
function isLoggedIn() { return !!getToken(); }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

/* ---- DOM refs ---- */
const grid = document.getElementById('quoteGrid');
const searchInput = document.getElementById('searchInput');
const moodFilter = document.getElementById('moodFilter');

// Nav sections
const guestActions = document.getElementById('guestActions');
const userActions = document.getElementById('userActions');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const btnMyQuotes = document.getElementById('btnMyQuotes');
const btnNew = document.getElementById('btnNewQuote');

// Auth modal
const authModal = document.getElementById('authModal');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const showSignup = document.getElementById('showSignup');
const showSignin = document.getElementById('showSignin');
const signinError = document.getElementById('signinError');
const signupError = document.getElementById('signupError');

// Form modal
const formModal = document.getElementById('formModal');
const quoteForm = document.getElementById('quoteForm');
const formTitle = document.getElementById('formTitle');
const quoteIdField = document.getElementById('quoteId');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const dropPlaceholder = document.getElementById('dropPlaceholder');
const dropZone = document.getElementById('dropZone');

// My quotes modal
const myQuotesModal = document.getElementById('myQuotesModal');
const myQuotesGrid = document.getElementById('myQuotesGrid');

// Detail modal
const detailModal = document.getElementById('detailModal');

// State
let currentSource = '';
let debounceTimer = null;
let savedQuoteIds = new Set(); // IDs the logged-in user has saved
let allQuotes = []; // cached for detail lookup

/* ============================
   UI STATE — guest vs logged-in
   ============================ */

function updateNav() {
  if (isLoggedIn()) {
    guestActions.style.display = 'none';
    userActions.style.display = '';
    document.getElementById('navUser').textContent = getUser()?.name || '';
    btnNew.style.display = '';
  } else {
    guestActions.style.display = '';
    userActions.style.display = 'none';
    btnNew.style.display = 'none';
  }
}

/* ============================
   INIT — load public feed immediately
   ============================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Try auto-login silently
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${AUTH_API}/me`, { headers: authHeaders() });
      if (res.ok) {
        const user = await res.json();
        setAuth(token, user);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  }
  updateNav();
  if (isLoggedIn()) await loadSavedIds();
  loadQuotes();
  loadMoodOptions();
});

/* ============================
   AUTH EVENTS
   ============================ */

btnLogin.addEventListener('click', () => openModal(authModal));

showSignup.addEventListener('click', (e) => {
  e.preventDefault();
  signinForm.style.display = 'none';
  signupForm.style.display = '';
});

showSignin.addEventListener('click', (e) => {
  e.preventDefault();
  signupForm.style.display = 'none';
  signinForm.style.display = '';
});

signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  signinError.textContent = '';
  const email = document.getElementById('signinEmail').value;
  const password = document.getElementById('signinPassword').value;
  try {
    const res = await fetch(`${AUTH_API}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign in failed');
    setAuth(data.token, data.user);
    updateNav();
    await loadSavedIds();
    closeAllModals();
    loadQuotes();
  } catch (err) {
    signinError.textContent = err.message;
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  signupError.textContent = '';
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  try {
    const res = await fetch(`${AUTH_API}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error || data.errors?.map((e) => e.msg).join(', ') || 'Sign up failed';
      throw new Error(msg);
    }
    setAuth(data.token, data.user);
    updateNav();
    await loadSavedIds();
    closeAllModals();
    loadQuotes();
  } catch (err) {
    signupError.textContent = err.message;
  }
});

btnLogout.addEventListener('click', () => {
  clearAuth();
  savedQuoteIds = new Set();
  updateNav();
  loadQuotes();
});

/* ============================
   PUBLIC API CALLS
   ============================ */

async function loadQuotes() {
  const params = new URLSearchParams();
  if (currentSource) params.set('sourceType', currentSource);
  const mood = moodFilter.value;
  if (mood) params.set('mood', mood);
  const search = searchInput.value.trim();
  if (search) params.set('search', search);

  try {
    const headers = isLoggedIn() ? authHeaders() : {};
    const res = await fetch(`${API}?${params}`, { headers });
    const quotes = await res.json();
    allQuotes = quotes;
    renderGrid(quotes, grid, false);
  } catch {
    grid.innerHTML = '<p class="empty-state">Failed to load quotes.</p>';
  }
}

async function loadMoodOptions() {
  try {
    const res = await fetch(`${API}/stats/moods`);
    const stats = await res.json();
    moodFilter.innerHTML = '<option value="">All Moods</option>';
    stats.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s._id;
      opt.textContent = `${s._id} (${s.count})`;
      moodFilter.appendChild(opt);
    });
  } catch { /* ignore */ }
}

/* ============================
   RENDERING
   ============================ */

function getImageSrc(q) {
  if (q.image) return `/uploads/${encodeURIComponent(q.image)}`;
  if (q.imageUrl) return q.imageUrl;
  return null;
}

function renderGrid(quotes, container, showOwnerActions) {
  if (!quotes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">✦</div>
        <p>No quotes found.</p>
      </div>`;
    return;
  }

  const userId = getUser()?._id || getUser()?.id;

  container.innerHTML = quotes.map((q) => {
    const imgSrc = getImageSrc(q);
    const imgTag = imgSrc
      ? `<img src="${esc(imgSrc)}" alt="quote image" loading="lazy" />`
      : '';
    const moods = (q.mood || [])
      .map((m) => `<span class="mood-tag">${esc(m)}</span>`)
      .join('');

    const isOwner = userId && (String(q.user?._id || q.user) === String(userId));
    const ownerActions = (showOwnerActions && isOwner)
      ? `<div class="card-actions">
           <button class="btn-ghost btn-sm" onclick="editQuote(event,'${q._id}')">Edit</button>
           <button class="btn-danger btn-sm" onclick="deleteQuote('${q._id}')">Delete</button>
         </div>`
      : '';
    const unsaveAction = (showOwnerActions && !isOwner && savedQuoteIds.has(q._id))
      ? `<div class="card-actions">
           <button class="btn-danger btn-sm" onclick="unsaveFromMyQuotes(event,'${q._id}')">Unsave</button>
         </div>`
      : '';

    const saveBtn = `<button class="card-save-btn ${savedQuoteIds.has(q._id) ? 'saved' : ''}" onclick="onSaveQuote(event,'${q._id}')">${savedQuoteIds.has(q._id) ? 'Saved' : 'Save'}</button>`;

    const authorName = q.user?.name ? `<p class="card-author-badge">by ${esc(q.user.name)}</p>` : '';

    return `
      <div class="card" data-id="${q._id}">
        ${saveBtn}
        ${imgTag}
        <div class="card-body">
          <span class="card-source">${esc(q.sourceType)}</span>
          <p class="card-quote">"${esc(q.text)}"</p>
          ${q.author ? `<p class="card-meta">— ${esc(q.author)}</p>` : ''}
          ${q.reference ? `<p class="card-meta">${esc(q.reference)}</p>` : ''}
          <div class="card-moods">${moods}</div>
          ${authorName}
          ${ownerActions}
          ${unsaveAction}
        </div>
      </div>`;
  }).join('');

  // Click card to open detail
  container.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const id = card.dataset.id;
      const q = quotes.find((x) => x._id === id);
      if (q) openDetail(q);
    });
  });
}

function openDetail(q) {
  const content = document.getElementById('detailContent');
  const imgSrc = getImageSrc(q);
  const imgTag = imgSrc
    ? `<img src="${esc(imgSrc)}" class="detail-img" alt="" />`
    : '';
  const moods = (q.mood || [])
    .map((m) => `<span class="mood-tag">${esc(m)}</span>`)
    .join('');
  const authorName = q.user?.name ? `<p class="card-author-badge">by ${esc(q.user.name)}</p>` : '';
  content.innerHTML = `
    ${imgTag}
    <div class="detail-body">
      <span class="card-source">${esc(q.sourceType)}</span>
      <p class="card-quote">"${esc(q.text)}"</p>
      ${q.author ? `<p class="card-meta">— ${esc(q.author)}</p>` : ''}
      ${q.reference ? `<p class="card-meta">${esc(q.reference)}</p>` : ''}
      <div class="card-moods">${moods}</div>
      ${authorName}
      <button class="detail-save-btn" onclick="onSaveQuote(event,'${q._id}')">Save</button>
    </div>`;
  openModal(detailModal);
}

/* ============================
   SAVE / UNSAVE QUOTE
   ============================ */

async function loadSavedIds() {
  try {
    const res = await fetch(`${API}/my/saved-ids`, { headers: authHeaders() });
    if (res.ok) {
      const ids = await res.json();
      savedQuoteIds = new Set(ids.map(String));
    }
  } catch { /* ignore */ }
}

function onSaveQuote(event, quoteId) {
  event.stopPropagation();
  closeAllModals();
  if (!isLoggedIn()) {
    openModal(authModal);
    return;
  }
  toggleSave(quoteId);
}

async function toggleSave(quoteId) {
  const isSaved = savedQuoteIds.has(quoteId);
  const method = isSaved ? 'DELETE' : 'POST';
  try {
    await fetch(`${API}/${quoteId}/save`, { method, headers: authHeaders() });
    if (isSaved) {
      savedQuoteIds.delete(quoteId);
    } else {
      savedQuoteIds.add(quoteId);
    }
    loadQuotes(); // refresh to update button states
  } catch {
    alert('Failed to save quote');
  }
}

async function unsaveFromMyQuotes(event, quoteId) {
  event.stopPropagation();
  try {
    await fetch(`${API}/${quoteId}/save`, { method: 'DELETE', headers: authHeaders() });
    savedQuoteIds.delete(quoteId);
    loadMyQuotes();
  } catch {
    alert('Failed to unsave quote');
  }
}

/* ============================
   MY QUOTES
   ============================ */

btnMyQuotes.addEventListener('click', loadMyQuotes);

async function loadMyQuotes() {
  try {
    const res = await fetch(`${API}/my/quotes`, { headers: authHeaders() });
    if (res.status === 401) { clearAuth(); updateNav(); return; }
    const quotes = await res.json();
    renderGrid(quotes, myQuotesGrid, true);
    openModal(myQuotesModal);
  } catch {
    alert('Could not load your quotes');
  }
}

/* ============================
   QUOTE FORM / CRUD
   ============================ */

btnNew.addEventListener('click', () => {
  if (!isLoggedIn()) { openModal(authModal); return; }
  openNewForm();
});

function openNewForm() {
  quoteForm.reset();
  quoteIdField.value = '';
  formTitle.textContent = 'New Quote';
  imagePreview.classList.remove('visible');
  imagePreview.src = '';
  dropPlaceholder.style.display = '';
  document.getElementById('isPublicToggle').checked = true;
  document.querySelectorAll('.mood-btn').forEach((btn) => btn.classList.remove('selected'));
  openModal(formModal);
}

async function editQuote(event, id) {
  event.stopPropagation();
  try {
    const res = await fetch(`${API}/${id}`, { headers: isLoggedIn() ? authHeaders() : {} });
    const q = await res.json();

    quoteIdField.value = q._id;
    formTitle.textContent = 'Edit Quote';
    document.getElementById('quoteText').value = q.text;
    document.getElementById('sourceType').value = q.sourceType;
    document.getElementById('author').value = q.author || '';
    document.getElementById('isPublicToggle').checked = q.isPublic !== false;

    document.querySelectorAll('.mood-btn').forEach((btn) => {
      btn.classList.toggle('selected', (q.mood || []).includes(btn.dataset.mood));
    });

    const imgSrc = getImageSrc(q);
    if (imgSrc) {
      imagePreview.src = imgSrc;
      imagePreview.classList.add('visible');
      dropPlaceholder.style.display = 'none';
    } else {
      imagePreview.classList.remove('visible');
      imagePreview.src = '';
      dropPlaceholder.style.display = '';
    }

    openModal(formModal);
  } catch {
    alert('Could not load quote for editing');
  }
}

quoteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = quoteIdField.value;
  const fd = new FormData();
  fd.append('text', document.getElementById('quoteText').value);
  fd.append('sourceType', document.getElementById('sourceType').value);
  fd.append('author', document.getElementById('author').value);
  fd.append('isPublic', document.getElementById('isPublicToggle').checked);

  const moods = Array.from(document.querySelectorAll('.mood-btn.selected')).map(
    (btn) => btn.dataset.mood
  );
  fd.append('mood', JSON.stringify(moods));

  const file = imageInput.files[0];
  if (file) fd.append('image', file);

  try {
    const url = id ? `${API}/${id}` : API;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: fd });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || err.errors?.map((e) => e.msg).join(', '));
    }
    closeAllModals();
    loadQuotes();
    loadMoodOptions();
  } catch (err) {
    alert(err.message);
  }
});

async function deleteQuote(id) {
  if (!confirm('Delete this quote?')) return;
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders() });
    closeAllModals();
    loadQuotes();
    loadMoodOptions();
  } catch {
    alert('Failed to delete quote');
  }
}

/* ============================
   MOOD TAG BUTTONS
   ============================ */

document.querySelectorAll('.mood-btn').forEach((btn) => {
  btn.addEventListener('click', () => btn.classList.toggle('selected'));
});

/* ============================
   IMAGE DRAG & DROP
   ============================ */

imageInput.addEventListener('change', () => previewFile(imageInput.files[0]));

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    imageInput.files = dt.files;
    previewFile(file);
  }
});

function previewFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.classList.add('visible');
    dropPlaceholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

/* ============================
   FILTERS & SEARCH
   ============================ */

document.querySelectorAll('.filter-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    currentSource = chip.dataset.source;
    loadQuotes();
  });
});

moodFilter.addEventListener('change', () => loadQuotes());

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadQuotes, 350);
});

/* ============================
   MODALS
   ============================ */

function openModal(el) {
  el.classList.add('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('open'));
}

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', closeAllModals);
});

document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAllModals();
  });
});

/* ============================
   UTILS
   ============================ */

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
