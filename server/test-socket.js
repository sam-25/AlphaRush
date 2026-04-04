const { io } = require("socket.io-client");
const socket = io("http://localhost:3001");
socket.on("connect", () => {
  console.log("Connected. Sending create-room");
  socket.emit("create-room", "TestPlayer");
});
socket.on("room-created", (code) => {
  console.log("Room created:", code);
  process.exit(0);
});
setTimeout(() => {
  console.log("Timeout!");
  process.exit(1);
}, 3000);
