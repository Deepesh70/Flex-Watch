# Multi-stage Dockerfile for Flex-Watch Frontend SPA
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build production bundle
RUN npm run build

# Production Nginx stage
FROM nginx:alpine AS runner

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
