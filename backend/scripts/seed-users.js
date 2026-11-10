// Creates demo logins (password: Password123!). Run after database/schema.sql.
const bcrypt = require('bcryptjs');
const { q } = require('../src/db');
(async () => {
  const hash = await bcrypt.hash('Password123!', 10);
  for (const [email, role, ref] of [['admin@hms.demo', 'ADMIN', null], ['doctor@hms.demo', 'DOCTOR', 1], ['patient@hms.demo', 'PATIENT', 1]]) {
    await q('DELETE FROM USERS WHERE EMAIL=?', [email]);
    await q('INSERT INTO USERS (EMAIL,PASSWORD_HASH,ROLE,REF_ID) VALUES (?,?,?,?)', [email, hash, role, ref]);
  }
  console.log('Demo users created.'); process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
