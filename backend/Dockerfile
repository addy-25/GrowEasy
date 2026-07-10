# ---- build stage: install everything, compile TS -> dist ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# drop dev-only packages (typescript, vitest, tsx...) from node_modules
RUN npm prune --omit=dev

# ---- runtime stage: only compiled JS + production deps ----
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
