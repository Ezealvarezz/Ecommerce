const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const esquemaUsuario = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  contrasena: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio']
  },
  direccion: {
    calle: { type: String, required: false },
    ciudad: { type: String, required: false },
    codigoPostal: { type: String, required: false },
    pais: { type: String, required: false, default: 'Argentina' }
  },
  rol: {
    type: String,
    enum: ['cliente', 'administrador'],
    default: 'cliente'
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  ultimoAcceso: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

esquemaUsuario.virtual('carrito', {
  ref: 'Carrito',
  localField: '_id',
  foreignField: 'usuario',
  justOne: true
});

esquemaUsuario.virtual('pedidos', {
  ref: 'Pedido',
  localField: '_id',
  foreignField: 'usuario'
});

esquemaUsuario.pre('save', async function(siguiente) {
  if (!this.isModified('contrasena')) return siguiente();
  
  try {
    this.contrasena = await bcrypt.hash(this.contrasena, 12);
    siguiente();
  } catch (error) {
    siguiente(error);
  }
});

esquemaUsuario.methods.compararContrasena = async function(contrasenaCandidata) {
  return await bcrypt.compare(contrasenaCandidata, this.contrasena);
};

esquemaUsuario.methods.actualizarUltimoAcceso = function() {
  this.ultimoAcceso = new Date();
  return this.save({ validateBeforeSave: false });
};

esquemaUsuario.methods.esAdmin = function() {
  return this.rol === 'administrador';
};

esquemaUsuario.index({ email: 1 });
esquemaUsuario.index({ rol: 1 });
esquemaUsuario.index({ activo: 1 });

module.exports = mongoose.model('Usuario', esquemaUsuario);
