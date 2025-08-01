// routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const user    = require(path.join(__dirname, '..', 'models', 'User'));

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

// POST /api/auth/register-paciente
router.post('/register-paciente', async (req, res) => {
  const { nombre, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ nombre, email, password: hash, role: 'paciente' });
  try {
    await user.save();
    res.status(201).json({ msg: 'Usuario registrado' });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

const User = require(path.join(__dirname, '..', 'models', 'User'));

// POST /api/auth/register-medico
router.post('/register-medico', async (req, res) => {
  const { 
    nombre, 
    email, 
    password, 
    tel, 
    esp, 
    matricula 
  } = req.body;

  // 1) Validar que vengan todos los campos
  if (!nombre || !email || !password || !tel || !esp || !matricula) {
    return res.status(400).json({ msg: 'Faltan datos obligatorios' });
  }

  // 2) Hashear la contraseña
  const hash = await bcrypt.hash(password, 10);

  // 3) Crear el usuario con rol 'medico'
  const user = new User({
    nombre,
    email,
    password: hash,
    role: 'medico',
    tel,
    esp,
    matricula
  });

  // 4) Guardar y responder
  try {
    await user.save();
    res.status(201).json({ msg: 'Médico registrado con éxito' });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});


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

// ───────── MÉDICO – VALIDAR MATRÍCULA ─────────
const REGEX = /^MP-(\d{5})$/i;
const MIN   = 1;
const MAX   = 207475;

// GET /api/auth/validar-matricula?matricula=MP-12345
router.get('/validar-matricula', (req, res) => {
  const m = req.query.matricula;
  if (!m) return res.status(400).json({ ok: false, msg: 'Falta parámetro matricula' });

  const match = REGEX.exec(m.trim().toUpperCase());
  if (!match) return res.status(422).json({ ok: false, msg: 'Formato inválido. Debe ser MP-12345' });

  const num = Number(match[1]);
  if (num < MIN || num > MAX) {
    return res.status(422).json({
      ok: false,
      msg: `Número fuera de rango (${MIN}–${MAX})`
    });
  }

  return res.json({ ok: true, msg: 'Matrícula válida', matricula: match[0] });
});

module.exports = router;