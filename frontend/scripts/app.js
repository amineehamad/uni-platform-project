/* ============================================================
   INSAT Events — app.js
   DOM manipulation, event rendering, theme, QR modal, countdown
   ============================================================ */

'use strict';

// ── Theme Toggle ────────────────────────────────────────────
const Theme = {
  STORAGE_KEY: 'insat_theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    this.apply(theme);
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.apply(current === 'dark' ? 'light' : 'dark');
  }
};

// ── Scroll Progress Bar ─────────────────────────────────────
function initScrollProgress() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${(scrolled / max) * 100}%` : '0%';
  }, { passive: true });
}

// ── Navbar ──────────────────────────────────────────────────
function initNavbar() {
  // Burger
  const burger = document.querySelector('.nav-burger');
  const navMenu = document.querySelector('.navbar-nav');
  if (burger && navMenu) {
    burger.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar')) navMenu.classList.remove('open');
    });
  }

  // Update nav based on auth state
  const isLoggedIn = window.INSAT?.Auth?.isLoggedIn();
  const user = window.INSAT?.Auth?.getUser();

  document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
    el.style.display = isLoggedIn ? 'none' : '';
  });
  document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
    el.style.display = isLoggedIn ? '' : 'none';
  });

  if (user) {
    document.querySelectorAll('.nav-avatar').forEach(el => {
      const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
      el.textContent = initials || '👤';
    });
    document.querySelectorAll('.nav-user-name').forEach(el => {
      el.textContent = user.first_name || 'My Account';
    });
  }
}

// ── Event Card Renderer ─────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getSeatsStatus(remaining, total) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  if (remaining === 0) return { label: 'Fully Booked', class: 'scarce', pct: 100, fillClass: 'scarce' };
  if (pct <= 15)       return { label: `${remaining} left — Hurry!`, class: 'scarce',  pct: Math.min(((total - remaining) / total) * 100, 100), fillClass: 'scarce' };
  if (pct <= 40)       return { label: `${remaining} seats left`,   class: 'limited', pct: Math.min(((total - remaining) / total) * 100, 100), fillClass: 'limited' };
  return               { label: `${remaining} seats available`,  class: 'plenty',  pct: Math.min(((total - remaining) / total) * 100, 100), fillClass: 'plenty' };
}

function createEventCard(event) {
  const seats = getSeatsStatus(event.seats_remaining, event.seats_total);
  const isFree = event.price === 0;
  const isFull = event.seats_remaining === 0;

  const card = document.createElement('article');
  card.className = 'event-card';
  card.dataset.eventId = event.id;
  card.innerHTML = `
    <div class="event-card-image">
      <img
        src="${event.image || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80`}"
        alt="${event.title}"
        loading="lazy"
      />
      <div class="event-card-image-overlay">
        <span class="badge badge-dark price-badge ${isFree ? 'free' : 'paid'}">
          ${isFree ? 'FREE' : `${event.price} TND`}
        </span>
        ${isFull ? '<span class="badge badge-red">Full</span>' : ''}
      </div>
    </div>
    <div class="event-card-body">
      <div class="event-card-club">
        <span class="event-card-club-dot" style="background:${event.club_color || 'var(--brand-primary)'}"></span>
        ${event.club}
      </div>
      <h3 class="event-card-title">${event.title}</h3>
      <p class="event-card-desc">${event.description}</p>
      <div class="event-card-meta">
        <div class="event-meta-item">
          <span class="icon">📅</span>
          <span>${formatDate(event.date)}</span>
        </div>
        <div class="event-meta-item">
          <span class="icon">🕐</span>
          <span>${formatTime(event.date)}</span>
        </div>
        <div class="event-meta-item">
          <span class="icon">📍</span>
          <span>${event.location}</span>
        </div>
      </div>
      <div class="seats-bar-wrap">
        <div class="seats-bar-label">
          <span>${seats.label}</span>
          <span>${event.seats_total} total</span>
        </div>
        <div class="seats-bar-track">
          <div class="seats-bar-fill ${seats.fillClass}" style="width:${seats.pct}%"></div>
        </div>
      </div>
    </div>
    <div class="event-card-footer">
      ${event.tags?.slice(0,2).map(t => `<span class="badge badge-gray">${t}</span>`).join('') || ''}
      <a href="event-details.html?id=${event.id}" class="btn btn-primary btn-sm" style="margin-left:auto">
        View Details
      </a>
    </div>
  `;
  return card;
}

// ── Events Grid ─────────────────────────────────────────────
async function renderEventsGrid(containerId, params = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Show skeletons
  container.innerHTML = Array(6).fill(`
    <div class="event-card">
      <div class="event-card-image skeleton"></div>
      <div class="event-card-body" style="gap:.75rem">
        <div class="skeleton" style="height:12px;width:60%"></div>
        <div class="skeleton" style="height:20px;width:85%"></div>
        <div class="skeleton" style="height:14px;width:100%"></div>
        <div class="skeleton" style="height:14px;width:75%"></div>
      </div>
    </div>
  `).join('');

  try {
    const res = await window.INSAT.getEvents(params);
    const events = res?.data || res || [];

    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No events found</div>
          <p class="empty-state-desc">Try adjusting your filters or check back later.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    events.forEach((ev, i) => {
      const card = createEventCard(ev);
      card.style.animationDelay = `${i * 60}ms`;
      card.classList.add('page-enter');
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to load events</div>
        <p class="empty-state-desc">${err.message}</p>
      </div>
    `;
  }
}

