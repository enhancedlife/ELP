# Next.js 16 — production image for yourenhancedlife.com
FROM node:20-alpine AS builder

WORKDIR /app

ARG BACKEND_URL=http://host.docker.internal:8000
ARG NEXT_PUBLIC_BACKEND_URL=https://yourenhancedlife.com
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
