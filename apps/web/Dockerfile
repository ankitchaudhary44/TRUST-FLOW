FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm install --workspace=apps/web

COPY apps/web ./apps/web

RUN cd apps/web && npm run build

EXPOSE 3000
CMD ["npm", "start", "--workspace=apps/web"]
