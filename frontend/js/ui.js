// Reusable UI components
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const money = v => '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const loading = el => { el.innerHTML = '<div class="loader" role="status" aria-label="Loading"></div>'; };
const empty = (title, hint = '') => `<div class="empty"><b>${esc(title)}</b><span>${esc(hint)}</span></div>`;
const errorBox = e => `<div class="empty err"><b>Could not load this page</b><span>${esc(e.message)}</span></div>`;
function toast(msg, type = '') { const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 3500); }

function cell(k, v) {
  if (v == null || v === '') return '—';
  if (k === 'STATUS') return `<span class="badge ${esc(String(v).toLowerCase())}">${esc(v)}</span>`;
  if (k === 'AMOUNT' || k === 'FEE') return money(v);
  if (k === 'AVAILABLE') return v ? 'Available' : 'On leave';
  return esc(v);
}
// cols: [[key,label]], actions(row) returns extra HTML for the last cell
function table(cols, rows, actions) {
  return `<div class="tablewrap"><table><thead><tr>${cols.map(c => `<th>${esc(c[1])}</th>`).join('')}${actions ? '<th></th>' : ''}</tr></thead><tbody>
  ${rows.map(r => `<tr>${cols.map(c => `<td>${cell(c[0], r[c[0]])}</td>`).join('')}${actions ? `<td class="act">${actions(r)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}
// fields: [{k,l,t,opts:[[value,label]]}]
function modal({ title, fields, values = {}, onSave }) {
  const el = document.createElement('div'); el.className = 'overlay';
  const input = f => f.opts
    ? `<select name="${f.k}" required><option value="">Select…</option>${f.opts.map(o => `<option value="${esc(o[0])}" ${String(values[f.k]) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`
    : f.t === 'textarea' ? `<textarea name="${f.k}" rows="3">${esc(values[f.k])}</textarea>`
    : `<input name="${f.k}" type="${f.t}" step="any" value="${esc(values[f.k])}" required>`;
  el.innerHTML = `<form class="modal"><h3>${esc(title)}</h3><div class="grid">${fields.map(f => `<label class="${f.t === 'textarea' ? 'full' : ''}">${esc(f.l)}${input(f)}</label>`).join('')}</div>
    <p class="formerr" role="alert"></p><div class="row"><button type="button" class="btn ghost" data-x>Cancel</button><button class="btn">Save</button></div></form>`;
  document.body.append(el);
  const form = $('form', el), save = $('.btn:not(.ghost)', el);
  el.addEventListener('click', e => { if (e.target === el || e.target.dataset.x !== undefined) el.remove(); });
  form.addEventListener('submit', async e => {
    e.preventDefault(); save.disabled = true; save.textContent = 'Saving…';
    try { await onSave(Object.fromEntries(new FormData(form))); el.remove(); }
    catch (err) { $('.formerr', el).textContent = err.message; save.disabled = false; save.textContent = 'Save'; }
  });
  $('input,select,textarea', el)?.focus();
}
