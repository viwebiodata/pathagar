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

// ═══════════════════════════════════════
//  TOAST — স্ক্রিনের নিচে পপআপ বার্তা
// ═══════════════════════════════════════
(function () {
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
    },
    success(msg = 'সফলভাবে সংরক্ষিত হয়েছে!') {
      this.clearLoading();
      const el = document.createElement('div');
      el.className = 'toast ok';
      el.innerHTML = `<span class="t-icon">✓</span><span>${msg}</span>`;
      getWrap().appendChild(el);
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3000);
    },
    error(msg = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।') {
      this.clearLoading();
      const el = document.createElement('div');
      el.className = 'toast err';
      el.innerHTML = `<span class="t-icon">✕</span><span>${msg}</span>`;
      getWrap().appendChild(el);
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 4000);
    },
    info(msg) {
      this.clearLoading();
      const el = document.createElement('div');
      el.className = 'toast info';
      el.innerHTML = `<span class="t-icon">ℹ</span><span>${msg}</span>`;
      getWrap().appendChild(el);
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3500);
    },
    clearLoading() {
      if (_loadingToast) {
        _loadingToast.classList.add('out');
        const t = _loadingToast;
        setTimeout(() => t.remove(), 450);
        _loadingToast = null;
      }
    },
  };
})();

// ═══════════════════════════════════════
//  CONFIRM — কাস্টম confirm() পপআপ
//  ব্যবহার: const ok = await Confirm.show('বইটি মুছবেন?')
// ═══════════════════════════════════════
window.Confirm = {
  show(msg, { title = 'নিশ্চিত করুন', okLabel = 'হ্যাঁ, করুন', cancelLabel = 'বাতিল', danger = true } = {}) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="confirm-modal">
          <div class="confirm-icon ${danger ? 'danger' : 'info'}">${danger ? '⚠️' : 'ℹ️'}</div>
          <h3 class="confirm-title">${title}</h3>
          <p class="confirm-msg">${msg}</p>
          <div class="confirm-actions">
            <button class="btn outline confirm-cancel">${cancelLabel}</button>
            <button class="btn ${danger ? 'btn-danger' : 'brass'} confirm-ok">${okLabel}</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);

      backdrop.querySelector('.confirm-ok').onclick = () => {
        backdrop.classList.add('fade-out');
        setTimeout(() => backdrop.remove(), 300);
        resolve(true);
      };
      backdrop.querySelector('.confirm-cancel').onclick = () => {
        backdrop.classList.add('fade-out');
        setTimeout(() => backdrop.remove(), 300);
        resolve(false);
      };
      backdrop.onclick = (e) => {
        if (e.target === backdrop) {
          backdrop.classList.add('fade-out');
          setTimeout(() => backdrop.remove(), 300);
          resolve(false);
        }
      };
    });
  },
};

// ═══════════════════════════════════════
//  Ripple effect — সব .btn এ
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
//  অ্যাডমিন সেশন
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
//  রিফ্রেশ বাটন
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
//  নেভিগেশন
// ═══════════════════════════════════════
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
      <div class="nav-desktop">${links}<span id="adminSlot"></span></div>
      <button class="hamburger" id="hamburgerBtn" onclick="toggleMenu()" aria-label="মেনু">
        <span></span><span></span><span></span>
      </button>
    </nav>
    <div class="nav-drawer" id="navDrawer">
      <div class="nav-drawer-inner">${links}<span id="adminSlotMobile"></span></div>
    </div>
    <div class="nav-overlay" id="navOverlay" onclick="closeMenu()"></div>`;

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
    ? `<a class="nav-link admin-tag" href="#" onclick="doAdminLogout();return false;">অ্যাডমিন ● লগআউট</a>`
    : `<a class="nav-link" href="#" onclick="openAdminLogin();return false;">অ্যাডমিন লগইন</a>`;
  const s1 = document.getElementById('adminSlot');
  const s2 = document.getElementById('adminSlotMobile');
  if (s1) s1.innerHTML = html;
  if (s2) s2.innerHTML = html
    .replace('openAdminLogin()', 'openAdminLogin();closeMenu();')
    .replace('doAdminLogout()', 'doAdminLogout();closeMenu();');
}

function openAdminLogin() {
  document.getElementById('adminModalRoot').innerHTML = `
    <div class="modal-backdrop" onclick="closeAdminLogin(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <h3 style="margin-bottom:18px;">🔐 অ্যাডমিন লগইন</h3>
        <label>ইউজারনেম</label>
        <input id="adminUser" type="text" autofocus />
        <label>পাসওয়ার্ড</label>
        <input id="adminPass" type="password" onkeydown="if(event.key==='Enter') submitAdminLogin()" />
        <div style="display:flex; gap:10px; margin-top:22px;">
          <button class="btn outline" style="flex:1;" onclick="closeAdminLogin()">বাতিল</button>
          <button class="btn brass" style="flex:1;" onclick="submitAdminLogin()">লগইন করুন</button>
        </div>
      </div>
    </div>`;
}
function closeAdminLogin(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('adminModalRoot').innerHTML = '';
}
async function submitAdminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  if (!username || !password) { Toast.error('ইউজারনেম ও পাসওয়ার্ড দিন'); return; }
  Toast.loading('যাচাই করা হচ্ছে...');
  const res = await Api.post('adminLogin', { username, password });
  if (res.error) { Toast.error(res.error); return; }
  Toast.success('স্বাগতম! অ্যাডমিন হিসেবে লগইন হয়েছেন।');
  setAdmin(true);
  document.getElementById('adminModalRoot').innerHTML = '';
  renderAdminSlot();
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}
function doAdminLogout() {
  setAdmin(false);
  renderAdminSlot();
  Toast.info('লগআউট সম্পন্ন হয়েছে।');
  if (typeof onAdminStateChange === 'function') onAdminStateChange();
}
