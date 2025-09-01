// index.js

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

app.set('trust proxy', 1);
app.use(helmet()); // HSTS y headers seguros (en prod)
app.use(cors({ origin: ['https://sonder-web.vercel.app/'], credentials: true }));
app.use(express.json());

// Redirigir http -> https si llega sin TLS (útil detrás de proxy)
app.use((req, res, next) => {
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
  res.redirect(301, `https://${req.headers.host}${req.url}`);
});


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

