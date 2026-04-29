const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();
router.use(authMiddleware);

// 获取指定日期的计划
router.get('/', (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: '请指定日期' });
    }

    const db = getDb();
    const plans = db.prepare(
      'SELECT * FROM daily_plans WHERE user_id = ? AND plan_date = ? ORDER BY sort_order, id'
    ).all(req.userId, date);

    res.json({ plans });
  } catch (err) {
    console.error('获取计划错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取日期范围内的计划
router.get('/range', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: '请指定日期范围' });
    }

    const db = getDb();
    const plans = db.prepare(
      'SELECT * FROM daily_plans WHERE user_id = ? AND plan_date BETWEEN ? AND ? ORDER BY plan_date, sort_order, id'
    ).all(req.userId, start_date, end_date);

    res.json({ plans });
  } catch (err) {
    console.error('获取计划范围错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建计划
router.post('/', (req, res) => {
  try {
    const { plan_date, content, sort_order } = req.body;
    if (!plan_date || !content) {
      return res.status(400).json({ error: '日期和内容不能为空' });
    }

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO daily_plans (user_id, plan_date, content, sort_order) VALUES (?, ?, ?, ?)'
    ).run(req.userId, plan_date, content, sort_order || 0);

    res.json({
      plan: {
        id: result.lastInsertRowid,
        user_id: req.userId,
        plan_date,
        content,
        completed: 0,
        sort_order: sort_order || 0
      }
    });
  } catch (err) {
    console.error('创建计划错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新计划
router.put('/:id', (req, res) => {
  try {
    const { content, completed, sort_order } = req.body;
    const db = getDb();
    const plan = db.prepare('SELECT * FROM daily_plans WHERE id = ? AND user_id = ?').get(
      req.params.id, req.userId
    );
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }

    db.prepare(
      'UPDATE daily_plans SET content = ?, completed = ?, sort_order = ? WHERE id = ? AND user_id = ?'
    ).run(
      content !== undefined ? content : plan.content,
      completed !== undefined ? completed : plan.completed,
      sort_order !== undefined ? sort_order : plan.sort_order,
      req.params.id, req.userId
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新计划错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除计划
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM daily_plans WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除计划错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
