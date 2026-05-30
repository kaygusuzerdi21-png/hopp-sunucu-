const router = require('express').Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const { sendToToken, sendToMultiple, sendToTopic } = require('../services/fcm');

// FCM token kaydet/güncelle
router.post('/token', authenticate, async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: 'fcmToken gerekli' });

    await pool.query('UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2', [fcmToken, req.user.id]);
    res.json({ message: 'Token güncellendi' });
  } catch (err) {
    next(err);
  }
});

// Belirli bir kullanıcıya bildirim gönder
router.post('/send', authenticate, async (req, res, next) => {
  try {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title ve body gerekli' });
    }

    const result = await pool.query('SELECT fcm_token FROM users WHERE id = $1 AND is_active = true', [userId]);
    const user = result.rows[0];
    if (!user || !user.fcm_token) {
      return res.status(404).json({ error: 'Kullanıcı veya FCM token bulunamadı' });
    }

    const messageId = await sendToToken(user.fcm_token, { title, body, data });
    res.json({ success: true, messageId });
  } catch (err) {
    next(err);
  }
});

// Konuya bildirim gönder
router.post('/topic', authenticate, async (req, res, next) => {
  try {
    const { topic, title, body, data } = req.body;
    if (!topic || !title || !body) {
      return res.status(400).json({ error: 'topic, title ve body gerekli' });
    }

    const messageId = await sendToTopic(topic, { title, body, data });
    res.json({ success: true, messageId });
  } catch (err) {
    next(err);
  }
});

// Tüm kullanıcılara toplu bildirim
router.post('/broadcast', authenticate, async (req, res, next) => {
  try {
    const { title, body, data } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'title ve body gerekli' });
    }

    const result = await pool.query(
      'SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND is_active = true'
    );
    const tokens = result.rows.map((r) => r.fcm_token);

    const stats = await sendToMultiple(tokens, { notification: { title, body }, data });
    res.json({ success: true, ...stats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
