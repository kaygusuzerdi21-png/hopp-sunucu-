// src/controllers/matchController.js
// hopp · Eşleşme. Beğeni/geç kaydeder, karşılıklıysa eşleşme yaratır.
const pool = require('../db');

const PUBLIC = `id, name, age, gender, bio, job, city, tags, photos, verified,
                lat, lng, last_seen, created_at`;

// iki kullanıcı id'sini her zaman aynı sırada tut (a < b) → tekrarsız eşleşme
function ordered(x, y) { return x < y ? [x, y] : [y, x]; }

// POST /api/match/swipe  { toUser, action }
async function swipe(req, res, next) {
  const me = req.user.id;
  const { toUser, action } = req.body || {};
  if (!toUser || !action) return res.status(400).json({ error: 'toUser ve action gerekli' });
  if (toUser === me) return res.status(400).json({ error: 'Kendine işlem yapılamaz' });
  try {
    // beğeniyi kaydet (aynı kişiye tekrar olduysa güncelle)
    await pool.query(
      `INSERT INTO swipes (from_user, to_user, action) VALUES ($1,$2,$3)
       ON CONFLICT (from_user, to_user) DO UPDATE SET action = EXCLUDED.action, created_at = NOW()`,
      [me, toUser, action]);

    let matched = false;
    if (action === 'like' || action === 'superlike') {
      // karşı taraf beni beğenmiş mi?
      const back = await pool.query(
        `SELECT 1 FROM swipes WHERE from_user=$1 AND to_user=$2 AND action IN ('like','superlike')`,
        [toUser, me]);
      if (back.rows.length) {
        const [a, b] = ordered(me, toUser);
        await pool.query(
          `INSERT INTO matches (user_a, user_b) VALUES ($1,$2)
           ON CONFLICT (user_a, user_b) DO NOTHING`, [a, b]);
        matched = true;
      }
    }
    res.json({ match: matched });
  } catch (err) { next(err); }
}

// GET /api/match/list → eşleştiğim kişiler
async function list(req, res, next) {
  const me = req.user.id;
  try {
    const r = await pool.query(
      `SELECT ${PUBLIC.split(',').map(c => 'u.' + c.trim()).join(', ')}, m.created_at AS matched_at
       FROM matches m
       JOIN users u ON u.id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
       WHERE m.user_a = $1 OR m.user_b = $1
       ORDER BY m.created_at DESC`, [me]);
    res.json({ data: r.rows });
  } catch (err) { next(err); }
}

// GET /api/match/likes → beni beğenenler (henüz ben karar vermeden)
async function likesMe(req, res, next) {
  const me = req.user.id;
  try {
    const r = await pool.query(
      `SELECT ${PUBLIC.split(',').map(c => 'u.' + c.trim()).join(', ')}
       FROM swipes s
       JOIN users u ON u.id = s.from_user
       WHERE s.to_user = $1 AND s.action IN ('like','superlike')
         AND NOT EXISTS (SELECT 1 FROM swipes me WHERE me.from_user = $1 AND me.to_user = s.from_user)
       ORDER BY s.created_at DESC`, [me]);
    res.json({ data: r.rows });
  } catch (err) { next(err); }
}

module.exports = { swipe, list, likesMe };
