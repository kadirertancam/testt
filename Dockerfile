# syntax=docker/dockerfile:1

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm install --global netlify-cli

COPY . .

EXPOSE 8888

CMD ["netlify", "dev", "--port", "8888", "--host", "0.0.0.0"]
