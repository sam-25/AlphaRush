import React from 'react';
import BombTimer from './BombTimer';

export default function BombArena({ players, currentPlayerIndex, myId, timerSettings, timerKey, onExplode, onCountdownTick }) {
  // Arena Configuration
  const arenaRadius = 125; // Pixels from center to player avatar center
  
  // Calculate the target rotation angle for the central pointer arrow
  const getAngleForIndex = (index, total) => {
    // Start at -90 degrees (North)
    return (index * 360) / total - 90;
  };

  const currentAngle = players.length > 0 
    ? getAngleForIndex(currentPlayerIndex, players.length) 
    : -90;

  return (
    <div className="relative w-80 h-80 my-4 flex items-center justify-center shrink-0">
      
      {/* 
        The Rotating Pointer Arrow
        A container that starts at the center and rotates. 
        The arrow is positioned at the top of this container so it points outward.
      */}
      <div 
        className="absolute z-0 top-1/2 left-1/2 w-[180px] h-[180px] -ml-[90px] -mt-[90px] transition-transform duration-500 ease-in-out pointer-events-none"
        style={{ transform: `rotate(${currentAngle + 90}deg)` }} 
      >
        {/* The Big Arrow pointing outwards */}
        <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 flex flex-col items-center scale-90">
          <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[28px] border-transparent border-b-yellow-500 filter drop-shadow-[0_0_12px_rgba(234,179,8,1)]"></div>
          <div className="w-[12px] h-[14px] bg-yellow-500 -mt-[1px] filter drop-shadow-[0_0_12px_rgba(234,179,8,1)] rounded-b-sm"></div>
        </div>
      </div>

      {/* The Central Bomb Timer */}
      <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        {/* Since BombTimer has mt-6 flex-col, we might need to override its margins if we could, 
            but for now we'll just wrap it and it should be fine. Actually, let's wrap it tightly. */}
        <div className="-mt-6"> 
          <BombTimer key={timerKey} startTime={timerSettings.timer} onExplode={onExplode} onCountdownTick={onCountdownTick} />
        </div>
      </div>

      {/* The Players arranged in a circle */}
      {players.map((player, index) => {
        const isCurrentTurn = index === currentPlayerIndex;
        const isAlive = player.lives > 0;
        const isMe = player.id === myId;
        
        // Calculate position
        const angleDeg = getAngleForIndex(index, players.length);
        const angleRad = (angleDeg * Math.PI) / 180;
        
        // Left and Top offsets from center (0,0 is center of arena)
        const left = Math.cos(angleRad) * arenaRadius;
        const top = Math.sin(angleRad) * arenaRadius;

        return (
          <div
            key={player.id || index}
            className={`absolute z-20 flex flex-col items-center justify-center transition-all duration-300 w-24`}
            style={{
              transform: `translate(calc(-50% + ${left}px), calc(-50% + ${top}px))`,
              top: '50%',
              left: '50%',
            }}
          >
            {/* Avatar / Logo */}
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg border-2 transition-all ${
                !isAlive 
                  ? "bg-gray-800 border-gray-700 opacity-50 grayscale" 
                  : isCurrentTurn
                    ? "bg-gray-700 border-yellow-400 scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                    : isMe
                      ? "bg-gray-700 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                      : "bg-gray-800 border-gray-600"
              }`}
            >
              {!isAlive ? "💀" : isMe ? "😎" : "👾"}
            </div>

            {/* Nameplate */}
            <div className={`mt-0.5 text-center bg-gray-900/80 px-1.5 py-[1px] rounded flex items-center justify-center border border-gray-700 backdrop-blur-sm max-w-[75px] truncate`}>
              <span className={`text-[10px] sm:text-xs font-bold leading-tight ${!isAlive ? "text-gray-500 line-through" : isMe ? "text-green-400" : "text-white"}`}>
                {player.name}
              </span>
            </div>

            {/* Lives / Status */}
            <div className="mt-0.5 text-[10px] select-none h-4">
              {player.isSpectator 
                ? <span className="text-gray-400 font-bold tracking-widest">SPECTATOR</span>
                : !isAlive 
                  ? <span className="text-red-500 font-bold">ELIMINATED</span>
                  : player.lives > 5 
                    ? <span className="text-red-400 font-bold">{player.lives} ❤️</span>
                    : <span className="text-red-400">{"❤️".repeat(player.lives)}</span>
              }
            </div>
          </div>
        );
      })}

    </div>
  );
}
