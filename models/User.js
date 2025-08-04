// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {                 // ya es el hash que guardas
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['paciente','medico'],
    required: true
  },
  // Campos exclusivos de MÉDICO:
  tel: {                      // Número de teléfono
    type: String
  },
  esp: {                      // Especialidad
    type: String
  },
  matricula: {                // Matrícula médica
    type: String
  },
  pacientes: [                // Lista de pacientes vinculados
    { type: Schema.Types.ObjectId, ref: 'User' }
  ],
  codigoVinculacion: {        // Código de invitación que generó
    type: String,
    unique: true,
    sparse: true            // solo será único cuando exista
  },

  // Campos exclusivos de PACIENTE:
  codeVinculo: {             // Código con el que se registró
    type: String
  },

  creadoEn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
