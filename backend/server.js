const path = require('path');
const express = require('express');
const cors = require('cors');
const { q } = require('./src/db');
const app = express();
app.use(cors(), express.json());
app.get('/api/health', async (req, res, next) => {
  try { const [v] = await q('SELECT CURRENT_VERSION() VERSION'); res.json({ ok: true, snowflake: v.VERSION }); } catch (e) { next(e); }
});
app.use('/api', require('./src/routes'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use((e, req, res, next) => {
  console.error(e.message);
  res.status(500).json({ error: 'The request failed. Check the Snowflake connection and try again.' });
});
app.listen(process.env.PORT || 4000, () => console.log(`Glacier HMS running on http://localhost:${process.env.PORT || 4000}`));
