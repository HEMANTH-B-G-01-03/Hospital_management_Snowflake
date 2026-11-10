require('dotenv').config();
const snowflake = require('snowflake-sdk');
snowflake.configure({ logLevel: 'ERROR' });
let pending;

const connect = () => new Promise((ok, no) => {
  const c = snowflake.createConnection({
    account: process.env.SF_ACCOUNT, username: process.env.SF_USER, password: process.env.SF_PASSWORD,
    warehouse: process.env.SF_WAREHOUSE, database: process.env.SF_DATABASE, schema: process.env.SF_SCHEMA,
  });
  c.connect(e => (e ? no(e) : ok(c)));
});

// Runs one SQL statement with bind variables and resolves to an array of row objects.
async function q(sqlText, binds = []) {
  pending = pending || connect().catch(e => { pending = null; throw e; });
  const conn = await pending;
  return new Promise((ok, no) => conn.execute({
    sqlText, binds, fetchAsString: ['Date'],
    complete: (e, _s, rows) => {
      if (e) { if (/terminated|expired/i.test(e.message)) pending = null; return no(e); }
      ok(rows);
    },
  }));
}
module.exports = { q };
