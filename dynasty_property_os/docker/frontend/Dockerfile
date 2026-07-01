FROM node:22-slim
WORKDIR /app
COPY frontend/package.json /app/package.json
RUN npm install
COPY frontend /app
CMD ["npm", "run", "dev"]
