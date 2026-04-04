import { useState, useEffect, useRef } from 'react'
import BombTimer from './components/BombTimer'
import BombArena from './components/BombArena'
import PlayerList from './components/PlayerList'
import Lobby from './components/Lobby'
import socket from './socket'

function App() {
  const [guess, setGuess] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  // Game state
  const [roomCode, setRoomCode] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [syllable, setSyllable] = useState("??")
  const [feedback, setFeedback] = useState(null)
  const [timerKey, setTimerKey] = useState(0)
  const [copied, setCopied] = useState(false)

  // Game state controls
  const [status, setStatus] = useState("waiting")
  const [creatorId, setCreatorId] = useState(null)
  const [settings, setSettings] = useState({ lives: 3, timer: 10, alphabetSet: "ABCDEFGHIKLMNOPRSTUVY" })

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  
  const inputRef = useRef(null)
  const feedbackTimeoutRef = useRef(null)

  // --- CURRENT PLAYER STATUS ---
  const isMyTurn = players.length > 0 && players[currentPlayerIndex]?.id === socket.id
  const me = players.find(p => p.id === socket.id)
  const isSpectator = me?.isSpectator
  const myLettersUsed = me?.lettersUsed || []

  // Auto-focus input when it becomes this player's turn
  useEffect(() => {
    if (isMyTurn && !isSpectator && inputRef.current && status === "playing" && !gameOver) {
      inputRef.current.focus()
    }
  }, [isMyTurn, isSpectator, status, gameOver])

  // Clear input when the turn changes
  useEffect(() => {
    setGuess("")
  }, [currentPlayerIndex])

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true))
    socket.on("disconnect", () => setIsConnected(false))
    socket.on("room-created", (code) => setRoomCode(code))
    socket.on("room-joined", (code) => setRoomCode(code))

    // The big game state update
    socket.on("game-state", (state) => {
      setStatus(state.status)
      setCreatorId(state.creatorId)
      if (state.settings) setSettings(state.settings)
      setPlayers(state.players)
      setCurrentPlayerIndex(state.currentPlayerIndex)
      setSyllable(state.syllable)
      setGameOver(state.gameOver)
      setWinner(state.winner)
      // Only restart timer if game is currently playing
      if (!state.gameOver && state.status === "playing") {
        setTimerKey((prev) => prev + 1)
      }
    })

    // Word result — now includes a "reason" from the server
    socket.on("word-result", (result) => {
      setFeedback(result)
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 4000)
    })

    // Player eliminated alert
    socket.on("player-eliminated", (name) => {
      setFeedback({ playerName: name, word: "", correct: false, reason: `☠️ ${name} has been eliminated!` })
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 4000)
    })

    socket.on("error-message", (msg) => alert(msg))

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("room-created")
      socket.off("room-joined")
      socket.off("game-state")
      socket.off("word-result")
      socket.off("player-eliminated")
      socket.off("error-message")
    }
  }, [])

  // Sync room code to URL
  useEffect(() => {
    if (roomCode) {
      window.history.pushState({}, "", `?room=${roomCode}`)
    }
  }, [roomCode])

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?room=${roomCode}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleInputChange = (e) => {
    const sanitizedValue = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
    setGuess(sanitizedValue)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && guess.trim()) {
      socket.emit("submit-word", guess.trim())
      setGuess("")
    }
  }

  const handleBombExplode = () => {
    // SECURITY/BUG FIX: Only the person whose turn it currently is should tell the server the bomb exploded!
    // Otherwise, EVERYONE'S timer hits 0 at the exact same time and they all emit 'bomb-exploded', 
    // causing the server to deduct a life from everyone in a rapid chain reaction.
    const itIsMyTurn = players.length > 0 && players[currentPlayerIndex]?.id === socket.id
    if (itIsMyTurn) {
      socket.emit("bomb-exploded")
    }
  }

  // --- SHARED TOP BAR ---
  const renderTopBar = () => (
    <div className="w-full absolute top-0 left-0 flex justify-between items-center px-4 py-3 z-50 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <button 
          onClick={() => window.location.href = "/"}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 font-bold text-sm bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm backdrop-blur-md hover:bg-gray-700"
        >
          🏠 Home
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm backdrop-blur-md">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="text-sm text-gray-400 font-semibold bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-md">
          Room: <span className="text-yellow-400 font-black tracking-widest ml-1">{roomCode}</span>
        </div>
        <button 
          onClick={handleCopyLink}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${
            copied 
              ? "bg-green-500/20 text-green-400 border-green-500/50" 
              : "bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-600 backdrop-blur-md"
          }`}
        >
          {copied ? "✅ Copied!" : "📋 Copy Link"}
        </button>
      </div>
    </div>
  )

  // --- LOBBY SCREEN ---
  if (!roomCode) {
    return <Lobby socket={socket} />
  }

  // --- WAITING ROOM SCREEN ---
  if (status === "waiting" && !gameOver) {
    const isCreator = socket.id === creatorId
    return (
      <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col items-center justify-center relative">
        {renderTopBar()}
        
        <h1 className="text-5xl font-extrabold tracking-wider mb-4 mt-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">ALPHA</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">RUSH</span>
          <span className="ml-2">💣</span>
        </h1>

        <PlayerList players={players} currentPlayerIndex={-1} myId={socket.id} />

        {/* Room Settings Panel */}
        <div className="mt-6 w-80 bg-gray-800/50 rounded-2xl p-4 backdrop-blur-sm border border-gray-700 text-left">
          <h2 className="text-sm font-bold text-gray-400 mb-3 tracking-wider">ROOM SETTINGS</h2>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-gray-300">Time Limit (sec)</span>
            {isCreator ? (
              <input 
                type="number" 
                value={settings.timer} 
                onChange={(e) => socket.emit("update-settings", { timer: parseInt(e.target.value) || 10 })}
                className="w-16 bg-gray-900 border-2 border-gray-600 rounded-lg px-2 py-1 text-center font-bold focus:border-yellow-500 focus:outline-none"
                min="3" max="60"
              />
            ) : (
              <span className="text-yellow-400 font-bold text-lg">{settings.timer}s</span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-300">Starting Lives</span>
            {isCreator ? (
              <input 
                type="number" 
                value={settings.lives} 
                onChange={(e) => socket.emit("update-settings", { lives: parseInt(e.target.value) || 3 })}
                className="w-16 bg-gray-900 border-2 border-gray-600 rounded-lg px-2 py-1 text-center font-bold focus:border-red-500 focus:outline-none"
                min="1" max="10"
              />
            ) : (
              <span className="text-red-400 font-bold tracking-widest text-sm">
                {settings.lives > 5 ? `${settings.lives} ❤️` : "❤️".repeat(settings.lives)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-700">
            <span className="text-sm font-semibold text-gray-300">Target Alphabet</span>
            {isCreator ? (
               <div className="flex flex-wrap gap-1">
                 {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
                   const isSelected = (settings.alphabetSet || "ABCDEFGHIJKLMNOPQRSTUVWXYZ").includes(letter);
                   return (
                     <button
                       key={letter}
                       onClick={() => {
                         let newSet = settings.alphabetSet || "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                         if (isSelected && newSet.length > 1) { // prevent empty
                           newSet = newSet.replace(letter, "");
                         } else if (!isSelected) {
                           newSet = (newSet + letter).split('').sort().join('');
                         }
                         socket.emit("update-settings", { alphabetSet: newSet });
                       }}
                       className={`w-6 h-6 text-xs font-bold rounded flex items-center justify-center transition-colors cursor-pointer ${isSelected ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-700'}`}
                     >
                       {letter}
                     </button>
                   );
                 })}
               </div>
            ) : (
                <div className="flex flex-wrap gap-1 text-xs text-yellow-400 font-bold">
                   {(settings.alphabetSet || "ABCDEFGHIJKLMNOPQRSTUVWXYZ").split("").map(l => <span key={l}>{l}</span>)}
                </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          {isCreator ? (
            <button
              onClick={() => socket.emit("start-game")}
              className="px-10 py-4 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 shadow-lg shadow-green-500/20 border border-green-400/30"
            >
              Start Game ▶
            </button>
          ) : (
            <p className="text-gray-400 text-lg animate-pulse font-semibold">Waiting for host to start...</p>
          )}
        </div>
      </div>
    )
  }

  // --- GAME OVER SCREEN ---
  if (gameOver) {
    const isCreator = socket.id === creatorId
    return (
      <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col items-center justify-center relative">
        {renderTopBar()}
        
        <h1 className="text-6xl font-extrabold mb-4 mt-8">🏆</h1>
        <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
          {winner ? `${winner} Wins!` : "Game Over!"}
        </h2>
        <div className="mt-8"></div>
        <PlayerList players={players} currentPlayerIndex={-1} myId={socket.id} />
        
        <div className="mt-8">
          {isCreator ? (
            <button
              onClick={() => socket.emit("play-again")}
              className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl hover:from-yellow-400 hover:to-orange-400 transition-all active:scale-95"
            >
              Play Again ↺
            </button>
          ) : (
            <p className="text-gray-400 font-semibold animate-pulse">Waiting for host to play again...</p>
          )}
        </div>
      </div>
    )
  }

  // --- GAME SCREEN ---
  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col items-center relative pt-10 pb-2">
      {renderTopBar()}

      {/* Header */}
      <h1 className="text-3xl font-extrabold mt-0 tracking-wider">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">ALPHA</span>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">RUSH</span>
        <span className="ml-2">💣</span>
      </h1>

      {/* Whose turn */}
      <p className="text-gray-400 text-xs mt-1">
        {players[currentPlayerIndex]?.name}'s turn
      </p>

      {/* Syllable */}
      <div className="mt-2 text-4xl font-extrabold bg-gray-800/50 px-8 py-2 rounded-xl border-2 border-yellow-500/60 animate-[syllable-glow_2s_ease-in-out_infinite] backdrop-blur-sm shadow-[0_4px_15px_rgba(0,0,0,0.4)] z-50">
        {syllable}
      </div>

      {/* Bomb Arena (Timer + Players Circular Layout) */}
      <div className="flex-1 w-full max-h-[360px] flex items-center justify-center my-0 scale-95 sm:scale-100">
        <BombArena 
          players={players} 
          currentPlayerIndex={currentPlayerIndex} 
          myId={socket.id} 
          timerSettings={settings} 
          timerKey={timerKey} 
          onExplode={handleBombExplode} 
        />
      </div>

      {/* Word feedback — now shows the REASON */}
      {feedback && (
        <p className={`mt-2 text-sm font-bold ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.correct
            ? `✅ "${feedback.word}" is correct!`
            : `❌ ${feedback.reason}`
          }
        </p>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={guess}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={!isMyTurn || isSpectator}
        placeholder={
          isSpectator 
            ? "You are spectating..." 
            : isMyTurn 
              ? "Type a word and press Enter..." 
              : "Wait for your turn..."
        }
        autoFocus
        className={`mt-2 w-80 px-4 py-2 text-lg text-center font-semibold bg-gray-800/50 border-2 rounded-xl focus:outline-none transition-all placeholder:text-gray-600 ${
          isMyTurn && !isSpectator
            ? "border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 text-white"
            : "border-gray-700 text-gray-500 cursor-not-allowed opacity-70"
        }`}
      />

      {/* Alphabet Tracker */}
      {!isSpectator && !gameOver && status === "playing" && (
        <div className="mt-1 w-72 sm:w-80 bg-gray-800/60 rounded-xl p-2 z-50 backdrop-blur-sm border border-gray-700 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
          <h2 className="text-[10px] sm:text-xs font-bold text-gray-400 mb-1.5 tracking-wider text-center">ALPHABET COMPLETION</h2>
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
            {(settings.alphabetSet || "ABCDEFGHIJKLMNOPQRSTUVWXYZ").split("").map(letter => {
              const isUsed = myLettersUsed.includes(letter);
              return (
                <span 
                  key={letter} 
                  className={`flex items-center justify-center w-6 h-6 text-[10px] font-bold rounded-md transition-all ${
                    !isUsed 
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                      : "bg-gray-900/50 text-gray-600 border border-gray-700/50"
                  }`}
                >
                  {letter}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom spacer taking up the remaining area if any */}
      <div className="flex-1"></div>
    </div>
  )
}

export default App
