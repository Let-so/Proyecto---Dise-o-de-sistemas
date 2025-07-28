// server.js
import dotenv from 'dotenv';
dotenv.config();           // → lee .env y lo expone en process.env

import express from 'express';
import mongoose from 'mongoose';
import Codigo from './models/Codigo.js';
import Usuario from './models/Usuario.js';
import Vinculo from './models/Vinculo.js';

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/sonder');

// Registro de paciente + vinculación
app.post('/pacientes/registrar', async (req, res) => {
  const { email, pass, code } = req.body;

  // 1) Validar existencia del código
  const codigo = await Codigo.findById(code);
  if (!codigo) {
    return res.status(404).json({ mensaje: 'Código no encontrado' });
  }
  if (codigo.estado !== 'activo') {
    return res.status(400).json({ mensaje: 'Código inválido o ya usado' });
  }
  if (codigo.expiracion && codigo.expiracion < new Date()) {
    return res.status(400).json({ mensaje: 'Código expirado' });
  }

  // 2) Crear usuario paciente
  const paciente = new Usuario({
    email,
    pass, 
    rol: 'paciente',
    medico_id: codigo.medico_id
  });

  try {
    await paciente.save();
  } catch (err) {
    return res.status(400).json({ mensaje: 'Error al crear paciente', detalle: err.message });
  }

  // 3) Marcar código como usado
  codigo.estado = 'usado';
  await codigo.save();

  // 4) Crear vínculo
  const vinculo = new Vinculo({
    paciente_id: paciente._id,
    medico_id: codigo.medico_id,
    fecha_vinculo: new Date()
  });
  await vinculo.save();

  // 5) Responder éxito
  res.status(201).json({
    mensaje: 'Paciente registrado y vinculado con éxito',
    pacienteId: paciente._id,
    medicoId: codigo.medico_id
  });
});

app.listen(3001, () => console.log('API corriendo en http://localhost:3001'));
