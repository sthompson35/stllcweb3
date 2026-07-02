# ─────────────────────────────────────────────────────────────────────────────
# stllcweb3 — Multi-stage Dockerfile
# Primary runtime: Alchemy webhook server (port 4041)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install production dependencies ──────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Root package (Hardhat / OpenZeppelin — needed at runtime for ABIs)
# --ignore-scripts: skip the `prepare` hook (hardhat not present in prod deps)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Alchemy webhook-server dependencies
COPY alchemy/package.json alchemy/package-lock.json* ./alchemy/
RUN cd alchemy && npm install --omit=dev --ignore-scripts

# ── Stage 2: Compile Solidity contracts ───────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install ALL deps (devDeps required for hardhat compile)
# --ignore-scripts: we control when compile runs
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY hardhat.config.js ./
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/

# Compile contracts & copy ABI artifacts
RUN npx hardhat compile && node scripts/copy-artifacts.js

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN apk add --no-cache tini

WORKDIR /app

# Production node_modules
COPY --from=deps /app/node_modules         ./node_modules
COPY --from=deps /app/alchemy/node_modules ./alchemy/node_modules

# Compiled contract artifacts
COPY --from=builder /app/artifacts ./artifacts
COPY --from=builder /app/cache     ./cache

# Application source
COPY alchemy/    ./alchemy/
COPY contracts/  ./contracts/
COPY scripts/    ./scripts/
COPY hardhat.config.js package.json ./

ENV NODE_ENV=production
ENV WEBHOOK_PORT=4041

EXPOSE 4041

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "alchemy/webhook-server.js"]
