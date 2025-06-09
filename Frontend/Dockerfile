# Build Angular app
FROM node:20 AS build
WORKDIR /app
ARG GOOGLE_MAPS_API_KEY
ARG API_URL
ENV GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
ENV API_URL=${API_URL}
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build -- --configuration production

# Serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
