# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖文件
COPY package.json ./
RUN npm install

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 安装后端依赖
COPY backend/package.json ./backend/
RUN cd backend && npm install --production

# 复制后端代码
COPY backend/src ./backend/src

# 复制前端构建产物
COPY --from=builder /app/dist ./frontend/dist

# 创建数据目录
RUN mkdir -p /app/data

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/planner.db
ENV JWT_SECRET=planner-secret-key-change-me

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

WORKDIR /app/backend
CMD ["node", "src/server.js"]
