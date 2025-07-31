window.onload = () => {
  const socket = io();

  const startScreen = document.getElementById('start-screen');
  const qrScreen = document.getElementById('qr-screen');
  const qrCanvas = document.getElementById('qr');
  const connectedScreen = document.getElementById('connected-screen');
  const generateBtn = document.getElementById('generateBtn');

  // Parse peerId from URL
  const pathname = window.location.pathname;
  const isPeer = pathname.startsWith('/peer/');
  const peerId = isPeer ? pathname.split('/peer/')[1] : null;

  console.log('🔍 Path:', pathname, '| Peer ID:', peerId);

  if (peerId) {
    // Guest view
    console.log('📡 Guest joining room:', peerId);
    startScreen.style.display = 'none';
    qrScreen.style.display = 'none';

    socket.emit('join', peerId);

    socket.on('connected', () => {
      console.log('✅ Guest connected to room');
      connectedScreen.style.display = 'block';
    });

  } else {
    // Host view
    generateBtn.addEventListener('click', () => {
      const newPeerId = Math.random().toString(36).substring(2, 8);
      const joinURL = `${window.location.origin}/peer/${newPeerId}`;

      console.log('🆕 Host generated peer room:', joinURL);

      startScreen.style.display = 'none';
      qrScreen.style.display = 'block';
      QRCode.toCanvas(qrCanvas, joinURL);

      socket.emit('join', newPeerId);

      socket.on('peer-joined', () => {
        console.log('🎉 Real peer joined');
        qrScreen.style.display = 'none';
        connectedScreen.style.display = 'block';
      });
    });
  }
};
