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
    // preflight এড়াতে text/plain ব্যবহার করা হচ্ছে, Apps Script এটা JSON হিসেবে পার্স করবে
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
    });
    return res.json();
  },
};

// ---------- অ্যাডমিন সেশন ----------
function isAdmin() {
  return sessionStorage.getItem('isAdmin') === 'yes';
}
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
  wrap.innerHTML = `
    <button class="btn outline" id="refreshBtn" onclick="handleRefresh()" title="ডেটা আবার লোড করুন">
      ↻ রিফ্রেশ
    </button>
  `;
  window._pageRefreshFn = onRefresh;
}
async function handleRefresh() {
  const btn = document.getElementById('refreshBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = '↻ লোড হচ্ছে...';
  try {
    if (typeof window._pageRefreshFn === 'function') await window._pageRefreshFn();
  } finally {
    btn.disabled = false;
    btn.textContent = '↻ রিফ্রেশ';
  }
}

// ---------- শেয়ার্ড নেভিগেশন + অ্যাডমিন বার ----------
function renderNav(active) {
  const items = [
    ['index.html', 'হোম'],
    ['books.html', 'বই তালিকা'],
    ['booking.html', 'বই বুকিং'],
    ['members.html', 'সদস্য তালিকা'],
    ['committee.html', 'কমিটি'],
    ['register.html', 'নতুন সদস্য হোন'],
    ['notices.html', 'নোটিশ'],
    ['projects.html', 'প্রকল্প'],
    ['donations.html', 'অনুদান'],
    ['finance.html', 'আয়-ব্যয়'],
  ];
  const links = items.map(([href, label]) =>
    `<a class="link ${active === href ? 'active' : ''}" href="${href}">${label}</a>`
  ).join('');

  document.getElementById('navRoot').innerHTML = `
    <nav class="nav">
      <a href="index.html" class="brand"><span class="tab"></span>শহীদ আইয়ুব আলী স্মৃতি সংঘ ও পাঠাগার</a>
      <div class="links">
        ${links}
        <span id="adminSlot"></span>
      </div>
    </nav>
  `;
  renderAdminSlot();
}

function renderAdminSlot() {
  const slot = document.getElementById('adminSlot');
  if (!slot) return;
  if (isAdmin()) {
    slot.innerHTML = `<a class="link admin-tag" href="#" onclick="doAdminLogout(); return false;">অ্যাডমিন ● লগআউট</a>`;
  } else {
    slot.innerHTML = `<a class="link" href="#" onclick="openAdminLogin(); return false;">অ্যাডমিন লগইন</a>`;
  }
}

function openAdminLogin() {
  document.getElementById('adminModalRoot').innerHTML = `
    <div class="modal-backdrop" onclick="closeAdminLogin(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <h3>অ্যাডমিন লগইন</h3>
        <label>ইউজারনেম</label>
        <input id="adminUser" type="text" />
        <label>পাসওয়ার্ড</label>
        <input id="adminPass" type="password" />
        <button class="btn brass" style="margin-top:18px;" onclick="submitAdminLogin()">লগইন</button>
        <button class="btn outline" style="margin-top:18px;" onclick="closeAdminLogin()">বাতিল</button>
        <div id="adminLoginMsg"></div>
      </div>
    </div>
  `;
}
function closeAdminLogin(e) {
  document.getElementById('adminModalRoot').innerHTML = '';
}
async function submitAdminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  const res = await Api.post('adminLogin', { username, password });
  const msg = document.getElementById('adminLoginMsg');
  if (res.error) {
    msg.innerHTML = `<div class="msg error">${res.error}</div>`;
    return;
  }
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
