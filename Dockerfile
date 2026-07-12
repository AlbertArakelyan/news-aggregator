# syntax=docker/dockerfile:1

# Package manager is yarn (classic, v1). Never npm — it would ignore yarn.lock.

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies only when package.json / yarn.lock change.
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Hot-reload dev server. Compose bind-mounts the source over /app, so the
# COPY here only seeds the image for a bare `docker run`.
# `next dev` already binds 0.0.0.0 by default, so no -H flag is needed.
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
# The image's built-in `node` user is uid 1000, matching a typical Linux host
# user, so anything written back through the bind mount is owned by the host
# user rather than root. .next must exist and be owned here: the anonymous
# volume compose mounts over it inherits this ownership at creation.
RUN mkdir -p /app/.next && chown node:node /app /app/.next
USER node
EXPOSE 3000
CMD ["yarn", "dev"]

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Runtime: only the standalone server, its traced deps, and static assets.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
