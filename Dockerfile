FROM node:22-alpine AS base
WORKDIR /app

FROM base AS dependencies
ARG DATABASE_URL=postgresql://arcade:arcade@localhost:5432/arcade?schema=public
ENV DATABASE_URL=$DATABASE_URL
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ARG DATABASE_URL=postgresql://arcade:arcade@localhost:5432/arcade?schema=public
ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_SECRET=build-only-secret-do-not-use-at-runtime
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run db:generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
