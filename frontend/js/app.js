const S = { user: JSON.parse(localStorage.user || 'null') };
const ALL = ['ADMIN', 'DOCTOR', 'PATIENT'], AD = ['ADMIN', 'DOCTOR'], A = ['ADMIN'];
const HOME = { ADMIN: 'dashboard', DOCTOR: 'dashboard', PATIENT: 'appointments' };
const G = ['Female', 'Male', 'Other'], BG = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// One config object per page. `hide` lists roles that should not see a form field.
const RES = {
  patients: { title: 'Patients', one: 'patient', read: AD, add: A, manage: A,
    cols: [['NAME', 'Name'], ['AGE', 'Age'], ['GENDER', 'Gender'], ['PHONE', 'Phone'], ['BLOOD_GROUP', 'Blood group'], ['EMAIL', 'Email']],
    fields: [['NAME', 'Full name', 'text'], ['AGE', 'Age', 'number'], ['GENDER', 'Gender', G], ['PHONE', 'Phone', 'text'], ['BLOOD_GROUP', 'Blood group', BG], ['EMAIL', 'Email', 'email']] },
  doctors: { title: 'Doctors', one: 'doctor', read: ALL, add: A, manage: A,
    cols: [['NAME', 'Name'], ['SPECIALTY', 'Specialty'], ['PHONE', 'Phone'], ['FEE', 'Fee'], ['AVAILABLE', 'Availability']],
    fields: [['NAME', 'Full name', 'text'], ['SPECIALTY', 'Specialty', 'text'], ['PHONE', 'Phone', 'text'], ['EMAIL', 'Email', 'email'], ['FEE', 'Consultation fee', 'number'], ['AVAILABLE', 'Availability', [['true', 'Available'], ['false', 'On leave']]]] },
  appointments: { title: 'Appointments', one: 'appointment', read: ALL, add: ALL, manage: AD,
    cols: [['PATIENT', 'Patient'], ['DOCTOR', 'Doctor'], ['APPT_DATE', 'Date'], ['APPT_TIME', 'Time'], ['REASON', 'Reason'], ['STATUS', 'Status']],
    fields: [['PATIENT_ID', 'Patient', 'ref:patients', ['PATIENT']], ['DOCTOR_ID', 'Doctor', 'ref:doctors'], ['APPT_DATE', 'Date', 'date'], ['APPT_TIME', 'Time', 'time'], ['REASON', 'Reason', 'text'], ['STATUS', 'Status', ['Scheduled', 'Completed', 'Cancelled'], ['PATIENT']]] },
  bills: { title: 'Billing', one: 'bill', read: ['ADMIN', 'PATIENT'], add: A, manage: A,
    cols: [['PATIENT', 'Patient'], ['DESCRIPTION', 'Description'], ['AMOUNT', 'Amount'], ['STATUS', 'Status'], ['ISSUED_ON', 'Issued']],
    fields: [['PATIENT_ID', 'Patient', 'ref:patients'], ['DESCRIPTION', 'Description', 'text'], ['AMOUNT', 'Amount', 'number'], ['STATUS', 'Status', ['Pending', 'Paid', 'Overdue']], ['ISSUED_ON', 'Issue date', 'date']] },
  records: { title: 'Medical records', one: 'record', read: ALL, add: AD, manage: AD,
    cols: [['PATIENT', 'Patient'], ['DOCTOR', 'Doctor'], ['DIAGNOSIS', 'Diagnosis'], ['TREATMENT', 'Treatment'], ['RECORDED_ON', 'Recorded']],
    fields: [['PATIENT_ID', 'Patient', 'ref:patients'], ['DOCTOR_ID', 'Doctor', 'ref:doctors', ['DOCTOR']], ['DIAGNOSIS', 'Diagnosis', 'text'], ['TREATMENT', 'Treatment', 'text'], ['RECORDED_ON', 'Date', 'date'], ['NOTES', 'Notes', 'textarea']] },
};
const NAV = [['dashboard', 'Dashboard', AD], ...Object.entries(RES).map(([k, c]) => [k, c.title, c.read])];
const head = (t, extra = '') => `<div class="head"><h2>${esc(t)}</h2>${extra}</div>`;
const root = $('#app');

