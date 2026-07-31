FROM node:20 AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY db/package.json db/
COPY game-server/package.json game-server/

RUN npm install

COPY shared shared
COPY db db
COPY game-server game-server

RUN npm run build --workspace=shared
RUN npm run build --workspace=db
RUN npm run build --workspace=game-server

FROM node:20-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY db/package.json db/
COPY game-server/package.json game-server/

RUN npm install --omit=dev

COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/db/dist db/dist
COPY --from=builder /app/game-server/dist game-server/dist

WORKDIR /app/game-server
CMD ["node", "dist/server.js"]
