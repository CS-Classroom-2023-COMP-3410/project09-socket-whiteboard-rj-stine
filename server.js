const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
// Serve static files from the "public" folder.
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  },
});

// This array holds all drawing actions so new clients can rebuild the board.
let boardState = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send the full board state to the newly connected client.
  socket.emit('boardState', boardState);

  // Listen for drawing actions from clients.
  socket.on('draw', (data) => {
    boardState.push(data);
    // Broadcast the drawing action to all other clients.
    io.emit('draw', data);
  });

  // Listen for a clear event.
  socket.on('clear', () => {
    boardState = []; // Reset board state.
    io.emit('clear'); // Notify all clients to clear their canvas.
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
