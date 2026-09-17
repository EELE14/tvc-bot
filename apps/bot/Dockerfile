FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY apps/bot/package.json apps/bot/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY . .
ENV DATABASE_URL=postgresql://build:build@build:5432/build
RUN npm run db:generate && npm prune --omit=dev

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
CMD ["bun", "run", "apps/bot/src/index.ts"]
