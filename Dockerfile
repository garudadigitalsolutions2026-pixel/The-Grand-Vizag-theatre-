FROM node:20-slim

WORKDIR /app

# Install dependencies (including devDeps for tsx and build tools)
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run server with tsx (TypeScript execution)
CMD ["npx", "tsx", "server.ts"]
