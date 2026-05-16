const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');

const PORT = process.env.PORT || 3001;

// MySQL pool - adjust credentials if different
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'event_management',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

async function fetchHistory(limit = 500, event_id = null) {
  if (!event_id) {
    return [];
  }
  const [rows] = await pool.query('SELECT id, user_id, event_id, user_name, text, UNIX_TIMESTAMP(created_at) as ts FROM messages WHERE event_id = ? ORDER BY id ASC LIMIT ?', [event_id, limit]);
  return rows.map(r => ({ id: r.id, user_id: r.user_id, event_id: r.event_id, from: r.user_name, text: r.text, ts: r.ts }));
}

async function isRegistered(user_id, event_id) {
  if (!user_id || !event_id) return false;
  const [rows] = await pool.query('SELECT 1 FROM event_registrations WHERE user_id = ? AND event_id = ? LIMIT 1', [user_id, event_id]);
  return Array.isArray(rows) && rows.length > 0;
}

async function saveMessage({ user_id = null, event_id = null, user_name = 'Anonymous', text }) {
  const [res] = await pool.execute('INSERT INTO messages (user_id, event_id, user_name, text) VALUES (?,?,?,?)', [user_id, event_id, user_name, text]);
  const insertId = res.insertId;
  const [rows] = await pool.query('SELECT id, user_id, user_name, text, UNIX_TIMESTAMP(created_at) as ts FROM messages WHERE id = ?', [insertId]);
  return rows[0] || null;
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', async (data) => {
    try {
      const eventId = data?.event_id || null;
      const userId = data?.user_id || null;
      // Only event-specific chat rooms are allowed.
      if (!eventId) {
        socket.emit('not_allowed', { message: 'Event chat requires an event ID.' });
        return;
      }
      const ok = await isRegistered(userId, eventId);
      if (!ok) {
        socket.emit('not_allowed', { message: 'You are not registered for this event.' });
        return;
      }
      const room = `event_${eventId}`;
      socket.join(room);
      console.log('join', { user: data?.user, eventId, room });
      socket.emit('message', { from: 'INSAT', text: `Welcome ${data?.user || 'Guest'}!` });
      const history = await fetchHistory(500, eventId);
      socket.emit('history', history);
    } catch (err) {
      console.error('join error', err);
    }
  });

  socket.on('message', async (msg) => {
    try {
      const eventId = msg.event_id || null;
      const userId = msg.user_id || null;
      if (!eventId) {
        socket.emit('not_allowed', { message: 'Event chat requires an event ID.' });
        return;
      }
      const ok = await isRegistered(userId, eventId);
      if (!ok) {
        socket.emit('not_allowed', { message: 'You are not registered for this event.' });
        return;
      }
      const saved = await saveMessage({ user_id: msg.user_id || null, event_id: eventId, user_name: msg.from || 'Anonymous', text: msg.text });
      const payload = { id: saved.id, event_id: eventId, from: saved.user_name, text: saved.text, ts: saved.ts };
      const room = `event_${eventId}`;
      socket.to(room).emit('message', payload);
    } catch (err) {
      console.error('save message error', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`Socket server listening on ${PORT}`));
