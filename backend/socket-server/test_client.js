const io = require('socket.io-client');

const URL = 'http://127.0.0.1:3001';
const EVENT_ID = 1; // adjust if your event id is different

function makeClient(name, userId) {
  const socket = io(URL, { reconnectionAttempts: 2, timeout: 5000 });

  socket.on('connect', () => {
    console.log(`${name} connected:`, socket.id);
    socket.emit('join', { user: name, user_id: userId, event_id: EVENT_ID });
  });

  socket.on('history', (h) => console.log(`${name} history count:`, (h && h.length) || 0));
  socket.on('not_allowed', (m) => console.log(`${name} not_allowed:`, m));
  socket.on('message', (m) => console.log(`${name} recv message:`, m));

  return socket;
}

(async () => {
  const alice = makeClient('Alice', 1);
  const bob = makeClient('Bob', 2);

  // Wait a bit for joins to process
  await new Promise(r => setTimeout(r, 1500));

  const payload = { event_id: EVENT_ID, user_id: 1, from: 'Alice', text: 'Hello from Alice - ' + Date.now() };
  console.log('Alice sending:', payload.text);
  alice.emit('message', payload);

  // Keep process alive briefly to observe messages
  setTimeout(() => {
    alice.disconnect();
    bob.disconnect();
    console.log('Test finished.');
    process.exit(0);
  }, 4000);
})();