// ============================================================
//  API HELPER
// ============================================================
const Api = {
  async get(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    return res.json();
  },
  async post(action, payload = {}) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
    });
    return res.json();
  },
};

// ============================================================
//  TOAST POPUP SYSTEM
//  Usage:
//    Toast.loading('বার্তা')   → স্পিনার সহ লোডিং
//    Toast.success('বার্তা')   → সবুজ সফল বার্তা
//    Toast.error('বার্তা')     → লাল ত্রুটি বার্তা
//    Toast.warning('বার্তা')   → হলুদ সতর্কতা
// ============================================================
const Toast = (() => {
  function getWrap() {
    let w = document.getElementById('_toastWrap');
    if (!w) {
      w = document.createElement('div');
      w.id = '_toastWrap';
      w.style.cssText = `
        position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
        z-index:9999; display:flex; flex-direction:column-reverse;
        align-items:center; gap:10px; pointer-events:none; width:min(92vw,420px);
      `;
      document.body.appendChild(w);
    }
    return w;
  }

  let _active = null;

  function make(type, msg, icon, duration) {
    if (_active && type === 'loading') {
      _active.classList.add('_tout');
      setTimeout(() => _active && _active.remove(), 350);
      _active = null;
    }

    const colors = {
      loading: { bg: 'linear-gradient(135deg,#1C2B39,#2a3f52)', color: '#F3EEE2', border: 'rgba(169,121,60,.5)' },
      success: { bg: 'linear-gradient(135deg,#4a6e4c,#5F7161)', color: '#fff',    border: 'rgba(95,113,97,.6)' },
      error:   { bg: 'linear-gradient(135deg,#8b3030,#9A3B3B)', color: '#fff',    border: 'rgba(154,59,59,.6)' },
      warning: { bg: 'linear-gradient(135deg,#8a6230,#A9793C)', color: '#fff',    border: 'rgba(169,121,60,.6)' },
    };
    const c = colors[type] || colors.loading;

    const el = document.createElement('div');
    el.style.cssText = `
      width:100%; padding:14px 18px; border-radius:10px;
      background:${c.bg}; color:${c.color};
      border:1px solid ${c.border};
      box-shadow:0 8px 32px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.15);
      font-family:'Hind Siliguri',sans-serif; font-size:.95rem; font-weight:600;
      display:flex; align-items:center; gap:12px;
      pointer-events:auto; cursor:default;
      animation: _tin .35s cubic-bezier(.34,1.56,.64,1) both;
    `;

    const iconEl = document.createElement('div');
    iconEl.style.cssText = `
      width:32px; height:32px; border-radius:50%; flex-shrink:0;
      background:rgba(255,255,255,.15);
      display:flex; align-items:center; justify-content:center;
      font-size:1.05rem;
    `;

    if (type === 'loading') {
      iconEl.innerHTML = `<div style="
        width:18px;height:18px;border-radius:50%;
        border:2px solid rgba(255,255,255,.25);
        border-top-color:#A9793C;
        animation:_spin .7s linear infinite;
      "></div>`;
    } else {
      iconEl.textContent = icon;
    }

    const text = document.createElement('span');
    text.textContent = msg;
    text.style.flex = '1';

    const close = document.createElement('button');
    close.textContent = '✕';
    close.style.cssText = `
      background:none;border:none;color:rgba(255,255,255,.6);
      cursor:pointer;font-size:.85rem;padding:2px 4px;margin-left:4px;
      font-family:sans-serif;
    `;
    close.onclick = () => dismiss(el);

    el.appendChild(iconEl);
    el.appendChild(text);
    el.appendChild(close);
    getWrap().appendChild(el);

    if (type === 'loading') {
      _active = el;
    } else {
      _active = null;
      setTimeout(() => dismiss(el), duration || 3000);
    }
    return el;
  }

  function dismiss(el) {
    if (!el || !el.parentNode) return;
    el.style.animation = '_tout .35s ease forwards';
    setTimeout(() => el.remove(), 350);
    if (_active === el) _active = null;
  }

  // CSS keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes _tin  { from{opacity:0;transform:translateY(20px) scale(.9)} to{opacity:1;transform:none} }
    @keyframes _tout { from{opacity:1;transform:none} to{opacity:0;transform:translateY(-14px) scale(.92)} }
    @keyframes _spin { to{transform:rotate(360deg)} }
  `;
  document.head.appendChild(style);

  return {
    loading: (msg = 'তথ্য জমা হচ্ছে... অপেক্ষা করুন।') => make('loading', msg, '⏳'),
    success: (msg = 'সফলভাবে সম্পন্ন হয়েছে।')          => make('success', msg, '✓', 3000),
    error:   (msg = 'একটি সমস্যা হয়েছে।')               => make('error',   msg, '✕', 4000),
    warning: (msg = 'সতর্কতা!')                          => make('warning', msg, '⚠', 3500),
    clear:   ()                                           => { if (_active) dismiss(_active); },

    // পুরনো নামের সাথে সামঞ্জস্য (backward compat)
    ok:  (msg) => make('success', msg, '✓', 3000),
    err: (msg) => make('error',   msg, '✕', 4000),
  };
})();

// ============================================================
//  CUSTOM CONFIRM DIALOG  (browser confirm() এর বদলে)
//  Usage: await Dialog.confirm('বইটি মুছে ফেলতে চান?')
//         → true/false
// ============================================================
const Dialog = {
  confirm(msg, { title = 'নিশ্চিত করুন', okText = 'হ্যাঁ', cancelText = 'বাতিল', danger = true } = {}) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.style.cssText = `
        position:fixed;inset:0;background:rgba(28,43,57,.6);
        z-index:8000;display:flex;align-items:center;justify-content:center;
        padding:20px;backdrop-filter:blur(3px);
        animation:_tin .2s ease;
      `;
      backdrop.innerHTML = `
        <div style="
          background:#FFFDF7;border-radius:12px;padding:28px 26px;
          max-width:380px;width:100%;
          box-shadow:0 20px 60px rgba(0,0,0,.35);
          animation:_tin .3s cubic-bezier(.34,1.56,.64,1);
          font-family:'Hind Siliguri',sans-serif;
        ">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <div style="
              width:40px;height:40px;border-radius:50%;flex-shrink:0;
              background:${danger ? 'rgba(154,59,59,.12)' : 'rgba(169,121,60,.12)'};
              display:flex;align-items:center;justify-content:center;
              font-size:1.3rem;
            ">${danger ? '🗑️' : 'ℹ️'}</div>
            <div style="font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:#1C2B39;">${title}</div>
          </div>
          <p style="color:#6B6759;font-size:.95rem;margin:0 0 22px;line-height:1.7;">${msg}</p>
          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button id="_dCancel" style="
              padding:10px 20px;border-radius:6px;border:1px solid #D8D0BC;
              background:transparent;color:#6B6759;cursor:pointer;
              font-family:'Hind Siliguri',sans-serif;font-size:.9rem;font-weight:600;
              transition:background .15s;
            ">${cancelText}</button>
            <button id="_dOk" style="
              padding:10px 22px;border-radius:6px;border:none;
              background:${danger ? 'linear-gradient(135deg,#8b3030,#9A3B3B)' : 'linear-gradient(135deg,#C49A55,#A9793C)'};
              color:#fff;cursor:pointer;
              font-family:'Hind Siliguri',sans-serif;font-size:.9rem;font-weight:600;
              box-shadow:0 3px 0 ${danger ? '#6b2828' : '#6b5225'},0 5px 12px rgba(0,0,0,.2);
              transition:transform .1s,box-shadow .1s;
            ">${okText}</button>
          </div>
        </div>`;

      document.body.appendChild(backdrop);

      const ok = backdrop.querySelector('#_dOk');
      const cancel = backdrop.querySelector('#_dCancel');

      function close(val) {
        backdrop.style.animation = '_tout .25s ease forwards';
        setTimeout(() => backdrop.remove(), 250);
        resolve(val);
      }

      ok.onclick = () => close(true);
      cancel.onclick = () => close(false);
      backdrop.addEventListener('click', e => { if (e.target === backdrop) close(false); });

      ok.onmousedown = () => { ok.style.transform = 'translateY(2px)'; ok.style.boxShadow = 'none'; };
      ok.onmouseup   = () => { ok.style.transform = ''; ok.style.boxShadow = ''; };
      cancel.onmouseenter = () => { cancel.style.background = 'rgba(28,43,57,.06)'; };
      cancel.onmouseleave = () => { cancel.style.background = 'transparent'; };

      setTimeout(() => ok.focus(), 50);
    });
  },
};

// ============================================================
//  GLOBAL RIPPLE on .btn clicks
// ============================================================
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn || btn.disabled) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
});

// ============================================================
//  SESSION SYSTEM  (Admin + Role-based Users)
// ============================================================

// ---- Admin ----
function isAdmin() { return sessionStorage.getItem('isAdmin') === 'yes'; }
function setAdmin(on) {
  if (on) sessionStorage.setItem('isAdmin', 'yes');
  else sessionStorage.removeItem('isAdmin');
}

// ---- User session ----
function getUser() {
  try { return JSON.parse(sessionStorage.getItem('_pathUser') || 'null'); }
  catch(e) { return null; }
}
function setUser(u) {
  if (u) sessionStorage.setItem('_pathUser', JSON.stringify(u));
  else sessionStorage.removeItem('_pathUser');
}
function isLoggedIn() { return isAdmin() || !!getUser(); }

// পারমিশন চেক
function hasPerm(perm) {
  if (isAdmin()) return true;
  const u = getUser();
  if (!u) return false;
  return Array.isArray(u.permissions) && u.permissions.includes(perm);
}

// শর্টকাট চেকার
const Can = {
  viewBooks:    () => hasPerm('books_view'),
  editBooks:    () => hasPerm('books_edit'),
  viewBooking:  () => hasPerm('booking_view'),
  editBooking:  () => hasPerm('booking_edit'),
  viewMembers:  () => hasPerm('members_view'),
  editMembers:  () => hasPerm('members_edit'),
  viewFinance:  () => hasPerm('finance_view'),
  editFinance:  () => hasPerm('finance_edit'),
  editNotices:  () => isAdmin() || hasPerm('notices_edit'),
  editProjects: () => isAdmin() || hasPerm('projects_edit'),
  editGallery:  () => isAdmin() || hasPerm('gallery_edit'),
  viewReports:  () => hasPerm('reports_view'),
};

// লগআউট (সব session মুছা)
function fullLogout() {
  setAdmin(false);
  setUser(null);
  renderAdminSlot();
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}
function toInputDate(d) {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date)) return '';
  return date.toISOString().slice(0, 10);
}

// ============================================================
//  REFRESH BUTTON
// ============================================================
function renderRefreshBtn(onRefresh) {
  const wrap = document.getElementById('refreshBtnRoot');
  if (!wrap) return;
  wrap.innerHTML = `<button class="btn small outline" id="refreshBtn" title="ডেটা আবার লোড করুন">↻ রিফ্রেশ</button>`;
  wrap.querySelector('#refreshBtn').addEventListener('click', async () => {
    const btn = wrap.querySelector('#refreshBtn');
    btn.disabled = true; btn.textContent = '↻ লোড হচ্ছে...';
    try { if (typeof onRefresh === 'function') await onRefresh(); }
    finally { btn.disabled = false; btn.textContent = '↻ রিফ্রেশ'; }
  });
  window._pageRefreshFn = onRefresh;
}

// ============================================================
//  NAVIGATION (dropdown submenus + hamburger)
// ============================================================
function renderNav(active) {
  const loggedIn  = isAdmin() || !!getUser();
  const adminUser = isAdmin();

  // ডেস্কটপ সাব-মেনু হেল্পার
  function drop(label, items, activeHref) {
    const isActive = items.some(([href]) => href === activeHref);
    const lis = items.map(([href, lbl]) =>
      `<a class="nav-dd-item ${href === activeHref ? 'active' : ''}" href="${href}" onclick="closeMenu()">${lbl}</a>`
    ).join('');
    return `<div class="nav-dd ${isActive ? 'active-parent' : ''}">
      <button class="nav-dd-btn">${label} <span class="nav-dd-arrow">▾</span></button>
      <div class="nav-dd-panel">${lis}</div>
    </div>`;
  }

  // ডেস্কটপ নেভ
  let desktopLinks = `
    <a class="nav-link ${active==='index.html'?'active':''}" href="index.html">হোম</a>
    ${drop('বই ▾', [['books.html','বই তালিকা'],['booking.html','বই বুকিং']], active)}
    ${drop('সদস্য ▾', [
      ['members.html','সদস্য তালিকা'],
      ['committee.html','কমিটি তালিকা'],
      ['register.html','নতুন সদস্য হোন'],
    ], active)}
    <a class="nav-link ${active==='gallery.html'?'active':''}" href="gallery.html">গ্যালারি</a>
    <a class="nav-link ${active==='notices.html'?'active':''}" href="notices.html">নোটিশ</a>
    <a class="nav-link ${active==='projects.html'?'active':''}" href="projects.html">কার্যক্রম</a>
    <a class="nav-link ${active==='donations.html'?'active':''}" href="donations.html">অনুদান</a>
    <a class="nav-link ${active==='contact.html'?'active':''}" href="contact.html">যোগাযোগ</a>
  `;

  // মোবাইল ড্রয়ার লিংক (flat list)
  const drawerLinks = [
    ['index.html',    'হোম'],
    ['books.html',    '📚 বই তালিকা'],
    ['booking.html',  '🔖 বই বুকিং'],
    ['members.html',  '🧑 সদস্য তালিকা'],
    ['committee.html','🏛️ কমিটি তালিকা'],
    ['register.html', '✍️ নতুন সদস্য হোন'],
    ['gallery.html',  '📷 গ্যালারি'],
    ['notices.html',  '📢 নোটিশ'],
    ['projects.html', '🏗️ কার্যক্রম'],
    ['donations.html','💛 অনুদান'],
    ['contact.html',  '📞 যোগাযোগ'],
  ];

  // অ্যাডমিন-অনলি আইটেম
  if (adminUser) {
    drawerLinks.push(
      ['finance.html',  '💰 আয়-ব্যয়'],
      ['message.html',  '✉️ বার্তা'],
      ['admin.html',    '⚙️ অ্যাডমিন প্যানেল'],
    );
    desktopLinks += `
      ${drop('অ্যাডমিন ▾', [
        ['finance.html','💰 আয়-ব্যয়'],
        ['message.html','✉️ বার্তা'],
        ['admin.html','⚙️ প্যানেল'],
      ], active)}
    `;
  } else if (loggedIn && Can.viewFinance()) {
    drawerLinks.push(['finance.html', '💰 আয়-ব্যয়']);
    desktopLinks += `<a class="nav-link ${active==='finance.html'?'active':''}" href="finance.html">আয়-ব্যয়</a>`;
  }

  const drawerHtml = drawerLinks.map(([href, lbl]) =>
    `<a class="nav-link ${active===href?'active':''}" href="${href}" onclick="closeMenu()">${lbl}</a>`
  ).join('');

  document.getElementById('navRoot').innerHTML = `
    <nav class="nav">
      <a href="index.html" class="brand"><span class="tab"></span>শহীদ আইয়ুব আলী স্মৃতি সংঘ ও পাঠাগার</a>
      <div class="nav-desktop">${desktopLinks}<span id="adminSlot"></span></div>
      <button class="hamburger" id="hamburgerBtn" onclick="toggleMenu()" aria-label="মেনু">
        <span></span><span></span><span></span>
      </button>
    </nav>
    <div class="nav-drawer" id="navDrawer">
      <div class="nav-drawer-inner">${drawerHtml}<span id="adminSlotMobile"></span></div>
    </div>
    <div class="nav-overlay" id="navOverlay" onclick="closeMenu()"></div>
  `;
  renderAdminSlot();
  initDropdowns();
}

// ড্রপডাউন init
function initDropdowns() {
  document.querySelectorAll('.nav-dd').forEach(dd => {
    const btn = dd.querySelector('.nav-dd-btn');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      // অন্য সব বন্ধ করো
      document.querySelectorAll('.nav-dd.open').forEach(o => { if (o !== dd) o.classList.remove('open'); });
      dd.classList.toggle('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dd.open').forEach(o => o.classList.remove('open'));
  });
}

function toggleMenu() {
  const open = document.getElementById('navDrawer').classList.toggle('open');
  document.getElementById('navOverlay').classList.toggle('open', open);
  document.getElementById('hamburgerBtn').classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function closeMenu() {
  document.getElementById('navDrawer')?.classList.remove('open');
  document.getElementById('navOverlay')?.classList.remove('open');
  document.getElementById('hamburgerBtn')?.classList.remove('active');
  document.body.style.overflow = '';
}

function renderAdminSlot() {
  let html;
  if (isAdmin()) {
    html = `<a class="nav-link admin-tag" href="#" onclick="doAdminLogout();return false;">অ্যাডমিন ● লগআউট</a>
            <a class="nav-link" href="admin.html" style="color:var(--brass);font-size:.8rem;">⚙ প্যানেল</a>`;
  } else if (getUser()) {
    const u = getUser();
    html = `<span class="nav-link" style="color:#9ecfb0;font-size:.82rem;">👤 ${u.name}</span>
            <a class="nav-link" href="#" onclick="fullLogout();return false;" style="font-size:.8rem;opacity:.7;">লগআউট</a>`;
  } else {
    html = `<a class="nav-link" href="#" onclick="openLoginModal();return false;">🔑 লগইন</a>`;
  }
  ['adminSlot','adminSlotMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

// ============================================================
//  USER LOGIN MODAL (সদস্য লগইন)
// ============================================================
function openLoginModal() {
  document.getElementById('adminModalRoot').innerHTML = `
    <div class="modal-backdrop" onclick="closeLoginModal(event)">
      <div class="modal" onclick="event.stopPropagation()" style="max-width:360px;">
        <h3 style="margin-bottom:6px;">🔑 লগইন</h3>
        <p style="font-size:.83rem;color:var(--muted);margin-bottom:16px;">সদস্য লগইন বা অ্যাডমিন লগইন</p>
        <div style="display:flex;gap:0;border:1px solid var(--line);border-radius:6px;margin-bottom:18px;overflow:hidden;">
          <button id="tabUser"  onclick="switchLoginTab('user')"  style="flex:1;padding:9px;border:none;background:var(--ink);color:#fff;cursor:pointer;font-family:'Hind Siliguri',sans-serif;font-size:.88rem;">সদস্য লগইন</button>
          <button id="tabAdmin" onclick="switchLoginTab('admin')" style="flex:1;padding:9px;border:none;background:var(--card);color:var(--muted);cursor:pointer;font-family:'Hind Siliguri',sans-serif;font-size:.88rem;">অ্যাডমিন</button>
        </div>

        <div id="userLoginPane">
          <label>ফোন নম্বর</label>
          <input id="ulPhone" type="tel" placeholder="01XXXXXXXXX" />
          <label>পাসওয়ার্ড</label>
          <input id="ulPass" type="password" placeholder="••••••" onkeydown="if(event.key==='Enter')submitUserLogin()" />
          <button class="btn brass" style="margin-top:18px;width:100%;" onclick="submitUserLogin()">লগইন করুন</button>
        </div>

        <div id="adminLoginPane" style="display:none;">
          <label>ইউজারনেম</label>
          <input id="adminUser" type="text" placeholder="admin" autocomplete="username" />
          <label>পাসওয়ার্ড</label>
          <input id="adminPass" type="password" placeholder="••••••" onkeydown="if(event.key==='Enter')submitAdminLogin()" />
          <button class="btn brass" style="margin-top:18px;width:100%;" onclick="submitAdminLogin()">অ্যাডমিন লগইন</button>
        </div>
        <button class="btn outline" style="margin-top:10px;width:100%;" onclick="closeLoginModal()">বাতিল</button>
      </div>
    </div>`;
  setTimeout(() => document.getElementById('ulPhone')?.focus(), 80);
}

function switchLoginTab(tab) {
  const isUser = tab === 'user';
  document.getElementById('userLoginPane').style.display  = isUser ? 'block' : 'none';
  document.getElementById('adminLoginPane').style.display = isUser ? 'none'  : 'block';
  document.getElementById('tabUser').style.background  = isUser ? 'var(--ink)'  : 'var(--card)';
  document.getElementById('tabUser').style.color       = isUser ? '#fff'         : 'var(--muted)';
  document.getElementById('tabAdmin').style.background = isUser ? 'var(--card)' : 'var(--ink)';
  document.getElementById('tabAdmin').style.color      = isUser ? 'var(--muted)': '#fff';
}

function closeLoginModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('adminModalRoot').innerHTML = '';
}

async function submitUserLogin() {
  const phone    = document.getElementById('ulPhone').value.trim();
  const password = document.getElementById('ulPass').value;
  if (!phone || !password) { Toast.warning('ফোন নম্বর ও পাসওয়ার্ড দিন'); return; }
  Toast.loading('লগইন হচ্ছে...');
  const res = await Api.post('userLogin', { phone, password });
  if (res.error) { Toast.error(res.error); return; }
  setUser(res.user);
  Toast.success('স্বাগতম, ' + res.user.name + '!');
  document.getElementById('adminModalRoot').innerHTML = '';
  // nav পুনরায় রেন্ডার করতে হবে (finance দেখানোর জন্য)
  if (typeof renderNav === 'function') {
    const active = document.querySelector('.nav-link.active')?.getAttribute('href') || 'index.html';
    renderNav(active);
  }
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}

// পুরনো openAdminLogin ফাংশন — এখন loginModal এর admin tab হিসেবে কাজ করবে
function openAdminLogin() { openLoginModal(); switchLoginTab('admin'); }

// ============================================================
//  UNIFIED LOGIN MODAL (Admin + User দুই ট্যাব)
// ============================================================
function openLoginModal() {
  document.getElementById('adminModalRoot').innerHTML = `
    <div class="modal-backdrop" onclick="closeLoginModal(event)">
      <div class="modal" style="max-width:380px;" onclick="event.stopPropagation()">
        <h3 style="margin-bottom:14px;">🔑 লগইন</h3>

        <!-- ট্যাব -->
        <div style="display:flex;border-bottom:2px solid var(--line);margin-bottom:18px;">
          <button id="tabUser"  onclick="switchLoginTab('user')"
            style="flex:1;padding:8px;border:none;background:none;cursor:pointer;
            font-family:'Hind Siliguri',sans-serif;font-size:.9rem;color:var(--muted);
            border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;">
            👤 ব্যবহারকারী</button>
          <button id="tabAdmin" onclick="switchLoginTab('admin')"
            style="flex:1;padding:8px;border:none;background:none;cursor:pointer;
            font-family:'Hind Siliguri',sans-serif;font-size:.9rem;color:var(--muted);
            border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;">
            ⚙️ অ্যাডমিন</button>
        </div>

        <!-- User Tab -->
        <div id="loginPaneUser">
          <label>ফোন নম্বর</label>
          <input id="uLoginPhone" type="tel" placeholder="01XXXXXXXXX" />
          <label>পাসওয়ার্ড</label>
          <input id="uLoginPass" type="password" placeholder="••••••"
            onkeydown="if(event.key==='Enter') submitUserLogin()" />
          <button class="btn brass" style="width:100%;margin-top:18px;" onclick="submitUserLogin()">লগইন করুন</button>
        </div>

        <!-- Admin Tab -->
        <div id="loginPaneAdmin" style="display:none;">
          <label>ইউজারনেম</label>
          <input id="adminUser" type="text" placeholder="admin" autocomplete="username" />
          <label>পাসওয়ার্ড</label>
          <input id="adminPass" type="password" placeholder="••••••" autocomplete="current-password"
            onkeydown="if(event.key==='Enter') submitAdminLogin()" />
          <button class="btn brass" style="width:100%;margin-top:18px;" onclick="submitAdminLogin()">লগইন করুন</button>
        </div>

        <button class="btn outline" style="width:100%;margin-top:10px;" onclick="closeLoginModal()">বাতিল</button>
      </div>
    </div>`;
  switchLoginTab('user');
  setTimeout(() => document.getElementById('uLoginPhone')?.focus(), 80);
}

function switchLoginTab(tab) {
  const isUser = tab === 'user';
  document.getElementById('loginPaneUser').style.display  = isUser ? 'block' : 'none';
  document.getElementById('loginPaneAdmin').style.display = isUser ? 'none'  : 'block';
  const tU = document.getElementById('tabUser');
  const tA = document.getElementById('tabAdmin');
  if (tU && tA) {
    tU.style.color = isUser ? 'var(--brass-dark)' : 'var(--muted)';
    tU.style.borderBottomColor = isUser ? 'var(--brass)' : 'transparent';
    tU.style.fontWeight = isUser ? '600' : 'normal';
    tA.style.color = !isUser ? 'var(--brass-dark)' : 'var(--muted)';
    tA.style.borderBottomColor = !isUser ? 'var(--brass)' : 'transparent';
    tA.style.fontWeight = !isUser ? '600' : 'normal';
  }
  setTimeout(() => {
    const el = isUser ? document.getElementById('uLoginPhone') : document.getElementById('adminUser');
    el?.focus();
  }, 60);
}

function closeLoginModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('adminModalRoot').innerHTML = '';
}

async function submitUserLogin() {
  const phone    = document.getElementById('uLoginPhone')?.value.trim();
  const password = document.getElementById('uLoginPass')?.value;
  if (!phone || !password) { Toast.warning('ফোন নম্বর ও পাসওয়ার্ড দিন'); return; }
  Toast.loading('লগইন হচ্ছে...');
  const res = await Api.post('userLogin', { phone, password });
  if (res.error) { Toast.error(res.error); return; }
  setUser(res.user);
  closeLoginModal();
  Toast.success('স্বাগতম, ' + res.user.name + '! (' + res.user.role + ')');
  // nav পুনরায় রেন্ডার (finance দেখানোর জন্য)
  const active = document.querySelector('.nav-link.active')?.getAttribute('href') || 'index.html';
  renderNav(active);
  renderAdminSlot();
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}

async function submitAdminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  if (!username || !password) { Toast.warning('ইউজারনেম ও পাসওয়ার্ড দিন'); return; }
  Toast.loading('লগইন হচ্ছে...');
  const res = await Api.post('adminLogin', { username, password });
  if (res.error) { Toast.error(res.error); return; }
  Toast.success('অ্যাডমিন লগইন সফল হয়েছে।');
  closeLoginModal();
  setAdmin(true);
  const active = document.querySelector('.nav-link.active')?.getAttribute('href') || 'index.html';
  renderNav(active);
  renderAdminSlot();
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}
function doAdminLogout() {
  setAdmin(false);
  renderAdminSlot();
  Toast.warning('লগআউট হয়েছে।');
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}

// ============================================================
//  PRINT / PDF UTILITY
//  Usage: PrintUtil.print(title, tableHtml, extraInfoHtml)
// ============================================================
const PrintUtil = {
  print(title, contentHtml, meta = '') {
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html>
<html lang="bn"><head>
<meta charset="UTF-8"/>
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Hind Siliguri',sans-serif;color:#1C2B39;font-size:13px;padding:24px 30px;}
  .print-header{text-align:center;border-bottom:3px solid #A9793C;padding-bottom:14px;margin-bottom:18px;}
  .print-header h1{font-size:1.3rem;font-weight:700;color:#1C2B39;}
  .print-header p{color:#6B6759;font-size:.82rem;margin-top:4px;}
  .meta{display:flex;justify-content:space-between;font-size:.78rem;color:#6B6759;margin-bottom:14px;flex-wrap:wrap;gap:6px;}
  table{width:100%;border-collapse:collapse;font-size:.82rem;}
  th{background:#1C2B39;color:#F3EEE2;padding:8px 10px;text-align:left;font-weight:600;}
  td{padding:7px 10px;border-bottom:1px solid #D8D0BC;}
  tr:nth-child(even) td{background:#F9F6EF;}
  .print-footer{margin-top:20px;text-align:center;font-size:.75rem;color:#9A9186;border-top:1px solid #D8D0BC;padding-top:10px;}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:.72rem;font-weight:600;}
  .badge-ok{background:#e8f5e9;color:#4a6e4c;}
  .badge-warn{background:rgba(154,59,59,.1);color:#9A3B3B;}
  .badge-brass{background:rgba(169,121,60,.15);color:#8A6230;}
  @media print{body{padding:0 10px;}@page{margin:15mm;}}
</style>
</head><body>
<div class="print-header">
  <h1>শহীদ আইয়ুব আলী স্মৃতি সংঘ ও পাঠাগার</h1>
  <p>কুলানন্দপুর, বলগাড়ী, ঘোড়াঘাট, দিনাজপুর · নিবন্ধন নং: ১৬৯৩/০২</p>
</div>
<div class="meta">
  <span><strong>${title}</strong></span>
  <span>মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD',{day:'numeric',month:'long',year:'numeric'})}</span>
  ${meta}
</div>
${contentHtml}
<div class="print-footer">এই তালিকা শহীদ আইয়ুব আলী স্মৃতি সংঘ ও পাঠাগার ওয়েবসাইট থেকে মুদ্রিত।</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`);
    win.document.close();
  },
};

