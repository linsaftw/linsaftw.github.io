// app.js — Main frontend logic for LinsaFTW blog
const API = window.BLOG_CONFIG?.apiUrl || 'http://localhost:3000';

// ===== STATE =====
let currentUser = null;

// ===== API HELPERS =====
async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ===== AUTH =====
async function checkAuth() {
  const { ok, data } = await apiFetch('/api/auth/me');
  if (ok && data.user) {
    currentUser = data.user;
    updateNavAuth();
    return data.user;
  }
  currentUser = null;
  updateNavAuth();
  return null;
}

function updateNavAuth() {
  const authLinks = document.querySelectorAll('[data-auth-show]');
  const guestLinks = document.querySelectorAll('[data-guest-show]');
  authLinks.forEach(el => {
    el.style.display = currentUser ? '' : 'none';
  });
  guestLinks.forEach(el => {
    el.style.display = currentUser ? 'none' : '';
  });
  const usernameEl = document.querySelector('[data-username]');
  if (usernameEl && currentUser) usernameEl.textContent = currentUser.username;
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  window.location.href = '/';
}

// ===== FLASH MESSAGES =====
function showFlash(msg, type = 'error', container = null) {
  const el = document.createElement('div');
  el.className = `flash flash--${type}`;
  el.textContent = msg;
  const target = container || document.querySelector('.flash-container') || document.body;
  target.insertBefore(el, target.firstChild);
  setTimeout(() => el.remove(), 5000);
}

// ===== DATE FORMATTER =====
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + ' ART';
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ===== SVG ICON HELPER =====
function icon(name, size = 14) {
  // Returns an <img> tag referencing asset SVGs
  return `<img src="/assets/svgs/${name}.svg" width="${size}" height="${size}" alt="${name}" style="vertical-align:middle;">`;
}

// ===== POST LISTING (index page) =====
async function loadPostList() {
  const container = document.getElementById('posts-list');
  if (!container) return;

  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading posts...</div>`;

  const user = await checkAuth();
  const visibility = user ? 'all' : 'public';
  const { ok, data } = await apiFetch(`/api/posts?visibility=${visibility}&page=1`);

  if (!ok) {
    container.innerHTML = `<div class="flash flash--error">Failed to load posts.</div>`;
    return;
  }

  if (!data.posts || data.posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">//</div>
        <div>No posts yet.</div>
        ${user ? `<div class="mt-16"><a href="/admin.html" class="btn">${icon('plus')} New Post</a></div>` : ''}
      </div>`;
    return;
  }

  container.innerHTML = `<div class="posts-grid">${data.posts.map(postCard).join('')}</div>`;
}

function postCard(p) {
  const imgHtml = p.image_path
    ? `<img class="post-card__image" src="${escHtml(p.image_path)}" alt="${escHtml(p.title)}" loading="lazy">`
    : `<div class="post-card__image-placeholder">//</div>`;

  const excerpt = p.excerpt || (p.caption ? p.caption.substring(0, 160) : '');

  return `
    <article class="post-card">
      ${imgHtml}
      <div class="post-card__body">
        <div class="post-card__meta">
          ${icon('calendar', 11)}
          <span>${formatDate(p.created_at)}</span>
          ${p.visibility === 'private' ? `<span class="badge badge--private">${icon('lock', 10)} private</span>` : ''}
        </div>
        <h2 class="post-card__title">${escHtml(p.title)}</h2>
        ${excerpt ? `<p class="post-card__caption">${escHtml(excerpt)}</p>` : ''}
        <div class="post-card__footer">
          <a href="/post.html?id=${p.id}" class="btn btn--sm">${icon('arrow-right', 12)} Read more</a>
        </div>
      </div>
    </article>`;
}

