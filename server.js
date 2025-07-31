const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Route: host screen
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test_index.html'));
});

// Route: guest/peer screen
app.get('/peer/:peerId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'peer.html'));
});

const PORT = 3001;

// Get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface in interfaces) {
    for (const config of interfaces[iface]) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address;
      }
    }
  }
}

const localIP = getLocalIP();
const accessURL = `http://${localIP}:${PORT}`;

// Show terminal QR
QRCode.toString(accessURL, { type: 'terminal' }, (err, url) => {
  if (err) throw err;
  console.log('📡 Access this app on LAN at:', accessURL);
  console.log(url);
});

// WebSocket signaling
io.on('connection', (socket) => {
  console.log('⚡ New client connected', socket.id);
  socket.on('signal', (data) => {
  const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
  if (rooms.length > 0) {
    const room = rooms[0];
    socket.to(room).emit('signal', data);
  }
});

  socket.on('join', (peerId) => {
    socket.join(peerId);
    console.log(`🧩 [${socket.id}] Joined room: ${peerId}`);

    const room = io.sockets.adapter.rooms.get(peerId);
    const count = room ? room.size : 0;

    if (count === 2) {
      socket.to(peerId).emit('peer-joined');
    }

    socket.emit('connected');
  });

  socket.on('disconnect', () => {
    console.log('🚫 Client disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🖥️ Server running at http://${localIP}:${PORT}`);
});
