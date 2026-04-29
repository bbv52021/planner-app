# 📋 工作生活备忘录 (Planner App)

一个功能完整的工作/生活备忘录应用，支持项目计划管理、甘特图进度跟踪、每日计划、日历视图等功能。可部署在群晖Docker中，PC端浏览器和手机端均可访问。

## ✨ 功能特性

- **📊 甘特图视图** - 类似Excel表格的时间线视图，一目了然查看项目进度
- **📁 项目管理** - 创建、编辑、删除项目，设置分类、优先级、颜色
- **📅 日历视图** - 月视图和年视图，快速查看项目分布
- **📝 每日计划** - 每天的待办事项管理
- **📊 工作日志** - 记录每天的工作内容和进度
- **👤 多用户** - 支持用户注册登录，各自管理自己的计划
- **📱 移动端适配** - 响应式设计，手机浏览器直接使用
- **🐳 Docker部署** - 一键Docker部署，适合群晖NAS

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Element Plus + Pinia + Vue Router |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 部署 | Docker + docker-compose |

## 🚀 快速开始

### 方式一：直接拉取镜像部署（最简单，推荐）

无需克隆代码，直接拉取预构建的 Docker 镜像：

1. **创建 docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     planner:
       image: ghcr.io/bbv52021/planner-app:latest
       container_name: planner-app
       restart: unless-stopped
       ports:
         - "3080:3000"
       volumes:
         - ./data:/app/data
       environment:
         - NODE_ENV=production
         - JWT_SECRET=your-secret-key-please-change-this
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

3. **访问应用**
   - PC端：浏览器打开 `http://你的服务器IP:3080`
   - 手机端：手机浏览器打开相同地址，可添加到主屏幕

> 💡 镜像支持 `linux/amd64` 和 `linux/arm64` 架构，群晖NAS可直接使用。

### 方式二：从源码构建部署

1. **克隆项目**
   ```bash
   git clone https://github.com/bbv52021/planner-app.git
   cd planner-app
   ```

2. **修改配置**
   编辑 `docker-compose.yml`，修改 `JWT_SECRET` 为你自己的密钥：
   ```yaml
   environment:
     - JWT_SECRET=your-own-secret-key-here
   ```

3. **构建并启动**
   ```bash
   docker-compose up -d --build
   ```

### 方式三：本地开发

1. **安装依赖**
   ```bash
   # 后端
   cd backend
   npm install

   # 前端
   cd ../frontend
   npm install
   ```

2. **启动后端**
   ```bash
   cd backend
   npm run dev
   ```

3. **启动前端**
   ```bash
   cd frontend
   npm run dev
   ```

4. **访问** `http://localhost:5173`

### 群晖NAS部署步骤

1. 打开群晖 **Container Manager (Docker)**
2. 进入 **项目** → **创建**
3. 选择项目文件夹，创建 `docker-compose.yml`（内容见方式一）
4. 或者通过 **SSH** 登录群晖：
   ```bash
   cd /volume1/docker/planner
   # 创建 docker-compose.yml 文件
   docker-compose up -d
   ```
5. 在群晖防火墙中放行 3080 端口
6. 浏览器访问 `http://群晖IP:3080`

## 📱 手机端使用

1. 手机浏览器打开应用地址
2. 使用浏览器"添加到主屏幕"功能
3. 即可像APP一样全屏使用

## 🔑 默认账户

- 用户名：`admin`
- 密码：`admin123`

> ⚠️ 首次登录后请立即修改密码！

## 📂 数据备份

数据存储在 `./data/planner.db` 文件中，备份只需复制此文件即可。

## 🐳 Docker 镜像

镜像自动构建并发布到 GitHub Container Registry：

```bash
# 拉取最新镜像
docker pull ghcr.io/bbv52021/planner-app:latest
```

## 📄 License

MIT License
