FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "src/app.js"]
