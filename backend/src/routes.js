const r = require('express').Router();
const bcrypt = require('bcryptjs');
const { q } = require('./db');
const { sign, auth, role } = require('./auth');
const wrap = f => (req, res, next) => f(req, res).catch(next);
const ALL = ['ADMIN', 'DOCTOR', 'PATIENT'], AD = ['ADMIN', 'DOCTOR'], A = ['ADMIN'];

// ---- Authentication ----
r.post('/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const [u] = await q('SELECT * FROM USERS WHERE EMAIL=?', [String(email || '').toLowerCase()]);
  if (!u || !(await bcrypt.compare(String(password || ''), u.PASSWORD_HASH)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: sign(u), user: { email: u.EMAIL, role: u.ROLE } });
}));

r.post('/auth/register', wrap(async (req, res) => {
  const { name, email, password, age, gender } = req.body;
  if (!name || !email || String(password || '').length < 8)
    return res.status(400).json({ error: 'Enter your name, email and a password of 8+ characters.' });
  const mail = email.toLowerCase();
  if ((await q('SELECT 1 FROM USERS WHERE EMAIL=?', [mail])).length)
    return res.status(409).json({ error: 'That email is already registered. Sign in instead.' });
  await q('INSERT INTO PATIENTS (NAME,AGE,GENDER,EMAIL) VALUES (?,?,?,?)', [name, age || null, gender || null, mail]);
  const [p] = await q('SELECT ID FROM PATIENTS WHERE EMAIL=? ORDER BY ID DESC LIMIT 1', [mail]);
  await q('INSERT INTO USERS (EMAIL,PASSWORD_HASH,ROLE,REF_ID) VALUES (?,?,?,?)', [mail, await bcrypt.hash(password, 10), 'PATIENT', p.ID]);
  res.status(201).json({ ok: true });
}));

// ---- Generic CRUD factory: one call per resource ----
function crud(name, table, cols, { read, add, manage, sql, scope, before }) {
  const p = '/' + name;
  r.get(p, auth, role(...read), wrap(async (req, res) => {
    const [where = '', binds = []] = scope ? scope(req.user) : [];
    res.json(await q(`${sql} ${where} ORDER BY 1 DESC`, binds));
  }));
  r.post(p, auth, role(...add), wrap(async (req, res) => {
    const d = { ...req.body, ...(before ? before(req.user) : {}) };
    const c = cols.filter(k => d[k] !== undefined && d[k] !== '' && d[k] !== null);
    if (!c.length) return res.status(400).json({ error: 'Fill in the form before saving.' });
    await q(`INSERT INTO ${table} (${c.join(',')}) VALUES (${c.map(() => '?').join(',')})`, c.map(k => d[k]));
    res.status(201).json({ ok: true });
  }));
  r.put(p + '/:id', auth, role(...manage), wrap(async (req, res) => {
    const c = cols.filter(k => req.body[k] !== undefined);
    if (!c.length) return res.status(400).json({ error: 'Nothing to update.' });
    await q(`UPDATE ${table} SET ${c.map(k => k + '=?').join(',')} WHERE ID=?`,
      [...c.map(k => (req.body[k] === '' ? null : req.body[k])), req.params.id]);
    res.json({ ok: true });
  }));
  r.delete(p + '/:id', auth, role(...manage), wrap(async (req, res) => {
    await q(`DELETE FROM ${table} WHERE ID=?`, [req.params.id]);
    res.json({ ok: true });
  }));
}
// Patients only see their own rows; doctors only see rows assigned to them.
const own = a => u => u.role === 'PATIENT' ? [` AND ${a}.PATIENT_ID=?`, [u.ref]]
  : u.role === 'DOCTOR' ? [` AND ${a}.DOCTOR_ID=?`, [u.ref]] : [];

crud('patients', 'PATIENTS', ['NAME', 'AGE', 'GENDER', 'PHONE', 'BLOOD_GROUP', 'EMAIL'],
  { read: AD, add: A, manage: A, sql: 'SELECT * FROM PATIENTS WHERE 1=1' });
crud('doctors', 'DOCTORS', ['NAME', 'SPECIALTY', 'PHONE', 'EMAIL', 'FEE', 'AVAILABLE'],
  { read: ALL, add: A, manage: A, sql: 'SELECT * FROM DOCTORS WHERE 1=1' });
crud('appointments', 'APPOINTMENTS', ['PATIENT_ID', 'DOCTOR_ID', 'APPT_DATE', 'APPT_TIME', 'REASON', 'STATUS'], {
  read: ALL, add: ALL, manage: AD, scope: own('a'),
  before: u => (u.role === 'PATIENT' ? { PATIENT_ID: u.ref, STATUS: 'Scheduled' } : {}),
  sql: `SELECT a.ID, a.PATIENT_ID, a.DOCTOR_ID, p.NAME PATIENT, d.NAME DOCTOR, a.APPT_DATE, a.APPT_TIME, a.REASON, a.STATUS
        FROM APPOINTMENTS a JOIN PATIENTS p ON p.ID=a.PATIENT_ID JOIN DOCTORS d ON d.ID=a.DOCTOR_ID WHERE 1=1` });
crud('bills', 'BILLS', ['PATIENT_ID', 'DESCRIPTION', 'AMOUNT', 'STATUS', 'ISSUED_ON'], {
  read: ['ADMIN', 'PATIENT'], add: A, manage: A, scope: u => (u.role === 'PATIENT' ? [' AND b.PATIENT_ID=?', [u.ref]] : []),
  sql: 'SELECT b.ID, b.PATIENT_ID, p.NAME PATIENT, b.DESCRIPTION, b.AMOUNT, b.STATUS, b.ISSUED_ON FROM BILLS b JOIN PATIENTS p ON p.ID=b.PATIENT_ID WHERE 1=1' });
crud('records', 'RECORDS', ['PATIENT_ID', 'DOCTOR_ID', 'DIAGNOSIS', 'TREATMENT', 'NOTES', 'RECORDED_ON'], {
  read: ALL, add: AD, manage: AD, scope: own('m'), before: u => (u.role === 'DOCTOR' ? { DOCTOR_ID: u.ref } : {}),
  sql: `SELECT m.ID, m.PATIENT_ID, m.DOCTOR_ID, p.NAME PATIENT, d.NAME DOCTOR, m.DIAGNOSIS, m.TREATMENT, m.NOTES, m.RECORDED_ON
        FROM RECORDS m JOIN PATIENTS p ON p.ID=m.PATIENT_ID LEFT JOIN DOCTORS d ON d.ID=m.DOCTOR_ID WHERE 1=1` });

// ---- Dashboard analytics (Snowflake views) ----
r.get('/dashboard', auth, role(...AD), wrap(async (req, res) => {
  const [[kpi], revenue, status, load] = await Promise.all([
    q(`SELECT (SELECT COUNT(*) FROM PATIENTS) PATIENTS, (SELECT COUNT(*) FROM DOCTORS) DOCTORS,
       (SELECT COUNT(*) FROM APPOINTMENTS WHERE APPT_DATE=CURRENT_DATE()) TODAY,
       (SELECT COALESCE(SUM(AMOUNT),0) FROM BILLS WHERE STATUS='Paid') REVENUE`),
    q('SELECT * FROM V_MONTHLY_REVENUE ORDER BY MONTH'), q('SELECT * FROM V_APPT_STATUS'), q('SELECT * FROM V_DOCTOR_LOAD'),
  ]);
  res.json({ kpi, revenue, status, load });
}));
module.exports = r;
