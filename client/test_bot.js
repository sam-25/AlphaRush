const io = require("socket.io-client");

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected as", socket.id);
  socket.emit("create-room", "TestBot");
});

socket.on("room-created", (roomCode) => {
  console.log("Room created:", roomCode);
  socket.emit("start-game");
});

socket.on("game-state", (state) => {
  if (state.status === "playing" && !state.gameOver) {
    const me = state.players.find(p => p.id === socket.id);
    if (me) {
      console.log(`My turn: ${state.currentPlayerIndex === 0}, Lives: ${me.lives}, Letters Used: ${me.lettersUsed.join("")}`);
      if (state.currentPlayerIndex === 0) {
        // Need to submit a word that contains the syllable
        // We don't have the dictionary, but we can just use dummy if validateWord isn't mocking, wait, we need real words.
        // Let's just log and we'll see.
        console.log(`Current Syllable: ${state.syllable}`);
      }
    }
  }
});

socket.on("word-result", (res) => {
  console.log("Word result:", res);
});

setTimeout(() => {
  socket.disconnect();
  process.exit(0);
}, 5000);
