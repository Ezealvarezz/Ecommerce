const mongoose = require('mongoose');

const esquemaCategoria = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la categoría es obligatorio'],
    unique: true,
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  activa: {
    type: Boolean,
    default: true
  },
  imagen: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

esquemaCategoria.virtual('cantidadProductos', {
  ref: 'Producto',
  localField: '_id',
  foreignField: 'categoria',
  count: true
});

esquemaCategoria.virtual('productos', {
  ref: 'Producto',
  localField: '_id',
  foreignField: 'categoria'
});

esquemaCategoria.pre('remove', async function(siguiente) {
  try {
    const Producto = mongoose.model('Producto');
    const cantidadProductos = await Producto.countDocuments({ categoria: this._id });
    
    if (cantidadProductos > 0) {
      const error = new Error('No se puede eliminar una categoría que tiene productos asociados');
      error.statusCode = 400;
      return siguiente(error);
    }
    
    siguiente();
  } catch (error) {
    siguiente(error);
  }
});

esquemaCategoria.index({ nombre: 1 });
esquemaCategoria.index({ activa: 1 });

module.exports = mongoose.model('Categoria', esquemaCategoria);
