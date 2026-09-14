FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install --workspace=apps/api

# Copy source and prisma
COPY apps/api ./apps/api
COPY prisma ./prisma

# Generate Prisma client and build
RUN npx prisma generate
RUN cd apps/api && npm run build

EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
