// routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const User    = require(path.join(__dirname, '..', 'models', 'User'));

const router = express.Router();

async function doLogin(req, res, expectedRole) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) 
    return res.status(400).json({ msg: 'Usuario no encontrado' });
  if (user.role !== expectedRole) 
    return res.status(403).json({ msg: `No es un ${expectedRole}` });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) 
    return res.status(400).json({ msg: 'Contraseña incorrecta' });

  const payload = { id: user._id, nombre: user.nombre, role: user.role };
  const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
}

// POST /api/auth/iniciar-sesion-paciente
router.post('/iniciar-sesion-paciente', (req, res) => {
  doLogin(req, res, 'paciente').catch(err => {
    console.error(err);
    res.status(500).json({ msg: 'Error de servidor' });
  });
});

// POST /api/auth/iniciar-sesion-medico
router.post('/Iniciar-sesion-medico', (req, res) => {
  doLogin(req, res, 'medico').catch(err => {
    console.error(err);
    res.status(500).json({ msg: 'Error de servidor' });
  });
});
module.exports = router;
