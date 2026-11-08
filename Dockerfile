# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- build (ใช้เป็น image สำหรับ migrate/seed ด้วย) ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma.config.ts เรียก env("DATABASE_URL") ตอน generate จึงใส่ค่าหลอกไว้ (ไม่ได้ต่อ DB จริง)
# ตอนรัน container ค่าจาก .env.production จะทับค่านี้
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
# เรียก next build ตรงๆ เพื่อข้าม prebuild (prettier --write) และ lint
RUN npx prisma generate && npx next build

# ---------- runtime ----------
FROM base AS runner
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# export-excel อ่าน template จาก process.cwd()/templates
COPY --from=build --chown=node:node /app/templates ./templates
USER node
EXPOSE 3000
CMD ["node", "server.js"]
