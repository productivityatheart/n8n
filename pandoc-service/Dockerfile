FROM node:18-alpine

# Install pandoc
RUN apk update && apk add --no-cache pandoc

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install express multer

# Copy server file
COPY server.js .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]