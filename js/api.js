// ব্যাকএন্ডের সাথে যোগাযোগের হেল্পার
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

// ---------- Toast popup system ----------
(function () {
  // toast wrapper তৈরি (একবারই)
  function getWrap() {
    let w = document.getElementById('_toastWrap');
    if (!w) {
      w = document.createElement('div');
      w.id = '_toastWrap';
      w.className = 'toast-wrap';
      document.body.appendChild(w);
    }
    return w;
  }

  let _loadingToast = null;

  window.Toast = {
    loading(msg = 'তথ্য জমা হচ্ছে... অপেক্ষা করুন।') {
      this.clearLoading();
      const el = document.createElement('div');
      el.className = 'toast loading';
      el.innerHTML = `<span class="toast-icon"></span><span>${msg}</span>`;
      getWrap().appendChild(el);
      _loadingToast = el;
      return el;
    },

    success(msg = 'সফলভাবে সংরক্ষিত হয়েছে ✓') {
      this.clearLoading();
      const el = document.createElement('div');
      el.className = 'toast ok';
      el.textContent = msg;
      getWrap().appendChild(el);
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 450);
      }, 2800);
    },

    error(msg = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।') {
      this.clearLoading();
      const el = document.createElement('div');
      el.className = 'toast err';
      el.textContent = msg;
      getWrap().appendChild(el);
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 450);
      }, 3500);
    },

    clearLoading() {
      if (_loadingToast) {
        _loadingToast.classList.add('out');
        setTimeout(() => _loadingToast && _loadingToast.remove(), 450);
        _loadingToast = null;
      }
    },
  };
})();

// ═══════════════════════════════════════
// TOAST — পপ আপ বার্তা
// ব্যবহার:
//   const id = Toast.loading('তথ্য জমা হচ্ছে...');
//   Toast.ok('সফলভাবে সংরক্ষিত হয়েছে ✓', id);
//   Toast.err('কোনো সমস্যা হয়েছে', id);
// ═══════════════════════════════════════
const Toast = (() => {
  let wrap;

  function getWrap() {
    if (!wrap || !document.body.contains(wrap)) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    return wrap;
  }

  function make(type, text) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    if (type === 'loading') {
      el.innerHTML = `<span class="toast-icon"></span><span>${text}</span>`;
    } else {
      el.textContent = text;
    }
    getWrap().appendChild(el);
    return el;
  }

  function dismiss(el, delay = 2800) {
    if (!el || !el.parentNode) return;
    setTimeout(() => {
      el.classList.add('out');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, delay);
  }

  return {
    loading(text = 'তথ্য জমা হচ্ছে, অপেক্ষা করুন...') {
      return make('loading', text);
    },
    ok(text = 'সফলভাবে সংরক্ষিত হয়েছে!', loadingEl) {
      if (loadingEl) loadingEl.remove();
      const el = make('ok', text);
      dismiss(el, 2500);
      return el;
    },
    err(text = 'কোনো সমস্যা হয়েছে।', loadingEl) {
      if (loadingEl) loadingEl.remove();
      const el = make('err', text);
      dismiss(el, 3500);
      return el;
    },
  };
})();

