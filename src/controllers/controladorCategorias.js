const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const { mongoose } = require('mongoose');

const obtenerCategorias = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const saltar = (pagina - 1) * limite;

    const filtros = {};

    if (req.query.buscar) {
      filtros.$or = [
        { nombre: new RegExp(req.query.buscar, 'i') },
        { descripcion: new RegExp(req.query.buscar, 'i') }
      ];
    }

    if (req.query.activa !== undefined) {
      filtros.activa = req.query.activa === 'true';
    }

    const categorias = await Categoria.find(filtros)
      .sort({ nombre: 1 })
      .skip(saltar)
      .limit(limite)
      .select('-__v');

    const totalCategorias = await Categoria.countDocuments(filtros);
    const totalPaginas = Math.ceil(totalCategorias / limite);

    res.success({
      categorias,
      informacionPaginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalCategorias,
        limite,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas
      }
    });

  } catch (error) {
    next(error);
  }
};

const obtenerCategoriaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de categoría inválido', 400);
    }

    const categoria = await Categoria.findById(id).select('-__v');

    if (!categoria) {
      return res.error('Categoría no encontrada', 404);
    }

    const totalProductos = await Producto.countDocuments({ 
      categoria: id,
      disponible: true 
    });

    res.success({ 
      categoria: {
        ...categoria.toObject(),
        totalProductos
      }
    });

  } catch (error) {
    next(error);
  }
};

const crearCategoria = async (req, res, next) => {
  try {
    const { nombre, descripcion, activa } = req.body;

    const categoriaExiste = await Categoria.findOne({ 
      nombre: new RegExp(`^${nombre}$`, 'i') 
    });

    if (categoriaExiste) {
      return res.error('Ya existe una categoría con este nombre', 400);
    }

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      activa
    });

    const categoriaGuardada = await nuevaCategoria.save();

    res.success(
      { categoria: categoriaGuardada },
      'Categoría creada exitosamente',
      201
    );

  } catch (error) {
    next(error);
  }
};

const actualizarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de categoría inválido', 400);
    }

    const datosActualizacion = { ...req.body };
    delete datosActualizacion._id;
    delete datosActualizacion.__v;

    if (datosActualizacion.nombre) {
      const categoriaExiste = await Categoria.findOne({ 
        nombre: new RegExp(`^${datosActualizacion.nombre}$`, 'i'),
        _id: { $ne: id }
      });

      if (categoriaExiste) {
        return res.error('Ya existe otra categoría con este nombre', 400);
      }
    }

    datosActualizacion.fechaActualizacion = new Date();

    const categoriaActualizada = await Categoria.findByIdAndUpdate(
      id,
      datosActualizacion,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-__v');

    if (!categoriaActualizada) {
      return res.error('Categoría no encontrada', 404);
    }

    res.success(
      { categoria: categoriaActualizada },
      'Categoría actualizada exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const eliminarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de categoría inválido', 400);
    }

    const productosAsociados = await Producto.countDocuments({ categoria: id });

    if (productosAsociados > 0) {
      return res.error(
        `No se puede eliminar la categoría. Tiene ${productosAsociados} producto(s) asociado(s)`,
        400
      );
    }

    const categoriaEliminada = await Categoria.findByIdAndDelete(id);

    if (!categoriaEliminada) {
      return res.error('Categoría no encontrada', 404);
    }

    res.success(
      { id: categoriaEliminada._id },
      'Categoría eliminada exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const obtenerProductosPorCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const saltar = (pagina - 1) * limite;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de categoría inválido', 400);
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.error('Categoría no encontrada', 404);
    }

    const filtros = { categoria: id };

    if (req.query.disponible !== undefined) {
      filtros.disponible = req.query.disponible === 'true';
    }

    const productos = await Producto.find(filtros)
      .populate('categoria', 'nombre descripcion')
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .select('-__v');

    const totalProductos = await Producto.countDocuments(filtros);
    const totalPaginas = Math.ceil(totalProductos / limite);

    res.success({
      categoria: {
        _id: categoria._id,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion
      },
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

const obtenerCategoriasActivas = async (req, res, next) => {
  try {
    const categorias = await Categoria.find({ activa: true })
      .sort({ nombre: 1 })
      .select('nombre descripcion')
      .lean();

    res.success({ categorias });

  } catch (error) {
    next(error);
  }
};

const obtenerEstadisticasCategorias = async (req, res, next) => {
  try {
    const estadisticas = await Categoria.aggregate([
      {
        $lookup: {
          from: 'productos',
          localField: '_id',
          foreignField: 'categoria',
          as: 'productos'
        }
      },
      {
        $project: {
          nombre: 1,
          descripcion: 1,
          cantidadProductos: { $size: '$productos' }
        }
      },
      {
        $sort: { cantidadProductos: -1 }
      }
    ]);

    res.success({ estadisticas });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerProductosPorCategoria,
  obtenerCategoriasActivas,
  obtenerEstadisticasCategorias
};
