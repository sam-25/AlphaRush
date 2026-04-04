// This file creates ONE single socket connection that the entire app shares
// We put it in its own file so any component can import and use it

// "io" is the function from socket.io-client that creates a connection
import { io } from "socket.io-client"

// In development: connect to localhost:3001 (our local server)
// In production (Docker): connect to the same server that served this page
const SERVER_URL = import.meta.env.DEV ? "http://localhost:3001" : undefined
const socket = io(SERVER_URL)

// Export it so any component can import and use this SAME connection
export default socket
