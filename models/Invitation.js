// models/Invitation.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const invitationSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  issuedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invitation', invitationSchema);
