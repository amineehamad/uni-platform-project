const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'event_management',
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4'
  });

  const inserts = [ { user_id: 1, event_id: 1 }, { user_id: 2, event_id: 1 } ];

  for (const it of inserts) {
    try {
      const [rows] = await pool.query('SELECT 1 FROM event_registrations WHERE user_id = ? AND event_id = ? LIMIT 1', [it.user_id, it.event_id]);
      if (Array.isArray(rows) && rows.length > 0) {
        console.log(`Registration exists for user ${it.user_id}, event ${it.event_id}`);
      } else {
        await pool.execute('INSERT INTO event_registrations (user_id, event_id) VALUES (?, ?)', [it.user_id, it.event_id]);
        console.log(`Inserted registration for user ${it.user_id}, event ${it.event_id}`);
      }
    } catch (err) {
      console.error('DB error for', it, err.message || err);
    }
  }

  await pool.end();
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });