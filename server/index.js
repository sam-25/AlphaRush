// ============================
// AlphaRush Server — The Brain
// ============================

const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
// Import our game logic module (dictionary + syllable generation)
const { getRandomSyllable, validateWord } = require("./gameLogic")
// Import defaults
const defaults = require("./defaults")

const app = express()
// Serve the built React client files from the "public" folder
// In Docker, the built client (HTML/CSS/JS) lives here so players can load the game UI
const path = require("path")
app.use(express.static(path.join(__dirname, "public")))
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: "*" },
})

// --- ROOMS STORAGE ---
const rooms = {}

// Helper: generate a random room code
function generateRoomCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let code = ""
  for (let i = 0; i < defaults.ROOM_CODE_LENGTH; i++) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  return code
}

// Helper: get player list for clients (only send what they need)
function getPlayersInRoom(roomCode) {
  const room = rooms[roomCode]
  if (!room) return []
  return room.players.map((p) => ({
    id: p.id,
    name: p.name,
    lives: p.lives,
    isAlive: p.lives > 0,
    isSpectator: p.isSpectator || false,
    lettersUsed: p.lettersUsed || [],
  }))
}

// Helper: send full game state to everyone in a room
function broadcastGameState(roomCode) {
  const room = rooms[roomCode]
  if (!room) return

  io.to(roomCode).emit("game-state", {
    status: room.status,
    creatorId: room.creatorId,
    settings: room.settings,
    players: getPlayersInRoom(roomCode),
    currentPlayerIndex: room.currentPlayerIndex,
    syllable: room.syllable,
    gameOver: room.gameOver || false,
    winner: room.winner || null,
  })
}

// Helper: move to the next ALIVE player's turn
function nextTurn(roomCode) {
  const room = rooms[roomCode]
  if (!room || room.gameOver) return

  // Count how many players are still alive
  const alivePlayers = room.players.filter((p) => p.lives > 0)

  // If nobody is alive left, game over!
  if (alivePlayers.length === 0) {
    room.gameOver = true
    room.winner = null
    console.log(`🏆 Game over in room ${roomCode}! Everyone died.`)
    broadcastGameState(roomCode)
    return
  }

  // If only 1 is left alive — they win!
  if (alivePlayers.length === 1) {
    room.gameOver = true
    room.winner = alivePlayers[0].name
    console.log(`🏆 Game over in room ${roomCode}! Winner: ${room.winner}`)
    broadcastGameState(roomCode)
    return
  }

  // Move to next player, but skip dead players (lives <= 0)
  let nextIndex = (room.currentPlayerIndex + 1) % room.players.length
  // Keep skipping until we find an alive player
  while (room.players[nextIndex].lives <= 0) {
    nextIndex = (nextIndex + 1) % room.players.length
  }
  room.currentPlayerIndex = nextIndex

  // Pick a new syllable IF no one failed, OR if it has failed more than 1 time
  if ((room.syllableFails || 0) === 0 || (room.syllableFails || 0) > 1) {
    room.syllable = getRandomSyllable()
    room.syllableFails = 0 // Reset tracking
  }

  broadcastGameState(roomCode)
}

