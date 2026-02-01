# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY public ./public
RUN mkdir -p logs

# Expose port
EXPOSE 3000
CMD ["node", "dist/app.js"]