// ===== SINGLE POST PAGE =====
async function loadSinglePost() {
  const container = document.getElementById('post-container');
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) { window.location.href = '/'; return; }

  container.innerHTML = `<div class="loading"><div class="spinner"></div> Loading post...</div>`;

  const user = await checkAuth();
  const { ok, data } = await apiFetch(`/api/posts/${id}`);

  if (!ok) {
    container.innerHTML = `<div class="flash flash--error">Post not found or access denied.</div>`;
    return;
  }

  const p = data.post;
  document.title = `${p.title} — LinsaFTW`;

  const imgHtml = p.image_path ? `
    <div class="post-image-wrap">
      <img class="post-image" src="${escHtml(p.image_path)}" alt="${escHtml(p.title)}">
      ${p.caption ? `<p class="post-image-caption">${escHtml(p.caption)}</p>` : ''}
    </div>` : '';

  const editHtml = user && (user.id === p.author_id || user.role === 'admin') ? `
    <div class="flex gap-8 mt-16">
      <a href="/admin.html#edit-${p.id}" class="btn btn--sm">${icon('edit')} Edit</a>
      <button class="btn btn--sm" onclick="toggleVisibility(${p.id}, '${p.visibility}')" id="vis-btn">
        ${p.visibility === 'public' ? icon('eye') + ' Public' : icon('lock') + ' Private'}
      </button>
    </div>` : '';

  const editsHtml = data.edits && data.edits.length > 0 ? `
    <div class="edit-history">
      <div class="edit-history__title">${icon('clock')} Edit history (${data.edits.length})</div>
      ${data.edits.map(e => `
        <div class="edit-entry">
          ${icon('edit', 11)}
          <span>${formatDate(e.edited_at)}</span>
          ${e.edit_message ? `<span class="text-muted">— ${escHtml(e.edit_message)}</span>` : ''}
        </div>`).join('')}
    </div>` : '';

  container.innerHTML = `
    <article class="post-page page-content">
      <div class="post-header">
        <div class="post-meta">
          <span>${icon('calendar', 11)} ${formatDate(p.created_at)}</span>
          ${p.updated_at && p.updated_at !== p.created_at ? `<span>${icon('clock', 11)} Updated: ${formatDate(p.updated_at)}</span>` : ''}
          <span class="badge badge--${p.visibility}">${p.visibility === 'public' ? icon('eye', 10) : icon('lock', 10)} ${p.visibility}</span>
        </div>
        <h1 class="post-title">${escHtml(p.title)}</h1>
        ${p.caption && !p.image_path ? `<p class="post-caption">${escHtml(p.caption)}</p>` : ''}
        ${editHtml}
      </div>
      ${imgHtml}
      <div class="post-content" id="post-content-render"></div>
      ${editsHtml}
    </article>`;

  // Render markdown
  const contentEl = document.getElementById('post-content-render');
  if (contentEl && window.marked) {
    contentEl.innerHTML = marked.parse(p.content_markdown || '');
    // Highlight code blocks
    if (window.hljs) {
      contentEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
    }
  } else if (contentEl) {
    contentEl.textContent = p.content_markdown;
  }
}

async function toggleVisibility(id, current) {
  const next = current === 'public' ? 'private' : 'public';
  const { ok, data } = await apiFetch(`/api/posts/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility: next }),
  });
  if (ok) {
    window.location.reload();
  } else {
    showFlash(data.error || 'Failed to toggle visibility');
  }
}

// ===== LOGIN PAGE =====
async function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Redirect if already logged in
  const user = await checkAuth();
  if (user) { window.location.href = '/admin.html'; return; }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    const { ok, data } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        usernameOrEmail: form.usernameOrEmail.value,
        password: form.password.value,
      }),
    });

    btn.disabled = false;
    btn.innerHTML = `${icon('log-in')} Login`;

    if (ok) {
      window.location.href = '/admin.html';
    } else {
      showFlash(data.error || 'Login failed');
    }
  });
}

// ===== REGISTER PAGE =====
async function setupRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;

    const { ok, data } = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
      }),
    });

    btn.disabled = false;
    btn.innerHTML = `${icon('user-plus')} Register`;

    if (ok) {
      showFlash('Registered successfully! You can now log in.', 'success');
      setTimeout(() => window.location.href = '/login.html', 1500);
    } else {
      showFlash(data.error || 'Registration failed');
    }
  });
}

// ===== ADMIN PAGE =====
async function setupAdmin() {
  const adminWrap = document.getElementById('admin-wrap');
  if (!adminWrap) return;

  const user = await checkAuth();
  if (!user) { window.location.href = '/login.html'; return; }

  loadAdminPosts();
  setupPostEditor();
  if (user.role === 'admin') setupTerminal();
}

async function loadAdminPosts() {
  const container = document.getElementById('admin-posts');
  if (!container) return;

  container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  const { ok, data } = await apiFetch('/api/posts?visibility=all&page=1');

  if (!ok) { container.innerHTML = '<div class="flash flash--error">Failed to load posts.</div>'; return; }

  if (!data.posts || data.posts.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">//</div><div>No posts yet. Create one!</div></div>`;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Published</th>
          <th>Visibility</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.posts.map(p => `
          <tr>
            <td><a href="/post.html?id=${p.id}" style="color:inherit;text-decoration:none">${escHtml(p.title)}</a></td>
            <td>${formatDateShort(p.created_at)}</td>
            <td>
              <button class="btn btn--sm" onclick="adminToggleVis(${p.id},'${p.visibility}',this)">
                ${p.visibility === 'public' ? icon('eye') + ' Public' : icon('lock') + ' Private'}
              </button>
            </td>
            <td>
              <div class="flex gap-8">
                <button class="btn btn--sm" onclick="openEditPost(${p.id})">${icon('edit')} Edit</button>
                <button class="btn btn--sm btn--danger" onclick="deletePost(${p.id})">${icon('trash')} Delete</button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function adminToggleVis(id, current, btn) {
  const next = current === 'public' ? 'private' : 'public';
  const { ok } = await apiFetch(`/api/posts/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility: next }),
  });
  if (ok) {
    btn.innerHTML = next === 'public' ? icon('eye') + ' Public' : icon('lock') + ' Private';
    btn.setAttribute('onclick', `adminToggleVis(${id},'${next}',this)`);
  }
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  const { ok, data } = await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
  if (ok) loadAdminPosts();
  else showFlash(data.error || 'Delete failed');
}

