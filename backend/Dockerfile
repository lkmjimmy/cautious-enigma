# 微信云托管 / 任意容器平台：Node 20 + Express
# 平台会注入 PORT，须与监听端口一致（本服务默认读 process.env.PORT）
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p data

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
