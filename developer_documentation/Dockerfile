# Multi-stage build for Docusaurus documentation

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy documentation source files
COPY . .

# Build documentation
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Install serve to host static files
RUN npm install -g serve

# Copy built documentation from builder
COPY --from=builder /app/build /app/build

# Expose port (Cloud Run uses PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["serve", "-s", "build", "-l", "8080"]

