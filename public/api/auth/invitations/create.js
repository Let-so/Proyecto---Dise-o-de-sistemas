const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Models (ruta relativa desde public/api/auth/invitations/create.js)
const Invitation = require('../../../../models/Invitation');

async function connect() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    await connect();

    const auth = req.headers.authorization?.split(' ');
    if (!auth || auth[0] !== 'Bearer') return res.status(401).json({ msg: 'No autorizado' });
    const token = auth[1];

    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch (e) { return res.status(401).json({ msg: 'Token inválido o expirado' }); }

    const userId = payload.id || payload.sub || payload._id;
    const code = Math.floor(100000 + Math.random()*900000).toString();

    const inv = new Invitation({ code, issuedBy: userId });
    await inv.save();

    return res.json({ code });
  } catch (err) {
    console.error('[api/invitations/create] ', err);
    return res.status(500).send('Internal Server Error');
  }
};
