const POSTS = Array.isArray(window.LINSA_POSTS) ? window.LINSA_POSTS : [];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function readingTime(markdown) {
  const words = String(markdown || '')
    .replace(/[#>*_\-[\]()]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
}

function icon(name, size = 14) {
  return `<img src="/assets/svgs/${name}.svg" width="${size}" height="${size}" alt="" aria-hidden="true" style="vertical-align:middle;">`;
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


function renderInlineMarkdown(value) {
  return escHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function renderSimpleMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      const level = heading[1].length + 1;
      blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    paragraph.push(trimmed);
  }
  flushParagraph();
  return blocks.join('');
}

function sortedPosts() {
  return [...POSTS].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function postUrl(post) {
  return `/posts/${encodeURIComponent(post.slug || post.id)}.html`;
}

function tagList(post) {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  if (tags.length === 0) return '';

  return `<div class="post-tags">${tags.map(tag => `<span class="post-tag">#${escHtml(tag)}</span>`).join('')}</div>`;
}

function postCard(post) {
  const image = post.image_path
    ? `<img class="post-card__image" src="${escHtml(post.image_path)}" alt="${escHtml(post.title)}" width="200" height="140" loading="lazy" decoding="async">`
    : `<div class="post-card__image-placeholder">//</div>`;

  return `
    <article class="post-card page-content">
      ${image}
      <div class="post-card__body">
        <div class="post-card__meta">
          ${icon('calendar', 11)}
          <span>${formatDate(post.created_at)}</span>
          <span>${readingTime(post.content_markdown)} min read</span>
        </div>
        <h2 class="post-card__title">${escHtml(post.title)}</h2>
        <p class="post-card__caption">${escHtml(post.caption || '')}</p>
        ${tagList(post)}
        <div class="post-card__footer">
          <a href="${postUrl(post)}" class="btn btn--sm">${icon('arrow-right', 12)} Read more</a>
        </div>
      </div>
    </article>`;
}

function loadPostList() {
  const container = document.getElementById('posts-list');
  if (!container) return;

  if (POSTS.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">//</div>
        <div>No articles available yet.</div>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="posts-grid">${sortedPosts().map(postCard).join('')}</div>`;
}

function findPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const id = params.get('id');
  const key = slug || id;

  if (!key) return null;
  return POSTS.find(post => post.slug === key || post.id === key) || null;
}

function loadSinglePost() {
  const container = document.getElementById('post-container');
  if (!container) return;

  const post = findPost();
  if (!post) {
    document.title = 'Post not found — LinsaFTW';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">//</div>
        <div>Post not found.</div>
        <div class="mt-16"><a href="/" class="btn btn--sm">${icon('arrow-left', 12)} Back to articles</a></div>
      </div>`;
    return;
  }

  document.title = `${post.title} — LinsaFTW`;

  const image = post.image_path ? `
    <div class="post-image-wrap">
      <img class="post-image" src="${escHtml(post.image_path)}" alt="${escHtml(post.title)}" width="860" height="400" loading="eager" decoding="async">
      ${post.caption ? `<p class="post-image-caption">${escHtml(post.caption)}</p>` : ''}
    </div>` : '';

  container.innerHTML = `
    <article class="post-page page-content">
      <div class="post-header">
        <div class="post-meta">
          <span>${icon('calendar', 11)} ${formatDate(post.created_at)}</span>
          <span>${icon('clock', 11)} ${readingTime(post.content_markdown)} min read</span>
        </div>
        <h1 class="post-title">${escHtml(post.title)}</h1>
        ${post.caption ? `<p class="post-caption">${escHtml(post.caption)}</p>` : ''}
        ${tagList(post)}
      </div>
      ${image}
      <div class="post-content" id="post-content-render"></div>
    </article>`;

  const content = document.getElementById('post-content-render');
  if (!content) return;

  content.innerHTML = renderSimpleMarkdown(post.content_markdown || '');
}

function initTimeline() {
  const items = Array.from(document.querySelectorAll('.timeline-item'));
  const detail = document.getElementById('timeline-detail');
  if (!items.length || !detail) return;

  const setActive = (item) => {
    items.forEach(el => el.classList.remove('is-active'));
    item.classList.add('is-active');
    detail.innerHTML = `<strong>${escHtml(item.dataset.year || '')}</strong><span>${escHtml(item.dataset.detail || '')}</span>`;
  };

  items.forEach(item => {
    item.addEventListener('click', () => setActive(item));
    item.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = items.indexOf(item);
      const next = event.key === 'Home'
        ? items[0]
        : event.key === 'End'
          ? items[items.length - 1]
          : event.key === 'ArrowRight'
            ? items[(index + 1) % items.length]
            : items[(index - 1 + items.length) % items.length];
      next.focus();
      setActive(next);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'index') loadPostList();
  if (page === 'post') loadSinglePost();
  initTimeline();
});