// --- SOCKET CONNECTIONS ---
io.on("connection", (socket) => {
  console.log(`✅ Player connected! ID: ${socket.id}`)

  // ===== CREATE ROOM =====
  socket.on("create-room", (playerName) => {
    let roomCode = generateRoomCode()
    while (rooms[roomCode]) roomCode = generateRoomCode()

    rooms[roomCode] = {
      creatorId: socket.id,
      status: defaults.STATUS_WAITING,
      settings: {
        timer: defaults.DEFAULT_TIMER,
        lives: defaults.DEFAULT_LIVES,
        alphabetSet: "ABCDEFGHIKLMNOPRSTUVY"
      },
      players: [{ id: socket.id, name: playerName, lives: defaults.DEFAULT_LIVES, isSpectator: false, lettersUsed: [] }],
      currentPlayerIndex: 0,
      syllable: getRandomSyllable(),
      syllableFails: 0,
      usedWords: [],
      gameOver: false,
      winner: null,
    }

    socket.join(roomCode)
    socket.roomCode = roomCode
    console.log(`🏠 Room ${roomCode} created by ${playerName}`)
    socket.emit("room-created", roomCode)
    broadcastGameState(roomCode)
  })

  // ===== JOIN ROOM =====
  socket.on("join-room", ({ playerName, roomCode }) => {
    if (!rooms[roomCode]) {
      socket.emit("error-message", "Room not found! Check the code.")
      return
    }

    const isPlayingOrOver = rooms[roomCode].status === defaults.STATUS_PLAYING || rooms[roomCode].gameOver
    rooms[roomCode].players.push({ 
      id: socket.id, 
      name: playerName, 
      lives: isPlayingOrOver ? 0 : rooms[roomCode].settings.lives, 
      isSpectator: isPlayingOrOver,
      lettersUsed: []
    })
    socket.join(roomCode)
    socket.roomCode = roomCode
    console.log(`👋 ${playerName} joined room ${roomCode}`)
    socket.emit("room-joined", roomCode)
    broadcastGameState(roomCode)
  })

  // ===== SUBMIT WORD =====
  socket.on("submit-word", (word) => {
    const roomCode = socket.roomCode
    const room = rooms[roomCode]
    if (!room || room.gameOver || room.status !== defaults.STATUS_PLAYING) return

    const currentPlayer = room.players[room.currentPlayerIndex]
    if (currentPlayer.id !== socket.id) {
      socket.emit("error-message", "It's not your turn!")
      return
    }

    // Check if this word was already used in this room
    const upperWord = word.toUpperCase()
    if (room.usedWords.includes(upperWord)) {
      socket.emit("word-result", {
        playerName: currentPlayer.name,
        word: upperWord,
        correct: false,
        reason: `"${upperWord}" was already used!`,
      })
      return
    }

    // Validate the word using our game logic module
    const result = validateWord(word, room.syllable)

    if (result.valid) {
      // Add to used words list so it can't be reused
      room.usedWords.push(upperWord)
      room.syllableFails = 0 // Reset since it was successfully answered!
      console.log(`✅ ${currentPlayer.name}: "${upperWord}" — correct!`)

      // ALPHABET COMPLETION MECHANIC
      let gainedLife = false
      const alphabet = (room.settings.alphabetSet || "ABCDEFGHIJKLMNOPQRSTUVWXYZ").split("")
      for (let char of upperWord) {
        if (alphabet.includes(char) && !currentPlayer.lettersUsed.includes(char)) {
          currentPlayer.lettersUsed.push(char)
        }
      }

      let reason = result.reason
      if (alphabet.length > 0 && currentPlayer.lettersUsed.length >= alphabet.length) {
        currentPlayer.lives += 1
        currentPlayer.lettersUsed = []
        gainedLife = true
        reason = `${result.reason} +1 Life for completing the alphabet!`
        console.log(`🎉 ${currentPlayer.name} completed the alphabet and gained a life!`)
      }

      io.to(roomCode).emit("word-result", {
        playerName: currentPlayer.name,
        word: upperWord,
        correct: true,
        reason: reason,
      })
      nextTurn(roomCode)
    } else {
      console.log(`❌ ${currentPlayer.name}: "${upperWord}" — ${result.reason}`)
      io.to(roomCode).emit("word-result", {
        playerName: currentPlayer.name,
        word: upperWord,
        correct: false,
        reason: result.reason,
      })
    }
  })

  // ===== BOMB EXPLODED =====
  socket.on("bomb-exploded", () => {
    const roomCode = socket.roomCode
    const room = rooms[roomCode]
    if (!room || room.gameOver || room.status !== defaults.STATUS_PLAYING) return

    const currentPlayer = room.players[room.currentPlayerIndex]
    if (currentPlayer.id !== socket.id) return

    currentPlayer.lives -= 1
    console.log(`💥 ${currentPlayer.name} lost a life! Lives: ${currentPlayer.lives}`)

    if (currentPlayer.lives <= 0) {
      console.log(`☠️ ${currentPlayer.name} is eliminated!`)
      io.to(roomCode).emit("player-eliminated", currentPlayer.name)
    }

    // Increment fail tracking so the next player gets the SAME syllable (but only once!)
    room.syllableFails = (room.syllableFails || 0) + 1

    nextTurn(roomCode)
  })

  // ===== START GAME =====
  socket.on("start-game", () => {
    const roomCode = socket.roomCode
    const room = rooms[roomCode]
    if (room && room.creatorId === socket.id && room.status === defaults.STATUS_WAITING) {
      room.status = defaults.STATUS_PLAYING
      room.currentPlayerIndex = 0
      room.syllable = getRandomSyllable()
      
      // Check if they are the only one in the room
      if (room.players.length === 1) {
        room.gameOver = true
        room.winner = room.players[0].name
      }
      
      broadcastGameState(roomCode)
    }
  })

  // ===== UPDATE SETTINGS =====
  socket.on("update-settings", (newSettings) => {
    const roomCode = socket.roomCode
    const room = rooms[roomCode]
    if (room && room.creatorId === socket.id && room.status === defaults.STATUS_WAITING) {
      // Apply safe overrides
      room.settings = { ...room.settings, ...newSettings }
      
      // If lives got changed, update all waiting non-spectator players!
      if (newSettings.lives !== undefined) {
        room.players.forEach(p => {
          if (!p.isSpectator) p.lives = room.settings.lives
        })
      }
      
      // Basic sanitize for alphabetSet: only leave unique A-Z uppercase letters
      if (newSettings.alphabetSet !== undefined) {
        const cleanedSet = [...new Set(newSettings.alphabetSet.toUpperCase().replace(/[^A-Z]/g, ''))].sort().join('');
        // Ensure at least 1 letter remains, otherwise fallback
        room.settings.alphabetSet = cleanedSet.length > 0 ? cleanedSet : "A";
      }

      broadcastGameState(roomCode)
    }
  })

  // ===== PLAY AGAIN =====
  socket.on("play-again", () => {
    const roomCode = socket.roomCode
    const room = rooms[roomCode]
    if (room && room.creatorId === socket.id && room.gameOver) {
      room.status = defaults.STATUS_WAITING
      room.gameOver = false
      room.winner = null
      room.usedWords = []
      room.syllableFails = 0
      
      // Make everyone a player again for the next match!
      room.players.forEach((p) => {
        p.lives = room.settings.lives
        p.isSpectator = false
        p.lettersUsed = []
      })
      
      broadcastGameState(roomCode)
    }
  })

  // ===== DISCONNECT =====
  socket.on("disconnect", () => {
    console.log(`❌ Player disconnected! ID: ${socket.id}`)
    const roomCode = socket.roomCode
    if (roomCode && rooms[roomCode]) {
      const room = rooms[roomCode]
      room.players = room.players.filter((p) => p.id !== socket.id)
      
      if (room.players.length === 0) {
        delete rooms[roomCode]
        console.log(`🗑️ Room ${roomCode} deleted (empty)`)
      } else {
        // Reassign creator if the creator left
        if (room.creatorId === socket.id) {
          room.creatorId = room.players[0].id
        }
        
        // If the game was active, and now someone left, evaluate game over
        if (room.status === defaults.STATUS_PLAYING) {
          const alivePlayers = room.players.filter(p => !p.isSpectator && p.lives > 0)
          if (alivePlayers.length <= 1) {
            nextTurn(roomCode)
            return
          }
        }

        if (room.currentPlayerIndex >= room.players.length) {
          room.currentPlayerIndex = 0
        }
        broadcastGameState(roomCode)
      }
    }
  })
})

const PORT = defaults.PORT
server.listen(PORT, () => {
  console.log(`🧠 AlphaRush server is running on http://localhost:${PORT}`)
  console.log(`📚 Dictionary loaded with 274,937 words`)
})
