// routes/auth.js
const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const path       = require('path');
const User       = require(path.join(__dirname, '..', 'models', 'User'));
const Invitation = require(path.join(__dirname, '..', 'models', 'Invitation'));


const router = express.Router();

async function doLogin(req, res, expectedRole) {
  console.log('[login] body:', req.body);
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

router.post('/register-paciente', async (req, res) => {
  const { nombre, email, password, code } = req.body;

  // 1) Crear y guardar paciente
  const hash     = await bcrypt.hash(password, 10);
  const paciente = new User({
    nombre,
    email,
    password: hash,
    role: 'paciente',
    codeVinculo: code
  });
  const savedPatient = await paciente.save();

  // 2) Marcar la invitación como usada
  const inv = await Invitation.findOne({ code });
  if (!inv) return res.status(404).json({ msg: 'Invitación no existe' });
  inv.used   = true;
  inv.usedBy = savedPatient._id;
  await inv.save();

  // 3) **Aquí enlazamos al paciente con su médico:**
  const medicoId = inv.issuedBy;
  await User.updateOne(
    { _id: medicoId },
    { $push: { pacientes: savedPatient._id } }
  );

  // 4) Responder OK
  res.status(201).json({ msg: 'Usuario registrado' });
});

// ───────── REGISTRO MÉDICO ─────────
router.post('/register-medico', async (req, res) => {
  console.log('[register-medico] body:', req.body);

  const { nombre, email, password, tel, esp, matricula } = req.body;
  if (!nombre || !email || !password || !tel || !esp || !matricula) {
    return res.status(400).json({ msg: 'Faltan datos obligatorios' });
  }

  const hash = await bcrypt.hash(password, 10);

  const medico = new User({
    nombre,
    email,
    password: hash,
    role: 'medico',
    tel,
    esp,
    matricula,
  });

  try {
    const saved = await medico.save();
    console.log('[register-medico] guardado:', saved);
    return res.status(201).json({
      msg: 'Médico registrado con éxito',
      medicoId: saved._id
    });
  } catch (e) {
    console.error('[register-medico] error guardando:', e);
    return res.status(400).json({ msg: e.message });
  }
});

// ───────── LOGIN PACIENTE ─────────
router.post('/iniciar-sesion-paciente', async (req, res) => {
  try {
    await doLogin(req, res, 'paciente');
  } catch (err) {
    console.error('[login-paciente] Error interno:', err.stack || err);
    res.status(500).json({ msg: 'Error de servidor' });
  }
});


// ───────── LOGIN MÉDICO ─────────
router.post('/iniciar-sesion-medico', async (req, res) => {
  try {
    await doLogin(req, res, 'medico');
  } catch (err) {
    console.error('[login-medico] Error interno:', err.stack || err);
    res.status(500).json({ msg: 'Error de servidor' });
  }
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

// GET /api/auth/invitations/list
router.get('/invitations/list', async (req, res) => {
  try {
    // 1) Extrae userId del token
    const token = req.headers.authorization?.split(' ')[1];
    const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);

    // 2) Busca las invitaciones de este médico y "populate" el paciente
    const invs = await Invitation
      .find({ issuedBy: userId })
      .populate('usedBy', 'nombre email');

    // 3) Mapea al formato deseado
    const list = invs.map(inv => ({
      code: inv.code,
      used: inv.used,
      paciente: inv.used
        ? { nombre: inv.usedBy.nombre, email: inv.usedBy.email }
        : null
    }));

    return res.json(list);
  } catch (e) {
    console.error('[invitations/list] ', e);
    return res.status(401).json({ msg: 'No autorizado' });
  }
});

// GET /api/auth/paciente/profile
router.get('/paciente/profile', async (req, res) => {
  try {
    // 1) Verificar que venga el Bearer token
    const auth = req.headers.authorization?.split(' ');
    if (!auth || auth[0] !== 'Bearer') {
      return res.status(401).json({ msg: 'No autorizado' });
    }
    const payload = jwt.verify(auth[1], process.env.JWT_SECRET);

    // 2) Buscar datos básicos del paciente
    const paciente = await User.findById(payload.id).lean();
    if (!paciente || paciente.role !== 'paciente') {
      return res.status(403).json({ msg: 'Acceso denegado' });
    }

    // 3) Buscar la invitación que usó este paciente
    const inv = await Invitation
      .findOne({ usedBy: paciente._id })
      .populate('issuedBy', 'nombre email')  // poblamos solo al médico
      .lean();

    // 4) Montar el objeto médico (si existe invitación usada)
    const medico = inv
      ? { nombre: inv.issuedBy.nombre, email: inv.issuedBy.email }
      : null;

    // 5) Responder con JSON limpio
    return res.json({
      nombre: paciente.nombre,
      email:  paciente.email,
      medico
    });
  } catch (err) {
    console.error('[paciente/profile] Error interno:', err.stack || err);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
});

// GET /api/auth/paciente/profile
// Header: Authorization: Bearer <tokenPaciente>
router.get('/paciente/profile', async (req, res) => {
  try {
    // 1) Comprobar header y extraer token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ msg: 'No autorizado' });
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ msg: 'Formato de token inválido' });
    }
    const token = parts[1];

    // 2) Verificar JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ msg: 'Token inválido o expirado' });
    }

    // 3) Cargar datos del paciente
    const paciente = await User.findById(payload.id).lean();
    if (!paciente || paciente.role !== 'paciente') {
      return res.status(403).json({ msg: 'Acceso denegado' });
    }

    // 4) Buscar la invitación usada por este paciente
    const inv = await Invitation
      .findOne({ usedBy: paciente._id })
      .populate('issuedBy', 'nombre email')  // sólo nombre y email del médico
      .lean();

    // 5) Construir el objeto médico (si existe invitación)
    const medico = inv
      ? { nombre: inv.issuedBy.nombre, email: inv.issuedBy.email }
      : null;

    // 6) Devolver el perfil del paciente
    return res.json({
      nombre: paciente.nombre,
      email:  paciente.email,
      medico
    });

  } catch (err) {
    console.error('[paciente/profile] Error interno:', err);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
});

module.exports = router;