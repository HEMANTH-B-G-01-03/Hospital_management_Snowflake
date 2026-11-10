// Thin fetch wrapper: adds the JWT, parses JSON, throws readable errors.
async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method, body: body && JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...(localStorage.token && { Authorization: 'Bearer ' + localStorage.token }) },
    });
  } catch { throw new Error('Cannot reach the server. Check that the backend is running.'); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && localStorage.token) { localStorage.clear(); location.reload(); }
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}
