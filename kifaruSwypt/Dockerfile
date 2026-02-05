# Use slim Node.js base image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Expose port your backend listens on (e.g., 5000 or 8080)
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
