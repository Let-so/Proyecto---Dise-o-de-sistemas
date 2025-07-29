
// index.js
require('dotenv').config();
console.log('URI leída:', process.env.MONGO_URI); 
const express = require('express');
const mongoose = require('mongoose');


const app = express();
app.use(express.json()); // para leer JSON del body

// 1) Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✔ Conectado a MongoDB'))
.catch(err => console.error('✖ Error al conectar:', err));

// 2) Importar rutas de usuario
const authRouter = require('./public/routes/auth');
app.use('/api/auth', authRouter);

// 3) Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
