// The Lobby component — what players see BEFORE entering a game
// They can enter a username and either create a new room or join an existing one
import { useState } from 'react'

// "socket" = our connection to the server
// "onJoined" = a function the parent (App.jsx) gave us to call when we join a room
function Lobby({ socket, onJoined }) {
  // Track the player's chosen name
  const [name, setName] = useState("")
  // Track the room code they want to join (pre-fill from URL if provided)
  const urlParams = new URLSearchParams(window.location.search)
  const initialRoom = urlParams.get("room") || ""
  const [roomCode, setRoomCode] = useState(initialRoom)
  const isInviteLink = !!initialRoom
  // Track any error messages from the server
  const [error, setError] = useState("")

  // Called when the player clicks "Create Room"
  const handleCreate = () => {
    // Don't allow empty names
    if (!name.trim()) return setError("Please enter your name!")
    // Clear any old errors
    setError("")
    // Tell the server: "I want to create a room. My name is ___"
    socket.emit("create-room", name.trim())
  }

  // Called when the player clicks "Join Room"
  const handleJoin = () => {
    if (!name.trim()) return setError("Please enter your name!")
    if (!roomCode.trim()) return setError("Please enter a room code!")
    setError("")
    // Tell the server: "I want to join room ___. My name is ___"
    socket.emit("join-room", {
      playerName: name.trim(),
      roomCode: roomCode.toUpperCase().trim(),
    })
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col items-center justify-center">

      {/* Persistent Home Button */}
      <div className="absolute top-3 left-4 z-50">
        <button 
          onClick={() => window.location.href = "/"}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 font-bold text-sm bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm backdrop-blur-md hover:bg-gray-700"
        >
          🏠 Home
        </button>
      </div>

      {/* Title */}
      <h1 className="text-5xl font-extrabold tracking-wider mb-2">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">
          ALPHA
        </span>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
          RUSH
        </span>
        <span className="ml-2">💣</span>
      </h1>
      <p className="text-gray-500 text-sm mb-10">Type or explode!</p>

      {/* Card container for the form */}
      <div className="w-80 bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">

        {/* Name input */}
        <label className="block text-sm text-gray-400 mb-1 font-semibold">YOUR NAME</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          maxLength={12}
          className="w-full px-4 py-3 mb-4 text-lg bg-gray-900 border-2 border-gray-700 rounded-xl focus:border-yellow-500 focus:outline-none transition-colors placeholder:text-gray-600 focus:ring-2 focus:ring-yellow-500/20 text-white"
        />

        {!isInviteLink && (
          <>
            {/* Create Room button */}
            <button
              onClick={handleCreate}
              className="w-full py-3 mb-4 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl hover:from-yellow-400 hover:to-orange-400 transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
            >
              Create Room
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-gray-500 text-sm font-semibold">or join a room</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>
          </>
        )}

        {/* Room code input / display */}
        {isInviteLink ? (
          <div className="mb-6 flex flex-col items-center bg-gray-900 border-2 border-gray-700 rounded-xl py-3">
            <span className="text-gray-500 text-xs font-bold tracking-wider mb-1">JOINING ROOM</span>
            <span className="text-2xl font-black text-yellow-400 tracking-widest">{roomCode}</span>
          </div>
        ) : (
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter room code..."
            maxLength={4}
            className="w-full px-4 py-3 mb-4 text-lg text-center tracking-widest font-bold bg-gray-900 border-2 border-gray-700 rounded-xl focus:border-yellow-500 focus:outline-none transition-colors placeholder:text-gray-600 placeholder:tracking-normal placeholder:font-normal text-white uppercase focus:ring-2 focus:ring-yellow-500/20"
          />
        )}

        {/* Join Room button */}
        <button
          onClick={handleJoin}
          className="w-full py-3 text-lg font-bold bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all active:scale-95"
        >
          Join Room
        </button>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        {/* Home Link if on Invite */}
        {isInviteLink && (
          <div className="mt-6 text-center">
            <button 
              onClick={() => window.location.href = "/"} 
              className="text-gray-500 text-sm hover:text-white transition-colors underline underline-offset-4"
            >
              Want to create your own room? Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Lobby
