const { io } = require("socket.io-client");

const socket = io("http://localhost:3001", {
  reconnectionDelay: 1000,
  reconnection: true,
  reconnectionAttemps: 5,
  transports: ["websocket"],
  agent: false,
  upgrade: false,
  rejectUnauthorized: false
});

socket.on("connect", () => {
  console.log("✅ CONNECTED to server!");
  console.log("📤 Emitting 'create-room'");
  socket.emit("create-room", "TestPlayer");
});

socket.on("room-created", (code) => {
  console.log("🎉 'room-created' received! Code:", code);
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection Error:", err.message);
  process.exit(1);
});

socket.on("error-message", (msg) => {
  console.log("❌ Server Error Message:", msg);
});

setTimeout(() => {
  console.log("⏱️ Timeout reached! No response received.");
  process.exit(1);
}, 3000);
