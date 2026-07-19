# Build static site, then serve with nginx (Cloud Run: PORT=8080)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN mkdir -p /etc/nginx/snippets
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# nginx (non-root) must read static files; macOS copies can be mode 600
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
