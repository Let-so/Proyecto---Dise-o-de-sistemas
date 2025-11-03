// index.js  (CommonJS)

// 1) Variables de entorno
require('dotenv').config();

// 2) Imports
const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const cookieParser = require('cookie-parser');
const path     = require('path');
const mongoose = require('mongoose');

// 3) App
const app = express();
app.set('trust proxy', 1);

// 4) Middlewares base
app.use(helmet()); // headers seguros

// CORS: en producción permitir el origen desplegado, en desarrollo permitir localhost
const corsOptions = (process.env.NODE_ENV === 'production')
  ? { origin: ['https://sonder-web.vercel.app'], credentials: true }
  : { origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'], credentials: true };
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Redirección http -> https: sólo en producción (evita romper POSTs en dev)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const xfProto = req.headers['x-forwarded-proto'];
    if (req.secure || xfProto === 'https') return next();
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  });
}

// 6) Estáticos (si los usás)
app.use(express.static(path.join(__dirname, 'public')));

// 7) Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✔ Conectado a MongoDB'))
  .catch(err => console.error('✖ Error al conectar:', err));

// 8) Rutas
// Montar primero las rutas públicas (registro / login)
app.use('/api/auth', require('./routes/auth'));

// Si en el futuro querés añadir middleware global de auth, montalo DESPUÉS de las rutas públicas
// const { requireAuth } = require('./middleware/auth-middleware');
// app.use(requireAuth);
// app.use('/api', require('./routes/protected'));

// 9) Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

// 10) Export para tests (Supertest)
module.exports = app;
