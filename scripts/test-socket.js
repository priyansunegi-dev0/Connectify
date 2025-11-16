const io = require('socket.io-client');

const SERVER = 'http://localhost:8000';
const MEETING_ID = 'test-meeting-123';

function makeClient(name) {
  const socket = io(SERVER, { 
    reconnectionDelay: 0, 
    forceNew: true, 
    transports: ['websocket', 'polling']
  });
  socket.on('connect', () => {
    console.log(`${name} connected as ${socket.id}`);
    socket.emit('join-call', MEETING_ID);
  });
  socket.on('connect_error', (err) => console.log(`${name} connection error:`, err.message));
  socket.on('disconnect', () => console.log(`${name} disconnected`));
  socket.on('user-joined', (id, clients) => console.log(`${name} got user-joined: ${id} clients:${clients}`));
  socket.on('chat-message', (data, sender, socketIdSender) => console.log(`${name} received chat-message from ${sender} (${socketIdSender}): ${data}`));
  socket.on('signal', (fromId, message) => {});
  return socket;
}

(async () => {
  console.log('Starting socket test...');
  const a = makeClient('ClientA');
  const b = makeClient('ClientB');

  // wait for both to connect
  await new Promise((res) => setTimeout(res, 1500));

  console.log('Sending chat from ClientA');
  a.emit('chat-message', 'Hello from A', 'ClientA');

  // wait to receive
  await new Promise((res) => setTimeout(res, 2000));

  a.close();
  b.close();
  console.log('Test finished');
  process.exit(0);
})();
