// index.js

// 1) Carga variables de entorno lo primero
require('dotenv').config();
console.log('URI leída:', process.env.MONGO_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET); 

const express  = require('express');
const path     = require('path');
const mongoose = require('mongoose');

const app = express();  // ← ahora sí declaras app antes de usarla

// 2) Sirve estáticos de /public
app.use(express.static(path.join(__dirname, 'public')));

// 3) Para parsear JSON (por si luego usas POST)
app.use(express.json());

// 4) Conectar a MongoDB (sin opciones deprecadas en Mongoose 7+)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✔ Conectado a MongoDB'))
  .catch(err => console.error('✖ Error al conectar:', err));

// 5) Rutas de tu API
// Asegúrate de que auth.js esté en ./routes/auth.js
//app.use('/api/medico', require('./routes/medico'));
app.use('/api/auth',   require('./routes/auth'));

// 6) Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor en http://localhost:' + PORT));

// 7) Exportar app para poder testear con Supertest
module.exports = app;