// ===== POST EDITOR =====
let editingPostId = null;

function setupPostEditor() {
  const form = document.getElementById('post-editor-form');
  if (!form) return;

  // Live preview
  const mdInput = document.getElementById('editor-content');
  const preview = document.getElementById('editor-preview');
  if (mdInput && preview) {
    mdInput.addEventListener('input', () => {
      if (window.marked) {
        preview.innerHTML = marked.parse(mdInput.value);
        if (window.hljs) preview.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
      }
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;

    const payload = {
      title: form.querySelector('#editor-title').value,
      caption: form.querySelector('#editor-caption').value,
      image_path: form.querySelector('#editor-image').value,
      content_markdown: form.querySelector('#editor-content').value,
      visibility: form.querySelector('#editor-visibility').value,
      edit_message: form.querySelector('#editor-editmsg')?.value || '',
    };

    let result;
    if (editingPostId) {
      result = await apiFetch(`/api/posts/${editingPostId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      result = await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    btn.disabled = false;
    btn.innerHTML = `${icon('save')} Save Post`;

    if (result.ok) {
      showFlash(editingPostId ? 'Post updated!' : 'Post created!', 'success');
      editingPostId = null;
      form.reset();
      if (preview) preview.innerHTML = '';
      loadAdminPosts();
      showAdminSection('posts');
    } else {
      showFlash(result.data.error || 'Failed to save post');
    }
  });
}

async function openEditPost(id) {
  const { ok, data } = await apiFetch(`/api/posts/${id}`);
  if (!ok) { showFlash('Failed to load post'); return; }

  const p = data.post;
  editingPostId = id;

  document.getElementById('editor-title').value = p.title || '';
  document.getElementById('editor-caption').value = p.caption || '';
  document.getElementById('editor-image').value = p.image_path || '';
  document.getElementById('editor-content').value = p.content_markdown || '';
  document.getElementById('editor-visibility').value = p.visibility || 'public';

  // Trigger preview
  const ev = new Event('input');
  document.getElementById('editor-content').dispatchEvent(ev);

  showAdminSection('editor');
  document.getElementById('editor-section-title').textContent = 'Edit Post';
}

function newPost() {
  editingPostId = null;
  document.getElementById('post-editor-form')?.reset();
  const preview = document.getElementById('editor-preview');
  if (preview) preview.innerHTML = '';
  const title = document.getElementById('editor-section-title');
  if (title) title.textContent = 'New Post';
  showAdminSection('editor');
}

function showAdminSection(section) {
  document.querySelectorAll('.admin-section').forEach(el => {
    el.style.display = el.dataset.section === section ? '' : 'none';
  });
  document.querySelectorAll('.admin-nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.target === section);
  });
}

// ===== ADMIN TERMINAL =====
function setupTerminal() {
  const terminal = document.getElementById('terminal-output');
  const input = document.getElementById('terminal-input');
  if (!terminal || !input) return;

  let ws = null;

  function connectWS() {
    const wsUrl = (API.replace('http', 'ws')) + '/ws/admin/terminal';
    ws = new WebSocket(wsUrl);

    ws.onopen = () => appendTerminal('[Connected to backend terminal]', 'success');
    ws.onmessage = e => appendTerminal(e.data);
    ws.onclose = () => {
      appendTerminal('[Disconnected]', 'warn');
      setTimeout(connectWS, 3000);
    };
    ws.onerror = () => appendTerminal('[WebSocket error]', 'error');
  }

  connectWS();

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      if (!cmd) return;
      appendTerminal(`> ${cmd}`);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ cmd }));
      }
      input.value = '';
    }
  });

  function appendTerminal(text, cls = '') {
    const line = document.createElement('div');
    if (cls) line.className = `t-${cls}`;
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }
}

// ===== ADMIN USERS TABLE =====
async function loadAdminUsers() {
  const container = document.getElementById('admin-users');
  if (!container) return;

  container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  const { ok, data } = await apiFetch('/api/admin/users?sort=latest');

  if (!ok) { container.innerHTML = '<div class="flash flash--error">Access denied or error.</div>'; return; }

  if (!data.users || data.users.length === 0) {
    container.innerHTML = '<div class="empty-state"><div>No users registered.</div></div>';
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>Username</th><th>Email</th><th>Role</th><th>Registered</th></tr>
      </thead>
      <tbody>
        ${data.users.map(u => `
          <tr>
            <td>${escHtml(u.username)}</td>
            <td>${escHtml(u.email)}</td>
            <td>${u.role}</td>
            <td>${formatDate(u.created_at)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ===== ESCAPE HTML =====
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  // Pages detection
  const page = document.body.dataset.page;

  switch (page) {
    case 'index': await loadPostList(); break;
    case 'post': await loadSinglePost(); break;
    case 'login': await setupLoginForm(); break;
    case 'register': await setupRegisterForm(); break;
    case 'admin': await setupAdmin(); break;
  }

  // Logout buttons
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); logout(); });
  });
});
