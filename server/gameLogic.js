// ============================
// AlphaRush Game Logic Module
// ============================
// This file contains all the game rules, separated from the server networking code
// Having game logic in its own file keeps things organized

// Load 274,937 English words from the dictionary package
const wordList = require("an-array-of-english-words")
const defaults = require("./defaults")
const fs = require("fs")
const path = require("path")

// Convert the array into a "Set" for FAST lookups
// Checking if a word exists in an Array: slow (checks one by one)
// Checking if a word exists in a Set: instant (uses a hash table)
const dictionary = new Set(wordList)

// --- SYLLABLES ---
// ==========================================
// PURE PHONETIC JKLM BOMBPARTY GENERATOR
// ==========================================
// After extensive tuning, algorithmic substring extraction from dictionaries
// (even common ones) inevitably generates consonant noise (e.g. `TP` from `output`).
// JKLM players expect phonetic syllables consisting of vowels and digraphs.
// We load exactly this list from a static JSON.

const jklmSyllables = require("./jklmSyllables.json")
console.log(`✅ Loaded ${jklmSyllables.length} purely curated phonetic JKLM syllables.`)

function getRandomSyllable() {
  return jklmSyllables[Math.floor(Math.random() * jklmSyllables.length)]
}

// Check if a word is valid:
// 1. It must be a real English word (in our dictionary)
// 2. It must contain the required syllable
// 3. It must be at least 3 letters long
function validateWord(word, syllable) {
  const lowerWord = word.toLowerCase()
  const upperWord = word.toUpperCase()

  // Check minimum length
  if (lowerWord.length < defaults.MIN_WORD_LENGTH) {
    return { valid: false, reason: `Word must be at least ${defaults.MIN_WORD_LENGTH} letters!` }
  }

  // Check if it contains the syllable
  if (!upperWord.includes(syllable)) {
    return { valid: false, reason: `Word must contain "${syllable}"!` }
  }

  // Check if it's a real English word
  if (!dictionary.has(lowerWord)) {
    return { valid: false, reason: `"${upperWord}" is not a real word!` }
  }

  // All checks passed!
  return { valid: true, reason: "Correct!" }
}

// Export the functions so server/index.js can use them
module.exports = { getRandomSyllable, validateWord }
