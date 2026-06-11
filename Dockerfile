# Use Node.js 20 base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Set environment variables (optional, can be passed at runtime)
ENV PORT=8000
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["npm", "start"]
