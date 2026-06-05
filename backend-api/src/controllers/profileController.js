// src/controllers/profileController.js
// hopp · Profiller + Keşfet. Kullanıcının kendi profilini okur/günceller
// ve DİĞER kullanıcıları (keşfet akışı) döndürür.
const pool = require('../db');

// herkese açık profil sütunları (şifre vs. dışarıda kalır)
const PUBLIC = `id, name, age, gender, bio, job, city, tags, photos, verified,
                lat, lng, match_gender, age_min, age_max, last_seen, created_at`;

// kendi profilim (çapraz cihaz senkron için)
async function getMe(req, res, next) {
  try {
    const r = await pool.query(
      `SELECT ${PUBLIC}, email FROM users WHERE id = $1`, [req.user.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
}

// profilimi güncelle — sadece gönderilen alanlar değişir (COALESCE)
async function updateMe(req, res, next) {
  try {
    const b = req.body || {};
    const tags   = b.tags   !== undefined ? JSON.stringify(b.tags)   : null;
    const photos = b.photos !== undefined ? JSON.stringify(b.photos) : null;
    const r = await pool.query(
      `UPDATE users SET
        name         = COALESCE($1,  name),
        dob          = COALESCE($2,  dob),
        age          = COALESCE($3,  age),
        gender       = COALESCE($4,  gender),
        bio          = COALESCE($5,  bio),
        job          = COALESCE($6,  job),
        city         = COALESCE($7,  city),
        tags         = COALESCE($8::jsonb,  tags),
        photos       = COALESCE($9::jsonb,  photos),
        match_gender = COALESCE($10, match_gender),
        age_min      = COALESCE($11, age_min),
        age_max      = COALESCE($12, age_max),
        lat          = COALESCE($13, lat),
        lng          = COALESCE($14, lng),
        avatar_url   = COALESCE($15, avatar_url),
        last_seen    = NOW(),
        updated_at   = NOW()
       WHERE id = $16
       RETURNING ${PUBLIC}, email`,
      [b.name ?? null, b.dob ?? null, b.age ?? null, b.gender ?? null,
       b.bio ?? null, b.job ?? null, b.city ?? null, tags, photos,
       b.matchGender ?? b.match_gender ?? null,
       b.ageMin ?? b.age_min ?? null, b.ageMax ?? b.age_max ?? null,
       b.lat ?? null, b.lng ?? null, b.avatar_url ?? null, req.user.id]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
}

// keşfet akışı — benden başka, aktif kullanıcılar. Tercihlerime göre süzülür.
async function discover(req, res, next) {
  try {
    const meR = await pool.query(
      'SELECT gender, match_gender, age_min, age_max FROM users WHERE id = $1',
      [req.user.id]);
    const me = meR.rows[0] || {};
    const params = [req.user.id];
    let q = `SELECT ${PUBLIC} FROM users
             WHERE id <> $1 AND is_active = true
               AND photos IS NOT NULL AND jsonb_array_length(photos) > 0`;

    // cinsiyet tercihi (all = herkes)
    if (me.match_gender && me.match_gender !== 'all') {
      params.push(me.match_gender);
      q += ` AND gender = $${params.length}`;
    }
    // yaş aralığı (yaş bilinmeyenleri de göster)
    if (me.age_min) { params.push(me.age_min); q += ` AND (age IS NULL OR age >= $${params.length})`; }
    if (me.age_max) { params.push(me.age_max); q += ` AND (age IS NULL OR age <= $${params.length})`; }

    q += ' ORDER BY last_seen DESC NULLS LAST LIMIT 100';
    const r = await pool.query(q, params);
    res.json({ data: r.rows });
  } catch (err) { next(err); }
}

module.exports = { getMe, updateMe, discover };
