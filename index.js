// index.js  (CommonJS)

// 1) Variables de entorno
require('dotenv').config();

// 2) Imports
const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const path     = require('path');
const mongoose = require('mongoose');

// 3) App
const app = express();
app.set('trust proxy', 1);

// 4) Middlewares base
app.use(helmet()); // headers seguros
app.use(cors({
  origin: ['https://sonder-web.vercel.app'], // sin la barra final
  credentials: true
}));
app.use(express.json());

// 5) Redirección http -> https (útil detrás de proxy, p.ej. Vercel/NGINX)
app.use((req, res, next) => {
  const xfProto = req.headers['x-forwarded-proto'];
  if (req.secure || xfProto === 'https') return next();
  return res.redirect(301, `https://${req.headers.host}${req.url}`);
});

// 6) Estáticos (si los usás)
app.use(express.static(path.join(__dirname, 'public')));

// 7) Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✔ Conectado a MongoDB'))
  .catch(err => console.error('✖ Error al conectar:', err));

// 8) Rutas
// app.use('/api/medico', require('./routes/medico'));
app.use('/api/auth', require('./routes/auth'));

// 9) Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

// 10) Export para tests (Supertest)
module.exports = app;