// ---------- Auth screen ----------
function authView(mode = 'login') {
  const reg = mode === 'register';
  root.innerHTML = `<div class="auth"><section class="hero"><div class="brand"><span class="mark"></span>Glacier HMS</div>
    <div><h1>Patient care, backed by Snowflake.</h1><p>Appointments, billing and medical records in one place, with analytics that read straight from your data cloud.</p></div>
    <p class="hint" style="color:#8fd0e6">Demo: admin@hms.demo, doctor@hms.demo or patient@hms.demo · Password123!</p></section>
    <form id="f"><div class="tabs"><button type="button" data-m="login" class="${reg ? '' : 'on'}">Sign in</button><button type="button" data-m="register" class="${reg ? 'on' : ''}">Create patient account</button></div>
    ${reg ? '<label>Full name<input name="name" required></label><div class="modal"><div class="grid"><label>Age<input name="age" type="number" min="0"></label><label>Gender<select name="gender"><option value="">Select…</option>' + G.map(g => `<option>${g}</option>`).join('') + '</select></label></div></div>' : ''}
    <label>Email<input name="email" type="email" required autocomplete="email"></label>
    <label>Password<input name="password" type="password" required minlength="8" autocomplete="${reg ? 'new' : 'current'}-password"></label>
    <p class="formerr" role="alert"></p><button class="btn">${reg ? 'Create account' : 'Sign in'}</button></form></div>`;
  $('.tabs').onclick = e => e.target.dataset.m && authView(e.target.dataset.m);
  $('#f').onsubmit = async e => {
    e.preventDefault(); const b = $('#f .btn'), d = Object.fromEntries(new FormData(e.target));
    b.disabled = true; b.textContent = 'Please wait…';
    try {
      if (reg) await api('/auth/register', { method: 'POST', body: d });
      const r = await api('/auth/login', { method: 'POST', body: d });
      localStorage.token = r.token; localStorage.user = JSON.stringify(r.user); S.user = r.user; location.hash = ''; shell();
    } catch (err) { $('.formerr').textContent = err.message; b.disabled = false; b.textContent = reg ? 'Create account' : 'Sign in'; }
  };
}

// ---------- App shell + router ----------
function shell() {
  const role = S.user.role, items = NAV.filter(n => n[2].includes(role));
  root.innerHTML = `<div class="shell"><aside class="side" id="side"><div class="brand"><span class="mark"></span>Glacier HMS</div>
    <nav>${items.map(n => `<a href="#${n[0]}" data-k="${n[0]}">${esc(n[1])}</a>`).join('')}</nav>
    <div class="me"><span>Signed in as<br><b>${esc(S.user.email)}</b> (${role.toLowerCase()})</span><button class="btn sm" id="out">Sign out</button></div></aside>
    <div><div class="top"><button class="btn ghost sm" id="menu" aria-label="Open menu">Menu</button><b>Glacier HMS</b></div><main id="main"></main></div></div>`;
  $('#out').onclick = () => { localStorage.clear(); S.user = null; authView(); };
  $('#menu').onclick = () => $('#side').classList.toggle('open');
  route();
}
function route() {
  if (!S.user) return;
  const allowed = NAV.filter(n => n[2].includes(S.user.role)).map(n => n[0]);
  let k = location.hash.slice(1); if (!allowed.includes(k)) k = HOME[S.user.role];
  document.querySelectorAll('.side nav a').forEach(a => a.classList.toggle('on', a.dataset.k === k));
  $('#side')?.classList.remove('open');
  const main = $('#main'); k === 'dashboard' ? dashboard(main) : resourcePage(k, main);
}
addEventListener('hashchange', route);

