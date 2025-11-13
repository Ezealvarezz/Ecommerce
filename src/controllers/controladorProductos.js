const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const { mongoose } = require('mongoose');

const obtenerProductos = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const saltar = (pagina - 1) * limite;

    const filtros = {};

    if (req.query.categoria) {
      const categoria = await Categoria.findOne({ 
        nombre: new RegExp(req.query.categoria, 'i') 
      });
      if (categoria) {
        filtros.categoria = categoria._id;
      } else {
        return res.error('Categoría no encontrada', 404);
      }
    }

    if (req.query.buscar) {
      filtros.$or = [
        { nombre: new RegExp(req.query.buscar, 'i') },
        { descripcion: new RegExp(req.query.buscar, 'i') }
      ];
    }

    if (req.query.disponible !== undefined) {
      filtros.disponible = req.query.disponible === 'true';
    }

    if (req.query.precioMin || req.query.precioMax) {
      filtros.precio = {};
      if (req.query.precioMin) filtros.precio.$gte = parseFloat(req.query.precioMin);
      if (req.query.precioMax) filtros.precio.$lte = parseFloat(req.query.precioMax);
    }

    let consultaOrdenamiento = {};
    if (req.query.ordenar) {
      const [campo, direccion] = req.query.ordenar.split('_');
      consultaOrdenamiento[campo] = direccion === 'desc' ? -1 : 1;
    } else {
      consultaOrdenamiento = { fechaCreacion: -1 };
    }

    const productos = await Producto.find(filtros)
      .populate('categoria', 'nombre descripcion')
      .sort(consultaOrdenamiento)
      .skip(saltar)
      .limit(limite)
      .select('-__v');

    const totalProductos = await Producto.countDocuments(filtros);
    const totalPaginas = Math.ceil(totalProductos / limite);

    res.success({
      productos,
      informacionPaginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalProductos,
        limite,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas
      }
    });

  } catch (error) {
    next(error);
  }
};

const obtenerProductoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de producto inválido', 400);
    }

    const producto = await Producto.findById(id)
      .populate('categoria', 'nombre descripcion')
      .select('-__v');

    if (!producto) {
      return res.error('Producto no encontrado', 404);
    }

    res.success({ producto });

  } catch (error) {
    next(error);
  }
};

const crearProducto = async (req, res, next) => {
  try {
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
    
    const {
      nombre,
      descripcion,
      precio,
      categoria: idCategoria,
      marca,
      stock,
      imagenes,
      disponible,
      especificaciones,
      etiquetas
    } = req.body;
    
    console.log('🏷️  Marca extraída:', marca);

    const categoriaExiste = await Categoria.findById(idCategoria);
    if (!categoriaExiste) {
      return res.error('Categoría no encontrada', 404);
    }

    const productoExiste = await Producto.findOne({ 
      nombre: new RegExp(`^${nombre}$`, 'i') 
    });

    if (productoExiste) {
      return res.error('Ya existe un producto con este nombre', 400);
    }

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      categoria: idCategoria,
      marca,
      stock,
      imagenes,
      disponible,
      especificaciones,
      etiquetas
    });

    const productoGuardado = await nuevoProducto.save();

    const productoCompleto = await Producto.findById(productoGuardado._id)
      .populate('categoria', 'nombre descripcion')
      .select('-__v');

    res.success(
      { producto: productoCompleto },
      'Producto creado exitosamente',
      201
    );

  } catch (error) {
    next(error);
  }
};

const actualizarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de producto inválido', 400);
    }

    const datosActualizacion = { ...req.body };
    delete datosActualizacion._id;
    delete datosActualizacion.__v;

    if (datosActualizacion.categoria) {
      const categoriaExiste = await Categoria.findById(datosActualizacion.categoria);
      if (!categoriaExiste) {
        return res.error('Categoría no encontrada', 404);
      }
    }

    if (datosActualizacion.nombre) {
      const productoExiste = await Producto.findOne({ 
        nombre: new RegExp(`^${datosActualizacion.nombre}$`, 'i'),
        _id: { $ne: id }
      });

      if (productoExiste) {
        return res.error('Ya existe otro producto con este nombre', 400);
      }
    }

    datosActualizacion.fechaActualizacion = new Date();

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      datosActualizacion,
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('categoria', 'nombre descripcion')
    .select('-__v');

    if (!productoActualizado) {
      return res.error('Producto no encontrado', 404);
    }

    res.success(
      { producto: productoActualizado },
      'Producto actualizado exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const eliminarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de producto inválido', 400);
    }

    const productoEliminado = await Producto.findByIdAndDelete(id);

    if (!productoEliminado) {
      return res.error('Producto no encontrado', 404);
    }

    res.success(
      { id: productoEliminado._id },
      'Producto eliminado exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const actualizarStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, operacion } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de producto inválido', 400);
    }

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.error('Producto no encontrado', 404);
    }

    let nuevoStock;

    switch (operacion) {
      case 'establecer':
        nuevoStock = stock;
        break;
      case 'incrementar':
        nuevoStock = producto.stock + stock;
        break;
      case 'decrementar':
        nuevoStock = producto.stock - stock;
        break;
      default:
        return res.error('Operación inválida. Use: establecer, incrementar o decrementar', 400);
    }

    if (nuevoStock < 0) {
      return res.error('El stock no puede ser negativo', 400);
    }

    producto.stock = nuevoStock;
    producto.fechaActualizacion = new Date();

    await producto.save();

    const productoActualizado = await Producto.findById(id)
      .populate('categoria', 'nombre descripcion')
      .select('-__v');

    res.success(
      { producto: productoActualizado },
      'Stock actualizado exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const buscarProductos = async (req, res, next) => {
  try {
    const { termino } = req.query;

    if (!termino || termino.trim().length === 0) {
      return res.error('Término de búsqueda requerido', 400);
    }

    const expresionRegular = new RegExp(termino.trim(), 'i');

    const productos = await Producto.find({
      $or: [
        { nombre: expresionRegular },
        { descripcion: expresionRegular },
        { etiquetas: { $in: [expresionRegular] } }
      ],
      disponible: true
    })
    .populate('categoria', 'nombre descripcion')
    .select('-__v')
    .limit(50)
    .sort({ nombre: 1 });

    res.success({
      productos,
      total: productos.length,
      terminoBusqueda: termino.trim()
    });

  } catch (error) {
    next(error);
  }
};

const obtenerProductosDestacados = async (req, res, next) => {
  try {
    const limite = parseInt(req.query.limite) || 10;

    const productos = await Producto.find({
      disponible: true,
      stock: { $gt: 0 }
    })
    .populate('categoria', 'nombre descripcion')
    .select('-__v')
    .sort({ fechaCreacion: -1 })
    .limit(limite);

    res.success({ productos });

  } catch (error) {
    next(error);
  }
};

const filtrarProductos = async (req, res, next) => {
  try {
    const { precioMin, precioMax, marca } = req.query;
    const filtros = {};

    if (precioMin || precioMax) {
      filtros.precio = {};
      if (precioMin) filtros.precio.$gte = parseFloat(precioMin);
      if (precioMax) filtros.precio.$lte = parseFloat(precioMax);
    }

    if (marca) {
      filtros['especificaciones.marca'] = new RegExp(marca, 'i');
    }

    const productos = await Producto.find(filtros)
      .populate('categoria', 'nombre descripcion')
      .select('-__v');

    res.success({ productos, filtros });

  } catch (error) {
    next(error);
  }
};

const obtenerProductosTop = async (req, res, next) => {
  try {
    const productos = await Producto.aggregate([
      {
        $lookup: {
          from: 'resenas',
          localField: '_id',
          foreignField: 'producto',
          as: 'resenas'
        }
      },
      {
        $addFields: {
          totalResenas: { $size: '$resenas' }
        }
      },
      {
        $match: {
          totalResenas: { $gte: 1 }
        }
      },
      {
        $sort: { totalResenas: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'categorias',
          localField: 'categoria',
          foreignField: '_id',
          as: 'categoria'
        }
      },
      {
        $unwind: '$categoria'
      }
    ]);

    res.success({ productos });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  actualizarStock,
  buscarProductos,
  obtenerProductosDestacados,
  filtrarProductos,
  obtenerProductosTop
};
