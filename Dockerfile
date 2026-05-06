# Dockerfile di root directory
FROM node:18-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    libxshmfence1 \
    libgtk-3-0 \
        wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*


# Copy package files
COPY package*.json ./

# Install dependencies (ubah dari npm ci ke npm install)
RUN npm install --omit=dev

# Copy source code
COPY . .

# Install Playwright
RUN npx playwright install chromium --with-deps

# Create directories
RUN mkdir -p output logs screenshots tokens

ENV PORT=3000
ENV HEADLESS=true

EXPOSE 3000 3001 3002 3003 3004 3005

CMD ["node", "api/server.js"]
