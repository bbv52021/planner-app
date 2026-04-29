const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();
router.use(authMiddleware);

// 获取项目列表（支持筛选和分页）
router.get('/', (req, res) => {
  try {
    const { category_id, status, priority, search, page = 1, limit = 50 } = req.query;
    const db = getDb();
    let where = 'WHERE user_id = ?';
    const params = [req.userId];

    if (category_id) {
      where += ' AND category_id = ?';
      params.push(category_id);
    }
    if (status !== undefined && status !== '') {
      where += ' AND status = ?';
      params.push(status);
    }
    if (priority !== undefined && priority !== '') {
      where += ' AND priority = ?';
      params.push(priority);
    }
    if (search) {
      where += ' AND (name LIKE ? OR detail LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const offset = (page - 1) * limit;
    const projects = db.prepare(
      `SELECT p.*, c.name as category_name, c.color as category_color
       FROM projects p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY p.priority DESC, p.start_date ASC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM projects ${where}`).get(...params).count;

    res.json({ projects, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('获取项目错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取项目统计
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as not_started,
        AVG(progress) as avg_progress
      FROM projects WHERE user_id = ?
    `).get(req.userId);

    const monthlyStats = db.prepare(`
      SELECT
        strftime('%Y-%m', start_date) as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as completed
      FROM projects WHERE user_id = ?
      GROUP BY strftime('%Y-%m', start_date)
      ORDER BY month DESC
      LIMIT 12
    `).all(req.userId);

    res.json({ stats, monthlyStats });
  } catch (err) {
    console.error('获取统计错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取日期范围内的项目（用于甘特图）
router.get('/gantt', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: '请指定日期范围' });
    }
    const db = getDb();
    const projects = db.prepare(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = ?
        AND p.start_date <= ?
        AND (p.end_date IS NULL OR p.end_date >= ? OR p.end_date = '')
      ORDER BY p.priority DESC, p.start_date ASC
    `).all(req.userId, end_date, start_date);

    res.json({ projects });
  } catch (err) {
    console.error('获取甘特图数据错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个项目
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.user_id = ?
    `).get(req.params.id, req.userId);

    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    // 获取项目日志
    const logs = db.prepare(
      'SELECT * FROM daily_logs WHERE project_id = ? ORDER BY log_date DESC'
    ).all(req.params.id);

    res.json({ project, logs });
  } catch (err) {
    console.error('获取项目详情错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建项目
router.post('/', (req, res) => {
  try {
    const { name, detail, start_date, end_date, progress, priority, status, color, category_id } = req.body;
    if (!name || !start_date) {
      return res.status(400).json({ error: '项目名称和开始日期不能为空' });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO projects (user_id, category_id, name, detail, start_date, end_date, progress, priority, status, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      category_id || null,
      name,
      detail || '',
      start_date,
      end_date || null,
      progress || 0,
      priority || 0,
      status !== undefined ? status : 0,
      color || '#4CAF50'
    );

    const project = db.prepare(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.json({ project });
  } catch (err) {
    console.error('创建项目错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新项目
router.put('/:id', (req, res) => {
  try {
    const { name, detail, start_date, end_date, progress, priority, status, color, category_id } = req.body;
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(
      req.params.id, req.userId
    );
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    db.prepare(`
      UPDATE projects SET
        category_id = ?, name = ?, detail = ?, start_date = ?, end_date = ?,
        progress = ?, priority = ?, status = ?, color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      category_id !== undefined ? category_id : project.category_id,
      name || project.name,
      detail !== undefined ? detail : project.detail,
      start_date || project.start_date,
      end_date !== undefined ? end_date : project.end_date,
      progress !== undefined ? progress : project.progress,
      priority !== undefined ? priority : project.priority,
      status !== undefined ? status : project.status,
      color || project.color,
      req.params.id, req.userId
    );

    const updated = db.prepare(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    res.json({ project: updated });
  } catch (err) {
    console.error('更新项目错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除项目
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(
      req.params.id, req.userId
    );
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除项目错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
