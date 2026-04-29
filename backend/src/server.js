const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const categoryRoutes = require('./routes/categories');
const dailyLogRoutes = require('./routes/dailyLogs');
const dailyPlanRoutes = require('./routes/dailyPlans');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 静态文件（前端构建产物）
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/daily-plans', dailyPlanRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA fallback - 所有非API请求返回index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  } else {
    res.status(404).json({ error: 'API not found' });
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 工作生活备忘录服务已启动`);
  console.log(`📍 地址: http://0.0.0.0:${PORT}`);
  console.log(`📅 时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app;
