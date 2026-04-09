# 微信云托管 / 任意容器平台：Node 20 + Express
# 平台会注入 PORT，须与监听端口一致（本服务默认读 process.env.PORT）
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p data

ENV NODE_ENV=production
# 与微信云托管等平台的容器端口/健康检查（常见为 80）一致；本地可用 -e PORT=3000 覆盖
ENV PORT=80
EXPOSE 80

CMD ["node", "src/index.js"]
