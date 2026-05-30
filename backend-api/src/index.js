const app = require('./app');
const pool = require('./db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL bağlantısı başarılı');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Sunucu ${PORT} portunda çalışıyor — ortam: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Başlatma hatası:', err);
    process.exit(1);
  }
}

start();
