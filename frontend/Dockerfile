# Build Angular app
FROM node:20 AS build
WORKDIR /app
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build -- --configuration production

# Serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
