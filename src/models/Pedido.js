const mongoose = require('mongoose');

const esquemaItemPedido = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.ObjectId,
    ref: 'Producto',
    required: true
  },
  nombre: {
    type: String,
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

esquemaItemPedido.virtual('subtotal').get(function() {
  return this.cantidad * this.precio;
});

const esquemaPedido = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.ObjectId,
    ref: 'Usuario',
    required: true
  },
  items: [esquemaItemPedido],
  total: {
    type: Number,
    required: true,
    min: [0, 'El total no puede ser negativo']
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  metodoPago: {
    tipo: {
      type: String,
      enum: ['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'mercadopago'],
      required: true
    },
    detalles: {
      type: Map,
      of: String,
      default: {}
    }
  },
  direccionEnvio: {
    calle: { type: String, required: true },
    ciudad: { type: String, required: true },
    codigoPostal: { type: String, required: true },
    pais: { type: String, required: true }
  },
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  fechaPedido: {
    type: Date,
    default: Date.now
  },
  fechaEnvio: {
    type: Date
  },
  fechaEntrega: {
    type: Date
  },
  numeroSeguimiento: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

esquemaPedido.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.cantidad, 0);
});

esquemaPedido.pre(/^find/, function(siguiente) {
  this.populate({
    path: 'usuario',
    select: 'nombre email telefono'
  });
  siguiente();
});

esquemaPedido.methods.actualizarEstado = async function(nuevoEstado) {
  const estadosPermitidos = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];
  
  if (!estadosPermitidos.includes(nuevoEstado)) {
    throw new Error('Estado no válido');
  }

  const transicionesValidas = {
    'pendiente': ['confirmado', 'cancelado'],
    'confirmado': ['enviado', 'cancelado'],
    'enviado': ['entregado'],
    'entregado': [],
    'cancelado': []
  };

  if (!transicionesValidas[this.estado].includes(nuevoEstado)) {
    throw new Error(`No se puede cambiar el estado de ${this.estado} a ${nuevoEstado}`);
  }

  this.estado = nuevoEstado;

  if (nuevoEstado === 'enviado') {
    this.fechaEnvio = new Date();
  } else if (nuevoEstado === 'entregado') {
    this.fechaEntrega = new Date();
  }

  return await this.save();
};

esquemaPedido.methods.puedeSerCancelado = function() {
  return ['pendiente', 'confirmado'].includes(this.estado);
};

esquemaPedido.methods.estaCompletado = function() {
  return this.estado === 'entregado';
};

esquemaPedido.statics.obtenerEstadisticasPedidos = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$estado',
        cantidad: { $sum: 1 },
        montoTotal: { $sum: '$total' }
      }
    },
    {
      $sort: { cantidad: -1 }
    }
  ]);
};

esquemaPedido.index({ usuario: 1 });
esquemaPedido.index({ estado: 1 });
esquemaPedido.index({ fechaPedido: -1 });
esquemaPedido.index({ 'metodoPago.tipo': 1 });

module.exports = mongoose.model('Pedido', esquemaPedido);