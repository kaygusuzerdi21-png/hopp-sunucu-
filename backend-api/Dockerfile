FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

RUN echo "cachebust-20260606"
COPY . .

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "src/index.js"]