// ── Recommended Row ─────────────────────────────────────────
async function renderRecommendedRow(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user = window.INSAT?.Auth?.getUser();
  const academicYear = user?.academic_year || null;

  try {
    const res = await window.INSAT.getEvents();
    let events = res?.data || res || [];

    if (academicYear) {
      events = events.filter(e =>
        !e.recommended_for || e.recommended_for.includes(academicYear)
      );
    }

    events = events.slice(0, 5);

    container.innerHTML = '';
    events.forEach(ev => {
      const card = createEventCard(ev);
      container.appendChild(card);
    });
  } catch {
    container.innerHTML = '<p class="text-muted" style="padding:1rem">Could not load recommendations.</p>';
  }
}

// ── Filter Chips ─────────────────────────────────────────────
function initFilterChips(eventsContainerId) {
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const category = chip.dataset.filter === 'all' ? {} : { category: chip.dataset.filter };
      renderEventsGrid(eventsContainerId, category);
    });
  });
}

// ── Search ───────────────────────────────────────────────────
function initSearch(eventsContainerId) {
  const searchInput = document.querySelector('.search-bar input');
  if (!searchInput) return;

  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = searchInput.value.trim();
      renderEventsGrid(eventsContainerId, q ? { search: q } : {});
    }, 400);
  });
}

