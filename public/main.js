import { io } from "/socket.io/socket.io.esm.min.js";

// Connect to the Socket.IO server.
// Since the client is served from the same server, you can simply use io()
const socket = io();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSizeInput = document.getElementById("brushSize");
const clearBtn = document.getElementById("clearBtn");

let drawing = false;
let current = { color: colorPicker.value, size: brushSizeInput.value };
let lastPos = { x: 0, y: 0 };

// Log connection status.
socket.on("connect", () => {
  console.log("Connected to Socket.IO server with id:", socket.id);
});
socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
});

// When receiving a drawing action from the server, draw it on the canvas.
socket.on("draw", (data) => {
  const w = canvas.width;
  const h = canvas.height;
  drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
});

// Load the full board state when connecting.
socket.on("boardState", (state) => {
  state.forEach(data => {
    const w = canvas.width;
    const h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
  });
});

// Clear the canvas when a clear event is received.
socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Mouse event listeners for drawing.
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  lastPos = { x: e.offsetX, y: e.offsetY };
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const currentPos = { x: e.offsetX, y: e.offsetY };
  // Emit the drawing action (using normalized coordinates).
  socket.emit("draw", {
    x0: lastPos.x / canvas.width,
    y0: lastPos.y / canvas.height,
    x1: currentPos.x / canvas.width,
    y1: currentPos.y / canvas.height,
    color: current.color,
    size: current.size
  });
  // Draw immediately on the local canvas.
  lastPos = currentPos;
});

// Update drawing parameters when the user changes them.
colorPicker.addEventListener("change", (e) => {
  current.color = e.target.value;
});
brushSizeInput.addEventListener("change", (e) => {
  current.size = e.target.value;
});

// Clear board button – send a clear event to the server.
clearBtn.addEventListener("click", () => {
  socket.emit("clear");
});

// Function to draw a line on the canvas.
function drawLine(x0, y0, x1, y1, color, size) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.stroke();
  ctx.closePath();
}
