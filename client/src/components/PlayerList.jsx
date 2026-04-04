// PlayerList — shows all players, their lives, whose turn it is, and who's eliminated

function PlayerList({ players, currentPlayerIndex, myId }) {
  return (
    <div className="mt-6 w-80 bg-gray-800/50 rounded-2xl p-4 backdrop-blur-sm border border-gray-700">
      <h2 className="text-sm font-bold text-gray-400 mb-3 tracking-wider">PLAYERS</h2>

      {players.map((player, index) => {
        const isCurrentTurn = index === currentPlayerIndex
        const isAlive = player.lives > 0

        return (
          <div
            key={index}
            className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-all ${
              !isAlive
                ? "bg-gray-900/50 opacity-40"
                : isCurrentTurn
                  ? "bg-yellow-500/20 border border-yellow-500/50"
                  : ""
            }`}
          >
            {/* Player name with turn indicator */}
            <div className="flex items-center gap-2">
              {isCurrentTurn && isAlive && <span className="text-yellow-400">▶</span>}
              {!isAlive && !player.isSpectator && <span>💀</span>}
              <span className={`font-semibold ${!isAlive ? "line-through text-gray-500" : "text-white"}`}>
                {player.name}
                {player.id === myId && <span className="ml-2 text-xs font-black text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">YOU</span>}
              </span>
              {player.isSpectator && (
                <span className="text-[10px] font-bold tracking-widest bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full ml-1">
                  SPECTATOR
                </span>
              )}
            </div>

            {/* Lives as hearts */}
            <div className="text-sm">
              {isAlive
                ? "❤️".repeat(player.lives)
                : "OUT"
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PlayerList
