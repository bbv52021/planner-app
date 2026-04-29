const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();
router.use(authMiddleware);

// 获取指定日期的日志
router.get('/', (req, res) => {
  try {
    const { date, project_id } = req.query;
    const db = getDb();
    let logs;

    if (date && project_id) {
      logs = db.prepare(
        'SELECT * FROM daily_logs WHERE user_id = ? AND log_date = ? AND project_id = ?'
      ).get(req.userId, date, project_id);
      return res.json({ log: logs });
    }

    if (date) {
      logs = db.prepare(
        `SELECT dl.*, p.name as project_name, p.color as project_color
         FROM daily_logs dl
         LEFT JOIN projects p ON dl.project_id = p.id
         WHERE dl.user_id = ? AND dl.log_date = ?
         ORDER BY dl.created_at DESC`
      ).all(req.userId, date);
      return res.json({ logs });
    }

    if (project_id) {
      logs = db.prepare(
        'SELECT * FROM daily_logs WHERE user_id = ? AND project_id = ? ORDER BY log_date DESC'
      ).all(req.userId, project_id);
      return res.json({ logs });
    }

    // 获取日期范围内的日志
    const { start_date, end_date } = req.query;
    if (start_date && end_date) {
      logs = db.prepare(
        `SELECT dl.*, p.name as project_name, p.color as project_color
         FROM daily_logs dl
         LEFT JOIN projects p ON dl.project_id = p.id
         WHERE dl.user_id = ? AND dl.log_date BETWEEN ? AND ?
         ORDER BY dl.log_date DESC, dl.created_at DESC`
      ).all(req.userId, start_date, end_date);
      return res.json({ logs });
    }

    res.json({ logs: [] });
  } catch (err) {
    console.error('获取日志错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建或更新日志（同一天同一项目只有一条）
router.post('/', (req, res) => {
  try {
    const { project_id, log_date, content, progress } = req.body;
    if (!log_date) {
      return res.status(400).json({ error: '日期不能为空' });
    }

    const db = getDb();
    const existing = db.prepare(
      'SELECT * FROM daily_logs WHERE user_id = ? AND project_id = ? AND log_date = ?'
    ).get(req.userId, project_id, log_date);

    let result;
    if (existing) {
      result = db.prepare(
        'UPDATE daily_logs SET content = ?, progress = ? WHERE id = ?'
      ).run(content || '', progress || 0, existing.id);
    } else {
      result = db.prepare(
        'INSERT INTO daily_logs (user_id, project_id, log_date, content, progress) VALUES (?, ?, ?, ?, ?)'
      ).run(req.userId, project_id || null, log_date, content || '', progress || 0);
    }

    res.json({ message: '保存成功' });
  } catch (err) {
    console.error('保存日志错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除日志
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM daily_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除日志错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
