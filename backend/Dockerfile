# Backend Dockerfile (Node 18)
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install production dependencies only by default (you can change to include dev for dev)
COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --production

# Copy source
COPY . .

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "server.js"]
