// Bomb Timer — now with onExplode callback to notify the server
import { useState, useEffect } from 'react'

// "onExplode" is a function passed by App.jsx — called when time runs out
function BombTimer({ startTime, onExplode, onCountdownTick }) {
  const [timeLeft, setTimeLeft] = useState(startTime)
  const [hasExploded, setHasExploded] = useState(false)

  const progress = (startTime - timeLeft) / startTime
  const circumference = 2 * Math.PI * 48

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setHasExploded(true)
          // Tell the parent (App.jsx) that the bomb went off
          // App.jsx will then tell the server via socket.emit("bomb-exploded")
          if (onExplode) onExplode()
          return 0
        }
        const nextVal = prev - 1
        // 🔊 Play countdown tick for last 5 seconds
        if (nextVal <= 5 && nextVal > 0 && onCountdownTick) {
          onCountdownTick(nextVal)
        }
        return nextVal
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90 absolute top-0 left-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="#374151" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="48" fill="none"
            stroke={hasExploded ? "#ef4444" : timeLeft <= 5 ? "#ef4444" : "#eab308"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * progress}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${
          hasExploded
            ? "animate-[bomb-glow_0.5s_ease-in-out_infinite]"
            : timeLeft <= 5
              ? "text-red-400 animate-[bomb-glow_1s_ease-in-out_infinite]"
              : "text-white"
        }`}>
          {hasExploded ? (
            "💥"
          ) : timeLeft <= 5 ? (
            <div className="relative flex items-center justify-center w-full h-full">
              <span className="absolute text-[40px] animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-40">💣</span>
              <span className="relative text-[48px] animate-pulse">💣</span>
              <span className="absolute text-lg font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10">{timeLeft}</span>
            </div>
          ) : (
            `${timeLeft}s`
          )}
        </div>
      </div>
      <p className={`mt-3 text-sm font-semibold ${hasExploded ? "text-red-400" : "text-gray-500"}`}>
        {hasExploded ? "BOOM! Time's up!" : "Type fast..."}
      </p>
    </div>
  )
}

export default BombTimer
