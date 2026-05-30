const pool = require('../db');

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM items WHERE user_id = $1';
    const params = [req.user.id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM items WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, data } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Başlık gerekli' });
    }

    const result = await pool.query(
      'INSERT INTO items (user_id, title, description, data) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, description || null, data ? JSON.stringify(data) : '{}']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { title, description, data } = req.body;

    const existing = await pool.query(
      'SELECT id FROM items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    const result = await pool.query(
      `UPDATE items SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        data = COALESCE($3, data),
        updated_at = NOW()
      WHERE id = $4 AND user_id = $5 RETURNING *`,
      [title || null, description || null, data ? JSON.stringify(data) : null, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    res.json({ message: 'Silindi' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
