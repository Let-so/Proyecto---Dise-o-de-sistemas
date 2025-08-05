// models/Invitation.js
const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  code:     { type: String, required: true, unique: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  used:     { type: Boolean, default: false },
  usedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Invitation', invitationSchema);

