// Import Vite's config helper function
import { defineConfig } from 'vite'
// Import the React plugin — tells Vite "this is a React project"
import react from '@vitejs/plugin-react'
// Import the Tailwind CSS plugin — lets us use Tailwind for styling
import tailwindcss from '@tailwindcss/vite'

// Export our config so Vite knows how to run our project
export default defineConfig({
  // Plugins are like "add-ons" that give Vite extra powers
  plugins: [
    react(),        // Add-on #1: Understand React code
    tailwindcss(),  // Add-on #2: Process Tailwind CSS classes
  ],
})
