
// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // 1) Validar que no exista ya un usuario con ese email
    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ msg: 'Email ya registrado' });

    // 2) Hashear la contraseña
    const salt     = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    // 3) Crear y guardar el nuevo usuario
    const nuevoUsuario = new User({
      nombre,
      email,
      password: hashPass
    });
    await nuevoUsuario.save();

    // 4) Responder OK (podrías devolver un token JWT aquí)
    res.status(201).json({ msg: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
});

module.exports = router;
