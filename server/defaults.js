// ============================
// AlphaRush Default Settings
// ============================
// Centralized defaults (macros) for clean code and easy adjustments

module.exports = {
  // --- Game Settings ---
  DEFAULT_LIVES: 3,
  DEFAULT_TIMER: 10,

  MIN_LIVES: 1,
  MAX_LIVES: 10,
  
  MIN_TIMER: 3,
  MAX_TIMER: 60,

  // --- Room Configuration ---
  ROOM_CODE_LENGTH: 4,
  // Use the PORT from the hosting platform if available, otherwise default to 3001
  PORT: process.env.PORT || 3001,

  // --- Room Statuses ---
  STATUS_WAITING: "waiting",
  STATUS_PLAYING: "playing",

  // --- Game Rules ---
  MIN_WORD_LENGTH: 2
}
