# Langkah-langkah perbaikan:

# 1. Generate package-lock.json
npm install

# 2. Perbaiki semua Dockerfile
for f in docker/Dockerfile.*; do
  sed -i 's/npm ci --only=production/npm install --omit=dev/g' "$f"
done

# 3. Build ulang
docker-compose -f docker/docker-compose-all.yml build

# 4. Jalankan
docker-compose -f docker/docker-compose-all.yml up -d
