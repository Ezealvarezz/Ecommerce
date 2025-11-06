const mongoose = require('mongoose');

const esquemaResena = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.ObjectId,
    ref: 'Usuario',
    required: true
  },
  producto: {
    type: mongoose.Schema.ObjectId,
    ref: 'Producto',
    required: true
  },
  calificacion: {
    type: Number,
    required: [true, 'La calificación es obligatoria'],
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  comentario: {
    type: String,
    required: [true, 'El comentario es obligatorio'],
    maxlength: [1000, 'El comentario no puede exceder 1000 caracteres'],
    trim: true
  },
  verificado: {
    type: Boolean,
    default: false
  },
  util: {
    votos: {
      type: Number,
      default: 0
    },
    votantes: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Usuario'
    }]
  },
  respuesta: {
    texto: String,
    fecha: Date,
    usuario: {
      type: mongoose.Schema.ObjectId,
      ref: 'Usuario'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

esquemaResena.index({ usuario: 1, producto: 1 }, { unique: true });

esquemaResena.index({ producto: 1 });
esquemaResena.index({ calificacion: 1 });
esquemaResena.index({ verificado: 1 });
esquemaResena.index({ createdAt: -1 });

esquemaResena.virtual('usuarioComproProducto').get(async function() {
  const Pedido = mongoose.model('Pedido');
  const pedido = await Pedido.findOne({
    usuario: this.usuario,
    'items.producto': this.producto,
    estado: 'entregado'
  });
  return !!pedido;
});

esquemaResena.pre(/^find/, function(siguiente) {
  this.populate({
    path: 'usuario',
    select: 'nombre'
  }).populate({
    path: 'producto',
    select: 'nombre'
  });
  siguiente();
});

esquemaResena.pre('save', async function(siguiente) {
  if (this.isNew) {
    try {
      const Pedido = mongoose.model('Pedido');
      const pedidoEntregado = await Pedido.findOne({
        usuario: this.usuario,
        'items.producto': this.producto,
        estado: 'entregado'
      });

      if (pedidoEntregado) {
        this.verificado = true;
      }
    } catch (error) {
      console.error('Error verificando compra:', error);
    }
  }
  siguiente();
});

esquemaResena.methods.marcarComoUtil = async function(usuarioId) {
  if (!this.util.votantes.includes(usuarioId)) {
    this.util.votantes.push(usuarioId);
    this.util.votos += 1;
    return await this.save();
  } else {
    throw new Error('Ya votaste por esta reseña');
  }
};

esquemaResena.methods.agregarRespuesta = async function(texto, usuarioAdmin) {
  this.respuesta = {
    texto: texto,
    fecha: new Date(),
    usuario: usuarioAdmin
  };
  return await this.save();
};

esquemaResena.statics.obtenerPromedioCalificacion = async function(productoId) {
  const estadisticas = await this.aggregate([
    {
      $match: { producto: mongoose.Types.ObjectId(productoId) }
    },
    {
      $group: {
        _id: '$producto',
        promedioCalificacion: { $avg: '$calificacion' },
        totalResenas: { $sum: 1 }
      }
    }
  ]);

  if (estadisticas.length > 0) {
    return {
      promedio: Math.round(estadisticas[0].promedioCalificacion * 10) / 10,
      total: estadisticas[0].totalResenas
    };
  }
  
  return { promedio: 0, total: 0 };
};

esquemaResena.statics.obtenerProductosMejorCalificados = async function(limite = 10) {
  return await this.aggregate([
    {
      $group: {
        _id: '$producto',
        promedioCalificacion: { $avg: '$calificacion' },
        totalResenas: { $sum: 1 }
      }
    },
    {
      $match: {
        totalResenas: { $gte: 5 }
      }
    },
    {
      $sort: {
        promedioCalificacion: -1,
        totalResenas: -1
      }
    },
    {
      $limit: limite
    },
    {
      $lookup: {
        from: 'productos',
        localField: '_id',
        foreignField: '_id',
        as: 'producto'
      }
    },
    {
      $unwind: '$producto'
    },
    {
      $project: {
        'producto.nombre': 1,
        'producto.precio': 1,
        'producto.imagenes': 1,
        promedioCalificacion: 1,
        totalResenas: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Resena', esquemaResena);