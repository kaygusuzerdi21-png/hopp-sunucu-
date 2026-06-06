// src/routes/match.js
// hopp · Eşleşme uçları (hepsi giriş ister)
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { swipe, list, likesMe } = require('../controllers/matchController');

router.use(authenticate);

router.post('/swipe', swipe);  // POST /api/match/swipe  { toUser, action }
router.get('/list', list);     // GET  /api/match/list   → eşleşmelerim
router.get('/likes', likesMe); // GET  /api/match/likes  → beni beğenenler

module.exports = router;