// ---------- Generic list/CRUD page ----------
async function resourcePage(key, main) {
  const c = RES[key], role = S.user.role, canManage = c.manage.includes(role);
  main.innerHTML = head(c.title, c.add.includes(role) ? `<button class="btn" id="add">Add ${c.one}</button>` : '') +
    '<input class="search" placeholder="Search…" aria-label="Search"><div id="list"></div>';
  const list = $('#list'); let rows = [];
  const draw = (term = '') => {
    const shown = rows.filter(r => Object.values(r).join(' ').toLowerCase().includes(term.toLowerCase()));
    list.innerHTML = shown.length ? table(c.cols, shown, canManage && (r => `<button class="btn ghost sm" data-e="${r.ID}">Edit</button><button class="btn danger sm" data-d="${r.ID}">Delete</button>`))
      : empty(rows.length ? 'No matches' : `No ${c.title.toLowerCase()} yet`, rows.length ? 'Try a different search.' : c.add.includes(role) ? `Use “Add ${c.one}” to create the first one.` : 'Nothing has been recorded for you yet.');
  };
  const load = async () => { loading(list); try { rows = await api('/' + key); draw($('.search').value); } catch (e) { list.innerHTML = errorBox(e); } };
  async function form(row) {
    const defs = c.fields.filter(f => !(f[3] || []).includes(role));
    const fields = await Promise.all(defs.map(async ([k, l, t]) => {
      if (typeof t === 'string' && t.startsWith('ref:')) { const items = await api('/' + t.slice(4)); return { k, l, opts: items.map(i => [i.ID, i.NAME]) }; }
      return Array.isArray(t) ? { k, l, opts: t.map(o => (Array.isArray(o) ? o : [o, o])) } : { k, l, t };
    }));
    modal({ title: `${row ? 'Edit' : 'Add'} ${c.one}`, fields, values: row || {}, onSave: async body => {
      await api('/' + key + (row ? '/' + row.ID : ''), { method: row ? 'PUT' : 'POST', body });
      toast(row ? 'Changes saved' : `${c.one[0].toUpperCase() + c.one.slice(1)} added`); load();
    } });
  }
  $('#add')?.addEventListener('click', () => form().catch(e => toast(e.message, 'err')));
  $('.search').oninput = e => draw(e.target.value);
  list.onclick = async e => {
    const id = e.target.dataset.e || e.target.dataset.d; if (!id) return;
    const row = rows.find(r => String(r.ID) === id);
    try {
      if (e.target.dataset.e) await form(row);
      else if (confirm(`Delete this ${c.one}? This cannot be undone.`)) { await api('/' + key + '/' + id, { method: 'DELETE' }); toast('Deleted'); load(); }
    } catch (err) { toast(err.message, 'err'); }
  };
  load();
}

// ---------- Dashboard ----------
async function dashboard(main) {
  main.innerHTML = head('Dashboard') + '<div id="dash"></div>'; const d = $('#dash'); loading(d);
  try {
    const x = await api('/dashboard'), k = x.kpi, P = ['#11567F', '#29B5E8', '#71D3DC', '#C9384A'];
    d.innerHTML = `<div class="kpis">${[['Revenue collected', money(k.REVENUE)], ['Patients', k.PATIENTS], ['Doctors', k.DOCTORS], ['Appointments today', k.TODAY]]
      .map(([l, v]) => `<div class="card kpi"><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>
      <div class="charts"><section class="card wide"><h3>Paid revenue by month</h3><div class="cv"><canvas id="c1"></canvas></div></section>
      <section class="card"><h3>Appointments by status</h3><div class="cv"><canvas id="c2"></canvas></div></section>
      <section class="card"><h3>Appointments per doctor</h3><div class="cv"><canvas id="c3"></canvas></div></section></div>`;
    Chart.defaults.font.family = 'Manrope'; const o = { responsive: true, maintainAspectRatio: false };
    new Chart($('#c1'), { type: 'line', data: { labels: x.revenue.map(r => r.MONTH), datasets: [{ data: x.revenue.map(r => r.REVENUE), borderColor: '#29B5E8', backgroundColor: '#29B5E833', fill: true, tension: .35 }] }, options: { ...o, plugins: { legend: { display: false } } } });
    new Chart($('#c2'), { type: 'doughnut', data: { labels: x.status.map(r => r.STATUS), datasets: [{ data: x.status.map(r => r.TOTAL), backgroundColor: P }] }, options: o });
    new Chart($('#c3'), { type: 'bar', data: { labels: x.load.map(r => r.DOCTOR), datasets: [{ data: x.load.map(r => r.APPOINTMENTS), backgroundColor: '#11567F', borderRadius: 6 }] }, options: { ...o, plugins: { legend: { display: false } }, scales: { y: { ticks: { precision: 0 } } } } });
  } catch (e) { d.innerHTML = errorBox(e); }
}

S.user ? shell() : authView();
