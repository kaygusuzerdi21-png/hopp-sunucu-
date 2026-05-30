const router = require('express').Router();
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/single', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya bulunamadı' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
});

router.post('/multiple', authenticate, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Dosya bulunamadı' });
  }
  const files = req.files.map((f) => ({
    url: `${req.protocol}://${req.get('host')}/uploads/${f.filename}`,
    filename: f.filename,
    size: f.size,
    mimetype: f.mimetype,
  }));
  res.json({ files });
});

module.exports = router;
