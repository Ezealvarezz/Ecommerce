const mongoose = require('mongoose');

const esquemaItemCarrito = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.ObjectId,
    ref: 'Producto',
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: [1, 'La cantidad debe ser al menos 1']
  },
  precio: {
    type: Number,
    required: true,
    min: [0, 'El precio no puede ser negativo']
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

esquemaItemCarrito.virtual('subtotal').get(function() {
  return this.cantidad * this.precio;
});

const esquemaCarrito = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  items: [esquemaItemCarrito],
  activo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaModificacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

esquemaCarrito.virtual('total').get(function() {
  return this.items.reduce((total, item) => total + item.subtotal, 0);
});

esquemaCarrito.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.cantidad, 0);
});

esquemaCarrito.pre(/^find/, function(siguiente) {
  this.populate({
    path: 'items.producto',
    select: 'nombre precio imagenes stock activo'
  });
  siguiente();
});

esquemaCarrito.pre('save', function(siguiente) {
  this.fechaModificacion = new Date();
  siguiente();
});

esquemaCarrito.methods.agregarItem = async function(productoId, cantidad, precio) {
  const indiceItemExistente = this.items.findIndex(
    item => item.producto._id.toString() === productoId.toString()
  );

  if (indiceItemExistente > -1) {
    this.items[indiceItemExistente].cantidad += cantidad;
  } else {
    this.items.push({
      producto: productoId,
      cantidad: cantidad,
      precio: precio
    });
  }

  return await this.save();
};

esquemaCarrito.methods.removerItem = async function(productoId) {
  this.items = this.items.filter(
    item => item.producto._id.toString() !== productoId.toString()
  );
  return await this.save();
};

esquemaCarrito.methods.actualizarCantidadItem = async function(productoId, nuevaCantidad) {
  const item = this.items.find(
    item => item.producto._id.toString() === productoId.toString()
  );

  if (item) {
    if (nuevaCantidad <= 0) {
      return await this.removerItem(productoId);
    } else {
      item.cantidad = nuevaCantidad;
      return await this.save();
    }
  } else {
    throw new Error('Producto no encontrado en el carrito');
  }
};

esquemaCarrito.methods.limpiarCarrito = async function() {
  this.items = [];
  return await this.save();
};

esquemaCarrito.index({ usuario: 1 });
esquemaCarrito.index({ activo: 1 });
esquemaCarrito.index({ 'items.producto': 1 });

module.exports = mongoose.model('Carrito', esquemaCarrito);
