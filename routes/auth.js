// routes/auth.js
const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const path       = require('path');
const User       = require(path.join(__dirname, '..', 'models', 'User'));
const Invitation = require(path.join(__dirname, '..', 'models', 'Invitation'));

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

// ───────── REGISTRO PACIENTE ─────────
router.post('/register-paciente', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ msg: 'Faltan campos obligatorios' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ nombre, email, password: hash, role: 'paciente' });
  try {
    await user.save();
    res.status(201).json({ msg: 'Usuario registrado' });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

// ───────── REGISTRO MÉDICO ─────────
router.post('/register-medico', async (req, res) => {
  const { nombre, email, password, tel, esp, matricula } = req.body;
  if (!nombre || !email || !password || !tel || !esp || !matricula) {
    return res.status(400).json({ msg: 'Faltan datos obligatorios' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = new User({
    nombre, email, password: hash,
    role: 'medico', tel, esp, matricula
  });
  try {
    await user.save();
    res.status(201).json({ msg: 'Médico registrado con éxito' });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

// ───────── LOGIN PACIENTE ─────────
router.post('/iniciar-sesion-paciente', (req, res) => {
  doLogin(req, res, 'paciente').catch(err => {
    console.error(err);
    res.status(500).json({ msg: 'Error de servidor' });
  });
});

// ───────── LOGIN MÉDICO ─────────
router.post('/Iniciar-sesion-medico', (req, res) => {  // ruta en minúsculas
  doLogin(req, res, 'medico').catch(err => {
    console.error(err);
    res.status(500).json({ msg: 'Error de servidor' });
  });
});

// ───────── MÉDICO – VALIDAR MATRÍCULA ─────────
const REGEX = /^MP-(\d{5})$/i;
const MIN   = 1;
const MAX   = 207475;

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

/* ——— Helpers para invitaciones ——— */
function getUserIdFromHeader(req) {
  const auth = req.headers.authorization?.split(' ');
  if (!auth || auth[0] !== 'Bearer') throw new Error('No token');
  return jwt.verify(auth[1], process.env.JWT_SECRET).id;
}

/* ——— Crear código de invitación ——— */
// POST /api/auth/invitations/create
router.post('/invitations/create', async (req, res) => {
  try {
    const userId = getUserIdFromHeader(req);
    const code   = Math.floor(100000 + Math.random()*900000).toString();
    const inv    = new Invitation({ code, issuedBy: userId });
    await inv.save();
    res.json({ code });
  } catch (e) {
    res.status(401).json({ msg: e.message });
  }
});

/* ——— Validar código de invitación ——— */
// GET /api/auth/invitations/validate?code=123456
router.get('/invitations/validate', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ valid: false, msg: 'Falta código' });

  const inv = await Invitation.findOne({ code });
  if (!inv)      return res.status(404).json({ valid: false, msg: 'Código no existe' });
  if (inv.used)  return res.status(400).json({ valid: false, msg: 'Código ya usado' });

  res.json({ valid: true });
});

module.exports = router;