# Use the official Node.js LTS image
FROM node:20-bullseye

# Install OpenSSL for Prisma compatibility
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files and prisma schema first for dependency install and prisma generate
COPY package*.json ./
COPY prisma ./prisma

RUN npm install --frozen-lockfile || npm install

# Generate Prisma Client for the container's architecture
RUN npx prisma generate

# Now copy the rest of the source code
COPY . .

RUN if [ -f tsconfig.json ]; then npm run build || true; fi

EXPOSE 3000

CMD ["npm", "run", "start"]
