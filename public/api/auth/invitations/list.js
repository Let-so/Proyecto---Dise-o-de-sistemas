const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Invitation = require('../../../../models/Invitation');

async function connect() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  try {
    await connect();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No autorizado' });

    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch (e) { return res.status(401).json({ msg: 'Token inválido o expirado' }); }
    const userId = payload.id || payload.sub || payload._id;

    const invs = await Invitation.find({ issuedBy: userId }).populate('usedBy', 'nombre email');
    const list = invs.map(inv => ({ code: inv.code, used: inv.used, paciente: inv.used ? { nombre: inv.usedBy.nombre, email: inv.usedBy.email } : null }));
    return res.json(list);
  } catch (err) {
    console.error('[api/invitations/list] ', err);
    return res.status(500).send('Internal Server Error');
  }
};
