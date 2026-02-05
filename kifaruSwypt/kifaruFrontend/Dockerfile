
# Use official Node.js image
FROM node:22

# FROM node:22-slim best to avoid copying everything

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build Next.js app
RUN npm run build

# Expose frontend port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
