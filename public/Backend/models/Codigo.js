// models/Codigo.js
import mongoose from 'mongoose';


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://sosocardozo17:<db_password>@cluster0.krymp7b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


const codigoSchema = new mongoose.Schema({
  _id: String,             // el propio código
  medico_id: mongoose.Types.ObjectId,
  estado: {
    type: String,
    enum: ['activo','usado','vencido'],
    default: 'activo'
  },
  fecha_creacion: Date,
  expiracion: Date
});

export const Codigo  = mongoose.model('Codigo',   codigoSchema);

// models/Usuario.js
import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  pass: String,
  rol: { type: String, enum: ['paciente','medico'] },
  medico_id: mongoose.Types.ObjectId    // sólo para pacientes
});

export const Usuario = mongoose.model('Usuario',  usuarioSchema);

// models/Vinculo.js
import mongoose from 'mongoose';

const vinculoSchema = new mongoose.Schema({
  paciente_id: mongoose.Types.ObjectId,
  medico_id: mongoose.Types.ObjectId,
  fecha_vinculo: Date
});

export const Vinculo = mongoose.model('Vinculo',  vinculoSchema);
