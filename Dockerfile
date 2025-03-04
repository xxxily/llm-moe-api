FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制 Prisma 配置
COPY prisma ./prisma/

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制前端应用程序
COPY web ./web/

# 安装前端依赖并构建
RUN cd web && npm install && npm run build

# 复制其余源代码
COPY src ./src/
COPY views ./views/
COPY public ./public/

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动命令
CMD ["npm", "start"]