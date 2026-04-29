const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有分类
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY sort_order, id'
    ).all(req.userId);
    res.json({ categories });
  } catch (err) {
    console.error('获取分类错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建分类
router.post('/', (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ error: '分类名称不能为空' });
    }
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)'
    ).run(req.userId, name, color || '#0066CC', icon || '📁');

    res.json({
      category: {
        id: result.lastInsertRowid,
        user_id: req.userId,
        name,
        color: color || '#0066CC',
        icon: icon || '📁'
      }
    });
  } catch (err) {
    console.error('创建分类错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新分类
router.put('/:id', (req, res) => {
  try {
    const { name, color, icon, sort_order } = req.body;
    const db = getDb();
    const category = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(
      req.params.id, req.userId
    );
    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    db.prepare(
      'UPDATE categories SET name = ?, color = ?, icon = ?, sort_order = ? WHERE id = ? AND user_id = ?'
    ).run(
      name || category.name,
      color || category.color,
      icon || category.icon,
      sort_order !== undefined ? sort_order : category.sort_order,
      req.params.id, req.userId
    );
    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新分类错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除分类
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const category = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(
      req.params.id, req.userId
    );
    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }
    db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除分类错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
