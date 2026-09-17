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
ENV DISCORD_CLIENT_ID=build
ENV DISCORD_CLIENT_SECRET=build
ENV AUTH_SECRET=build
RUN npm run db:generate \
 && npm run web:build \
 && rm -rf apps/web/.next/cache \
 && npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "npm run deploy --workspace @tvc/db && npm run start --workspace @tvc/web"]
