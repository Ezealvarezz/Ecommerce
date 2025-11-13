const mongoose = require('mongoose');

const esquemaProducto = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  categoria: {
    type: mongoose.Schema.ObjectId,
    ref: 'Categoria',
    required: [true, 'La categoría es obligatoria']
  },
  marca: {
    type: String,
    required: [true, 'La marca es obligatoria'],
    trim: true,
    maxlength: [50, 'La marca no puede exceder 50 caracteres']
  },
  imagenes: [{
    type: String
  }],
  especificaciones: {
    type: Map,
    of: String,
    default: {}
  },
  activo: {
    type: Boolean,
    default: true
  },
  destacado: {
    type: Boolean,
    default: false
  },
  descuento: {
    type: Number,
    min: [0, 'El descuento no puede ser negativo'],
    max: [100, 'El descuento no puede ser mayor a 100%'],
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

esquemaProducto.virtual('precioFinal').get(function() {
  return this.precio * (1 - this.descuento / 100);
});

esquemaProducto.virtual('resenas', {
  ref: 'Resena',
  localField: '_id',
  foreignField: 'producto'
});

esquemaProducto.virtual('promedioCalificacion').get(function() {
  if (this.resenas && this.resenas.length > 0) {
    const suma = this.resenas.reduce((acc, resena) => acc + resena.calificacion, 0);
    return Math.round((suma / this.resenas.length) * 10) / 10;
  }
  return 0;
});

esquemaProducto.virtual('totalResenas').get(function() {
  return this.resenas ? this.resenas.length : 0;
});

esquemaProducto.pre(/^find/, function(siguiente) {
  this.populate({
    path: 'categoria',
    select: 'nombre descripcion'
  });
  siguiente();
});

esquemaProducto.methods.estaDisponible = function(cantidad = 1) {
  return this.activo && this.stock >= cantidad;
};

esquemaProducto.methods.reducirStock = function(cantidad) {
  if (this.stock >= cantidad) {
    this.stock -= cantidad;
    return this.save();
  } else {
    throw new Error('Stock insuficiente');
  }
};

esquemaProducto.methods.aumentarStock = function(cantidad) {
  this.stock += cantidad;
  return this.save();
};

esquemaProducto.index({ nombre: 'text', descripcion: 'text' });
esquemaProducto.index({ categoria: 1 });
esquemaProducto.index({ marca: 1 });
esquemaProducto.index({ precio: 1 });
esquemaProducto.index({ activo: 1 });
esquemaProducto.index({ destacado: 1 });
esquemaProducto.index({ createdAt: -1 });

module.exports = mongoose.model('Producto', esquemaProducto);
