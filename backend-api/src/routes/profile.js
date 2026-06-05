// src/routes/profile.js
// hopp · Profil + Keşfet uçları (hepsi giriş ister)
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getMe, updateMe, discover } = require('../controllers/profileController');

router.use(authenticate);

router.get('/me', getMe);          // GET   /api/profile/me      → kendi profilim
router.patch('/me', updateMe);     // PATCH /api/profile/me      → profilimi güncelle
router.get('/discover', discover); // GET   /api/profile/discover→ keşfet akışı

module.exports = router;
