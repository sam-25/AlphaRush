# ============================================================
# STAGE 1: "client-builder" — Build the React UI
# ============================================================
# This is Workbench 1. We use it ONLY to build the client.
# After we grab the built files, this entire stage is thrown away.
# "AS client-builder" gives this stage a name so we can refer to it later.
FROM node:20-alpine AS client-builder

# Create a folder /app/client inside this stage and work from there
WORKDIR /app/client

# Copy ONLY the client's package.json and package-lock.json first
# (We copy these separately so Docker can cache the npm install step.
#  If your package.json hasn't changed, Docker skips re-installing — saves time!)
COPY client/package*.json ./

# Install the client's dependencies (react, vite, tailwind, socket.io-client, etc.)
RUN npm install

# Now copy the rest of the client source code (App.jsx, components, etc.)
COPY client/ .

# Build the React app — this runs "vite build" which converts your .jsx files
# into plain HTML, CSS, and JS files inside a folder called "dist/"
# These are the final files a browser can understand directly.
RUN npm run build


# ============================================================
# STAGE 2: The actual final image — Set up the server
# ============================================================
# This is the image that will actually run on the internet.
# It only contains the server code and the pre-built client files.
FROM node:20-alpine

# Create a folder /app inside this image and work from there
WORKDIR /app

# Copy ONLY the server's package.json and package-lock.json
COPY server/package*.json ./

# Install the server's dependencies (express, socket.io, etc.)
# We use --omit=dev to skip devDependencies like nodemon
# (nodemon is only useful during development, not in production)
RUN npm install --omit=dev

# Copy all the server source code (index.js, gameLogic.js, defaults.js, etc.)
COPY server/ .

# HERE'S THE KEY STEP: Grab the built client files from Stage 1 (Workbench 1)
# --from=client-builder means "reach back into the client-builder stage"
# and copy the /app/client/dist folder into a folder called "public" here.
# So now the server has a "public/" folder containing the finished game UI.
COPY --from=client-builder /app/client/dist ./public

# Tell Docker that our server uses port 3001 (from your defaults.js: PORT: 3001)
EXPOSE 3001

# When the container starts, run "node index.js" to start the AlphaRush server
CMD ["node", "index.js"]
