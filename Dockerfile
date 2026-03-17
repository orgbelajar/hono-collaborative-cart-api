# https://hono.dev/docs/getting-started/bun
FROM oven/bun:latest AS build

WORKDIR /app

COPY package.json bun.lock prisma ./

RUN bun install

COPY . .

# Generate prisma client
RUN bunx prisma generate

# Final image
FROM oven/bun:latest

WORKDIR /app

# Copy dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Copy source code and generated types
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/generated ./generated

COPY --from=build /app/bun.lock ./bun.lock
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

USER bun

EXPOSE 3000

CMD ["bun", "run", "start:dev"]