// ---------- Global Ripple on all .btn clicks ----------
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn');
  if (!btn || btn.disabled) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
});
function isAdmin() { return sessionStorage.getItem('isAdmin') === 'yes'; }
function setAdmin(on) {
  if (on) sessionStorage.setItem('isAdmin', 'yes');
  else sessionStorage.removeItem('isAdmin');
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

// ---------- রিফ্রেশ বাটন ----------
function renderRefreshBtn(onRefresh) {
  const wrap = document.getElementById('refreshBtnRoot');
  if (!wrap) return;
  wrap.innerHTML = `<button class="btn small outline" id="refreshBtn" onclick="handleRefresh()" title="ডেটা আবার লোড করুন">↻ রিফ্রেশ</button>`;
  window._pageRefreshFn = onRefresh;
}
async function handleRefresh() {
  const btn = document.getElementById('refreshBtn');
  if (!btn) return;
  btn.disabled = true; btn.textContent = '↻ লোড হচ্ছে...';
  try { if (typeof window._pageRefreshFn === 'function') await window._pageRefreshFn(); }
  finally { btn.disabled = false; btn.textContent = '↻ রিফ্রেশ'; }
}

// ---------- নেভিগেশন (হ্যামবার্গার মেনু) ----------
function renderNav(active) {
  const items = [
    ['index.html',    'হোম'],
    ['books.html',    'বই তালিকা'],
    ['booking.html',  'বই বুকিং'],
    ['members.html',  'সদস্য তালিকা'],
    ['committee.html','কমিটি'],
    ['register.html', 'নতুন সদস্য হোন'],
    ['notices.html',  'নোটিশ'],
    ['projects.html', 'প্রকল্প'],
    ['donations.html','অনুদান'],
    ['finance.html',  'আয়-ব্যয়'],
  ];

  const links = items.map(([href, label]) =>
    `<a class="nav-link ${active === href ? 'active' : ''}" href="${href}" onclick="closeMenu()">${label}</a>`
  ).join('');

  document.getElementById('navRoot').innerHTML = `
    <nav class="nav">
      <a href="index.html" class="brand"><span class="tab"></span>শহীদ আইয়ুব আলী স্মৃতি সংঘ ও পাঠাগার</a>

      <!-- ডেস্কটপ লিংক -->
      <div class="nav-desktop">
        ${links}
        <span id="adminSlot"></span>
      </div>

      <!-- মোবাইল হ্যামবার্গার বাটন -->
      <button class="hamburger" id="hamburgerBtn" onclick="toggleMenu()" aria-label="মেনু">
        <span></span><span></span><span></span>
      </button>
    </nav>

    <!-- মোবাইল ড্রয়ার -->
    <div class="nav-drawer" id="navDrawer">
      <div class="nav-drawer-inner">
        ${links}
        <span id="adminSlotMobile"></span>
      </div>
    </div>
    <!-- ওভারলে -->
    <div class="nav-overlay" id="navOverlay" onclick="closeMenu()"></div>
  `;

  renderAdminSlot();
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
  const html = isAdmin()
    ? `<a class="nav-link admin-tag" href="#" onclick="doAdminLogout(); return false;">অ্যাডমিন ● লগআউট</a>`
    : `<a class="nav-link" href="#" onclick="openAdminLogin(); return false;">অ্যাডমিন লগইন</a>`;
  const s1 = document.getElementById('adminSlot');
  const s2 = document.getElementById('adminSlotMobile');
  if (s1) s1.innerHTML = html;
  if (s2) s2.innerHTML = html.replace('openAdminLogin()', 'openAdminLogin(); closeMenu();')
                              .replace('doAdminLogout()', 'doAdminLogout(); closeMenu();');
}

function openAdminLogin() {
  document.getElementById('adminModalRoot').innerHTML = `
    <div class="modal-backdrop" onclick="closeAdminLogin(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <h3>অ্যাডমিন লগইন</h3>
        <label>ইউজারনেম</label>
        <input id="adminUser" type="text" />
        <label>পাসওয়ার্ড</label>
        <input id="adminPass" type="password" onkeydown="if(event.key==='Enter') submitAdminLogin()" />
        <button class="btn brass" style="margin-top:18px;" onclick="submitAdminLogin()">লগইন</button>
        <button class="btn outline" style="margin-top:18px;" onclick="closeAdminLogin()">বাতিল</button>
        <div id="adminLoginMsg"></div>
      </div>
    </div>`;
}
function closeAdminLogin() { document.getElementById('adminModalRoot').innerHTML = ''; }
async function submitAdminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  const res = await Api.post('adminLogin', { username, password });
  const msg = document.getElementById('adminLoginMsg');
  if (res.error) { msg.innerHTML = `<div class="msg error">${res.error}</div>`; return; }
  setAdmin(true);
  closeAdminLogin();
  renderAdminSlot();
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}
function doAdminLogout() {
  setAdmin(false);
  renderAdminSlot();
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}