// ── Countdown Timer ──────────────────────────────────────────
function startCountdown(targetDate, selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  function update() {
    const diff = new Date(targetDate) - Date.now();
    if (diff <= 0) {
      el.innerHTML = '<div class="countdown-cell" style="grid-column:1/-1"><div class="countdown-num">Event Started</div></div>';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.innerHTML = `
      ${[['Days', d], ['Hours', h], ['Mins', m], ['Secs', s]].map(([unit, val]) => `
        <div class="countdown-cell">
          <div class="countdown-num">${String(val).padStart(2,'0')}</div>
          <div class="countdown-unit">${unit}</div>
        </div>
      `).join('')}
    `;
  }

  update();
  return setInterval(update, 1000);
}

// ── QR Code Modal ────────────────────────────────────────────
function showQRModal(event, ticketId) {
  const existing = document.getElementById('qr-modal');
  if (existing) existing.remove();

  const ticketCode = ticketId || `TKT-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  const qrContent = `INSAT|${event?.id || 'EVT'}|${ticketCode}|${Date.now()}`;

  // Generate simple QR placeholder (could integrate qrcode.js library)
  const qrSize = 180;
  const qrSvg = generateSimpleQR(qrContent, qrSize);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'qr-modal';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:380px;text-align:center">
      <button class="modal-close" aria-label="Close">✕</button>
      <h2 style="font-family:'DM Serif Display',serif;font-size:1.5rem;margin-bottom:.25rem">Your Ticket 🎟️</h2>
      <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:.5rem">${event?.title || 'Event'}</p>
      <div class="qr-canvas-wrap">
        ${qrSvg}
      </div>
      <div class="qr-ticket-id">${ticketCode}</div>
      <p class="qr-ticket-code">${qrContent.slice(0,32)}…</p>
      <div style="margin-top:1.5rem;display:flex;gap:.75rem;justify-content:center">
        <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print</button>
        <button class="btn btn-primary btn-sm" id="close-qr-btn">Done</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector('.modal-close').addEventListener('click', close);
  document.getElementById('close-qr-btn')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.body.appendChild(overlay);
}

// Simple SVG QR-code placeholder (real implementation uses qrcode.js)
function generateSimpleQR(content, size) {
  // This generates a visually representative "QR-style" placeholder SVG.
  // In production, replace with: https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
  const cells = 21;
  const cellSize = size / cells;

  // Deterministic pattern based on content hash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash |= 0;
  }

  let rects = '';
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      // Position pattern corners (always dark)
      const inTopLeft     = (r < 7 && c < 7);
      const inTopRight    = (r < 7 && c >= cells - 7);
      const inBottomLeft  = (r >= cells - 7 && c < 7);

      let dark = false;
      if (inTopLeft || inTopRight || inBottomLeft) {
        const rr = inTopRight ? r : r;
        const cc = inTopRight ? c - (cells - 7) : inBottomLeft ? c : c;
        const rLocal = inBottomLeft ? r - (cells - 7) : r;
        dark = (rr === 0 || rr === 6 || cc === 0 || cc === 6 ||
               (rLocal >= 1 && rLocal <= 5 && cc >= 1 && cc <= 5 &&
                !(rLocal >= 2 && rLocal <= 4 && cc >= 2 && cc <= 4)));
        if (inTopRight) dark = (r === 0 || r === 6 || (c - (cells-7)) === 0 || (c - (cells-7)) === 6 || (r >= 2 && r <= 4 && c >= cells-5 && c <= cells-3));
        if (inBottomLeft) dark = ((r - (cells-7)) === 0 || (r - (cells-7)) === 6 || c === 0 || c === 6 || ((r >= cells-5) && (r <= cells-3) && c >= 2 && c <= 4));
      } else {
        dark = ((Math.abs(hash * (r + 1) * (c + 1)) % 3) === 0);
      }

      if (dark) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="border-radius:4px">${rects}</svg>`;
}

// ── Register for Event ───────────────────────────────────────
async function registerForEvent(eventId) {
  if (!window.INSAT.Auth.isLoggedIn()) {
    window.location.href = `login.html?redirect=event-details.html?id=${eventId}`;
    return;
  }

  const btn = document.getElementById('register-btn');
  if (btn) window.INSAT.setButtonLoading(btn, true, 'Registering…');

  try {
    const res = await window.INSAT.EventsAPI.register(eventId);
    window.INSAT.Toast.success('🎉 Registered successfully!');

    // Show QR modal
    const eventRes = await window.INSAT.getEvent(eventId);
    const event = eventRes?.data || eventRes;
    showQRModal(event, res?.ticket_id);

    if (btn) {
      btn.textContent = '✅ Registered';
      btn.disabled = true;
    }
  } catch (err) {
    if (btn) window.INSAT.setButtonLoading(btn, false, 'Register Now');
    window.INSAT.Toast.error(err.message || 'Registration failed. Please try again.');
  }
}

// ── My Events Page ───────────────────────────────────────────
async function renderMyEvents() {
  const container = document.getElementById('my-events-list');
  if (!container) return;

  if (!window.INSAT.Auth.isLoggedIn()) {
    window.location.href = 'login.html?redirect=my-events.html';
    return;
  }

  container.innerHTML = `<div class="ticket-card skeleton" style="height:120px"></div>`.repeat(3);

  try {
    const res = await window.INSAT.getUserEvents();
    const events = res?.data || res || [];

    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎟️</div>
          <div class="empty-state-title">No registered events yet</div>
          <p class="empty-state-desc">Explore events and register to see them here.</p>
          <a href="index.html" class="btn btn-primary" style="margin-top:1rem">Browse Events</a>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    let totalPoints = 0;

    events.forEach(ev => {
      const isPast = new Date(ev.date) < Date.now();
      const points = ev.points || (isPast ? 150 : 0);
      totalPoints += points;

      const card = document.createElement('div');
      card.className = 'ticket-card';
      card.innerHTML = `
        <div class="ticket-card-accent"></div>
        <div class="ticket-card-image">
          <img src="${ev.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=70'}" alt="${ev.title}" loading="lazy"/>
        </div>
        <div class="ticket-card-body">
          <div class="event-card-club" style="font-size:.7rem">
            <span class="event-card-club-dot" style="background:${ev.club_color||'var(--brand-primary)'}"></span>
            ${ev.club}
          </div>
          <h3 style="font-family:'DM Serif Display',serif;font-size:1.05rem;line-height:1.3">${ev.title}</h3>
          <div class="event-meta-item" style="font-size:.78rem">
            <span class="icon">📅</span>
            <span>${formatDate(ev.date)} · ${formatTime(ev.date)}</span>
          </div>
          <div class="event-meta-item" style="font-size:.78rem">
            <span class="icon">📍</span>
            <span>${ev.location}</span>
          </div>
          ${isPast ? `<span class="badge badge-green" style="width:fit-content">Attended · +${points} pts</span>` : `<span class="badge badge-blue" style="width:fit-content">Upcoming</span>`}
          <div class="ticket-card-actions">
            <button class="btn btn-ghost btn-sm" onclick="showQRModal(${JSON.stringify(ev).replace(/"/g,"'")}, '${ev.ticket_id || ''}')">
              📱 QR Ticket
            </button>
            <a href="event-details.html?id=${ev.id}" class="btn btn-secondary btn-sm">View</a>
            ${!isPast ? `<button class="btn btn-danger btn-sm" data-cancel="${ev.id}">Cancel</button>` : ''}
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // Update points widget
    const pointsEl = document.getElementById('total-points');
    if (pointsEl) {
      pointsEl.textContent = totalPoints;
      const progressFill = document.querySelector('.points-progress-fill');
      if (progressFill) {
        const nextMilestone = Math.ceil(totalPoints / 500) * 500;
        progressFill.style.width = `${(totalPoints % 500) / 500 * 100}%`;
      }
    }

    // Cancel buttons
    container.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.cancel;
        if (!confirm('Cancel your registration for this event?')) return;
        try {
          await window.INSAT.EventsAPI.cancel(id);
          window.INSAT.Toast.success('Registration cancelled.');
          renderMyEvents();
        } catch (err) {
          window.INSAT.Toast.error(err.message || 'Could not cancel. Try again.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<p class="text-muted">${err.message}</p>`;
  }
}

// ── Protected Route Guard ────────────────────────────────────
function requireAuth(redirectTo = 'login.html') {
  if (!window.INSAT?.Auth?.isLoggedIn()) {
    window.location.href = `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`;
    return false;
  }
  return true;
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  initScrollProgress();
  initNavbar();

  // Theme toggle buttons
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => Theme.toggle());
  });

  // Page-specific init
  const page = document.body.dataset.page;

  if (page === 'home') {
    renderEventsGrid('events-grid');
    renderRecommendedRow('recommended-row');
    initFilterChips('events-grid');
    initSearch('events-grid');
  }

  if (page === 'my-events') {
    renderMyEvents();
  }
});

// ── Exports ──────────────────────────────────────────────────
window.INSAT = window.INSAT || {};
Object.assign(window.INSAT, {
  Theme,
  showQRModal,
  registerForEvent,
  renderMyEvents,
  requireAuth,
  startCountdown,
  createEventCard,
  formatDate,
  formatTime,
  getSeatsStatus,
});
