function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Bu kayıt zaten mevcut' });
  }
  if (err.code === '23503') {
    return res.status(404).json({ error: 'İlişkili kayıt bulunamadı' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Sunucu hatası' : err.message,
  });
}

module.exports = { errorHandler };
