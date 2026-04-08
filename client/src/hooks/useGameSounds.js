import { useRef, useCallback } from 'react'

/**
 * AlphaRush Game Sounds — v4 (Logical UI Synthesis)
 *
 * Tightly tuned synthesized sounds that make contextual sense:
 * - Ping for correct
 * - Bzzzt for wrong
 * - Tick-tock for timers
 * - White noise sweeps for explosions
 */
export default function useGameSounds() {
  const ctxRef = useRef(null)
  
  // Cache the high-quality downloaded audio resources for the 3 main events
  const audioRefs = useRef({
    gameStart: new Audio('/sounds/osu-start.wav'),
    newTurn: new Audio('/sounds/osu-turn.wav'),
    winner: new Audio('/sounds/osu-winner.wav')
  })

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  // Basic oscillator (Sine/Square/Triangle)
  const playOsc = useCallback((type, freq, duration, vol, pitchSweep = null) => {
    const ctx = getCtx()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (pitchSweep) {
      osc.frequency.exponentialRampToValueAtTime(pitchSweep, t + duration)
    }

    // Sharp attack, linear decay
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + duration)
  }, [getCtx])

  // Noise generator (for hits, explosions, ticks)
  const playNoise = useCallback((duration, vol, filterFreq, filterType = 'lowpass', sweepTo = null) => {
    const ctx = getCtx()
    const t = ctx.currentTime
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.setValueAtTime(filterFreq, t)
    if (sweepTo) {
      filter.frequency.exponentialRampToValueAtTime(sweepTo, t + duration)
    }

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

    whiteNoise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    whiteNoise.start(t)
  }, [getCtx])

  // ════ SOUND BANK ════

  // Game Start: High fidelity boxing bell/start sound
  const playGameStart = useCallback(() => {
    const clone = audioRefs.current.gameStart.cloneNode()
    clone.volume = 1.0
    clone.play()
  }, [])

  // New Turn: High fidelity fast swoosh/transition
  const playNewTurn = useCallback(() => {
    const clone = audioRefs.current.newTurn.cloneNode()
    clone.volume = 0.5 // swooshes can be loud
    clone.play()
  }, [])

  // Correct: Classic satisfying "Ding!" (Pure high sine)
  const playCorrect = useCallback(() => {
    playOsc('sine', 1046.50, 0.4, 0.2) // C6
    setTimeout(() => playOsc('sine', 1318.51, 0.6, 0.2), 80) // E6
  }, [playOsc])

  // Wrong: Classic Game Show "Bzzzt" (Low square wave)
  const playWrong = useCallback(() => {
    playOsc('square', 150, 0.3, 0.15)
    setTimeout(() => playOsc('square', 150, 0.4, 0.15), 100)
  }, [playOsc])

  // Lose Life / Bomb Explodes: Huge bass drop + white noise explosion
  const playLoseLife = useCallback(() => {
    // Bass boom sweeping down
    playOsc('sine', 150, 0.8, 0.5, 40)
    // Explosion noise (lowpass sweeping down)
    playNoise(0.7, 0.6, 1000, 'lowpass', 100)
  }, [playOsc, playNoise])

  // Eliminated: Sad descending tones
  const playEliminated = useCallback(() => {
    const freqs = [392.00, 370.00, 349.23, 329.63] // G4, Gb4, F4, E4
    freqs.forEach((f, i) => {
      setTimeout(() => playOsc('square', f, 0.4, 0.1), i * 250)
    })
  }, [playOsc])

  // Winner: High fidelity victory fanfare/cheer (Max 3 seconds)
  const playWinner = useCallback(() => {
    const clone = audioRefs.current.winner.cloneNode()
    clone.volume = 1.0
    clone.play()

    // Start fading out at 2000ms and fully stop by 3000ms
    setTimeout(() => {
      const fadeAudio = setInterval(() => {
        if (clone.volume > 0.06) {
          clone.volume -= 0.05
        } else {
          clearInterval(fadeAudio)
          clone.pause()
          clone.currentTime = 0
        }
      }, 50)
    }, 2000)
  }, [])

  // Countdown Tick: A physical "tick" like a snare/rimshot
  const playCountdownTick = useCallback((sec) => {
    // Short burst of high-passed noise (like a mechanical clock)
    playNoise(0.05, 0.3, 3000, 'highpass')
    
    // Add urgency if low time
    if (sec <= 3) {
      setTimeout(() => playNoise(0.05, 0.15, 4000, 'highpass'), 150)
    }
  }, [playNoise])

  // Life Gained: 1UP sound (Fast rising trill)
  const playLifeGain = useCallback(() => {
    playOsc('square', 880, 0.1, 0.1)
    setTimeout(() => playOsc('square', 987, 0.1, 0.1), 80)
    setTimeout(() => playOsc('square', 1108, 0.1, 0.1), 160)
    setTimeout(() => playOsc('square', 1318, 0.1, 0.1), 240)
    setTimeout(() => playOsc('square', 1760, 0.4, 0.1), 320)
  }, [playOsc])

  return {
    playGameStart,
    playNewTurn,
    playCorrect,
    playWrong,
    playLoseLife,
    playEliminated,
    playWinner,
    playCountdownTick,
    playLifeGain,
  }
}
