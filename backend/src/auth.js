const jwt = require('jsonwebtoken');
const sign = u => jwt.sign({ id: u.ID, role: u.ROLE, ref: u.REF_ID, email: u.EMAIL }, process.env.JWT_SECRET, { expiresIn: '8h' });
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Your session has expired. Sign in again.' }); }
};
const role = (...allowed) => (req, res, next) =>
  allowed.includes(req.user.role) ? next() : res.status(403).json({ error: 'Your role does not have access to this.' });
module.exports = { sign, auth, role };