// ============================================================
//  SOCIAL SHARE UTILITY
//  Usage: ShareUtil.show(title, text, url)
// ============================================================
const ShareUtil = {
  show(title, text, url) {
    url = url || window.location.href;
    const encoded  = encodeURIComponent(url);
    const encText  = encodeURIComponent(text || title);
    const encTitle = encodeURIComponent(title);

    // Native share API (mobile)
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
      return;
    }

    // Fallback modal
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position:fixed;inset:0;background:rgba(28,43,57,.55);
      z-index:8500;display:flex;align-items:center;justify-content:center;
      padding:20px;backdrop-filter:blur(4px);
      animation:_tin .2s ease;
    `;
    backdrop.innerHTML = `
      <div style="background:#FFFDF7;border-radius:14px;padding:26px 24px;max-width:360px;width:100%;
        box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:'Hind Siliguri',sans-serif;">
        <div style="font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:#1C2B39;margin-bottom:6px;">শেয়ার করুন</div>
        <div style="font-size:.85rem;color:#6B6759;margin-bottom:20px;line-height:1.6;">${title}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">

          <a href="https://www.facebook.com/sharer/sharer.php?u=${encoded}" target="_blank"
            style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;
            background:#1877F2;color:#fff;text-decoration:none;font-size:.88rem;font-weight:600;">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
            Facebook</a>

          <a href="https://wa.me/?text=${encText}%20${encoded}" target="_blank"
            style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;
            background:#25D366;color:#fff;text-decoration:none;font-size:.88rem;font-weight:600;">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.41-1.5-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.59-.49-.51-.68-.52-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.62.72.23 1.37.2 1.89.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/><path d="M12 0C5.37 0 0 5.37 0 12c0 2.12.56 4.1 1.52 5.83L0 24l6.35-1.48A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0zm0 21.9a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.76.88.92-3.67-.24-.38A9.86 9.86 0 0 1 2.1 12C2.1 6.52 6.52 2.1 12 2.1S21.9 6.52 21.9 12 17.48 21.9 12 21.9z"/></svg>
            WhatsApp</a>

          <a href="https://twitter.com/intent/tweet?text=${encText}&url=${encoded}" target="_blank"
            style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;
            background:#000;color:#fff;text-decoration:none;font-size:.88rem;font-weight:600;">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X (Twitter)</a>

          <button onclick="navigator.clipboard.writeText('${url}').then(()=>Toast.success('লিংক কপি হয়েছে!'))"
            style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;
            background:#F3EEE2;border:1px solid #D8D0BC;color:#1C2B39;cursor:pointer;font-size:.88rem;font-weight:600;font-family:'Hind Siliguri',sans-serif;">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            লিংক কপি</button>
        </div>
        <button onclick="this.closest('[style*=fixed]').remove()"
          style="width:100%;padding:10px;border-radius:8px;border:1px solid #D8D0BC;
          background:transparent;color:#6B6759;cursor:pointer;font-family:'Hind Siliguri',sans-serif;font-size:.88rem;">
          বাতিল</button>
      </div>`;

    backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
    document.body.appendChild(backdrop);
  },
};
