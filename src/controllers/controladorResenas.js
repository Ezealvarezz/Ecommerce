const Resena = require('../models/Resena');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const { mongoose } = require('mongoose');

const crearResena = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const { producto: idProducto, calificacion, comentario } = req.body;

    if (!mongoose.Types.ObjectId.isValid(idProducto)) {
      return res.error('ID de producto inválido', 400);
    }

    const producto = await Producto.findById(idProducto);
    if (!producto) {
      return res.error('Producto no encontrado', 404);
    }

    const pedidoConProducto = await Pedido.findOne({
      usuario: idUsuario,
      'items.producto': idProducto,
      estado: 'entregado'
    });

    if (!pedidoConProducto) {
      return res.error('Solo puedes reseñar productos que hayas comprado', 400);
    }

    const resenaExistente = await Resena.findOne({
      usuario: idUsuario,
      producto: idProducto
    });

    if (resenaExistente) {
      return res.error('Ya has reseñado este producto', 400);
    }

    const nuevaResena = new Resena({
      usuario: idUsuario,
      producto: idProducto,
      calificacion,
      comentario
    });

    const resenaGuardada = await nuevaResena.save();

    await actualizarCalificacionPromedio(idProducto);

    const resenaCompleta = await Resena.findById(resenaGuardada._id)
      .populate('usuario', 'nombre')
      .populate('producto', 'nombre imagenes');

    res.success(
      { resena: resenaCompleta },
      'Reseña creada exitosamente',
      201
    );

  } catch (error) {
    next(error);
  }
};

const obtenerResenasProducto = async (req, res, next) => {
  try {
    const { idProducto } = req.params;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const saltar = (pagina - 1) * limite;

    if (!mongoose.Types.ObjectId.isValid(idProducto)) {
      return res.error('ID de producto inválido', 400);
    }

    const producto = await Producto.findById(idProducto);
    if (!producto) {
      return res.error('Producto no encontrado', 404);
    }

    const filtros = { producto: idProducto };

    if (req.query.calificacion) {
      filtros.calificacion = parseInt(req.query.calificacion);
    }

    let ordenamiento = { fechaCreacion: -1 };

    if (req.query.ordenar) {
      switch (req.query.ordenar) {
        case 'recientes':
          ordenamiento = { fechaCreacion: -1 };
          break;
        case 'antiguos':
          ordenamiento = { fechaCreacion: 1 };
          break;
        case 'calificacion_alta':
          ordenamiento = { calificacion: -1, fechaCreacion: -1 };
          break;
        case 'calificacion_baja':
          ordenamiento = { calificacion: 1, fechaCreacion: -1 };
          break;
      }
    }

    const resenas = await Resena.find(filtros)
      .populate('usuario', 'nombre')
      .sort(ordenamiento)
      .skip(saltar)
      .limit(limite)
      .select('-__v');

    const totalResenas = await Resena.countDocuments(filtros);
    const totalPaginas = Math.ceil(totalResenas / limite);

    const estadisticasCalificacion = await Resena.aggregate([
      { $match: { producto: new mongoose.Types.ObjectId(idProducto) } },
      {
        $group: {
          _id: '$calificacion',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    const distribucionCalificaciones = {};
    for (let i = 1; i <= 5; i++) {
      distribucionCalificaciones[i] = 0;
    }
    
    estadisticasCalificacion.forEach(stat => {
      distribucionCalificaciones[stat._id] = stat.cantidad;
    });

    const promedioCalificacion = await Resena.aggregate([
      { $match: { producto: new mongoose.Types.ObjectId(idProducto) } },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$calificacion' }
        }
      }
    ]);

    res.success({
      resenas,
      estadisticas: {
        totalResenas,
        promedioCalificacion: promedioCalificacion[0]?.promedio || 0,
        distribucionCalificaciones
      },
      informacionPaginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalResenas,
        limite,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas
      }
    });

  } catch (error) {
    next(error);
  }
};

const obtenerResenasPorUsuario = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const saltar = (pagina - 1) * limite;

    const resenas = await Resena.find({ usuario: idUsuario })
      .populate({
        path: 'producto',
        select: 'nombre imagenes categoria precio',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .select('-__v');

    const totalResenas = await Resena.countDocuments({ usuario: idUsuario });
    const totalPaginas = Math.ceil(totalResenas / limite);

    res.success({
      resenas,
      informacionPaginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalResenas,
        limite,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas
      }
    });

  } catch (error) {
    next(error);
  }
};

const actualizarResena = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const { calificacion, comentario } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de reseña inválido', 400);
    }

    const resena = await Resena.findOne({
      _id: id,
      usuario: idUsuario
    });

    if (!resena) {
      return res.error('Reseña no encontrada o no tienes permisos para editarla', 404);
    }

    const fechaCreacion = new Date(resena.fechaCreacion);
    const ahora = new Date();
    const diferenciaHoras = (ahora - fechaCreacion) / (1000 * 60 * 60);

    if (diferenciaHoras > 24) {
      return res.error('Solo puedes editar reseñas dentro de las primeras 24 horas', 400);
    }

    resena.calificacion = calificacion;
    resena.comentario = comentario;
    resena.fechaActualizacion = new Date();

    await resena.save();

    await actualizarCalificacionPromedio(resena.producto);

    const resenaActualizada = await Resena.findById(id)
      .populate('usuario', 'nombre')
      .populate('producto', 'nombre imagenes');

    res.success(
      { resena: resenaActualizada },
      'Reseña actualizada exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const eliminarResena = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de reseña inválido', 400);
    }

    const filtros = { _id: id };
    if (!esAdmin) {
      filtros.usuario = idUsuario;
    }

    const resena = await Resena.findOne(filtros);
    if (!resena) {
      return res.error('Reseña no encontrada o no tienes permisos para eliminarla', 404);
    }

    const idProducto = resena.producto;

    await Resena.findByIdAndDelete(id);

    await actualizarCalificacionPromedio(idProducto);

    res.success(
      { id },
      'Reseña eliminada exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const reportarResena = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo, descripcion } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de reseña inválido', 400);
    }

    const resena = await Resena.findById(id);
    if (!resena) {
      return res.error('Reseña no encontrada', 404);
    }

    const nuevoReporte = {
      usuario: req.usuario.id,
      motivo,
      descripcion,
      fecha: new Date()
    };

    resena.reportes.push(nuevoReporte);
    await resena.save();

    res.success(
      null,
      'Reseña reportada exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const obtenerResenasReportadas = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const saltar = (pagina - 1) * limite;

    const resenas = await Resena.find({
      reportes: { $exists: true, $not: { $size: 0 } }
    })
    .populate('usuario', 'nombre email')
    .populate('producto', 'nombre')
    .populate('reportes.usuario', 'nombre email')
    .sort({ 'reportes.0.fecha': -1 })
    .skip(saltar)
    .limit(limite);

    const totalResenas = await Resena.countDocuments({
      reportes: { $exists: true, $not: { $size: 0 } }
    });

    const totalPaginas = Math.ceil(totalResenas / limite);

    res.success({
      resenas,
      informacionPaginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalResenas,
        limite,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas
      }
    });

  } catch (error) {
    next(error);
  }
};

const actualizarCalificacionPromedio = async (idProducto) => {
  const estadisticas = await Resena.aggregate([
    { $match: { producto: new mongoose.Types.ObjectId(idProducto) } },
    {
      $group: {
        _id: null,
        promedioCalificacion: { $avg: '$calificacion' },
        totalResenas: { $sum: 1 }
      }
    }
  ]);

  const { promedioCalificacion = 0, totalResenas = 0 } = estadisticas[0] || {};

  await Producto.findByIdAndUpdate(idProducto, {
    calificacionPromedio: Math.round(promedioCalificacion * 10) / 10,
    totalResenas
  });
};

const obtenerResenas = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const saltar = (pagina - 1) * limite;

    const resenas = await Resena.find()
      .populate('usuario', 'nombre email')
      .populate('producto', 'nombre categoria')
      .populate('producto.categoria', 'nombre')
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .select('-__v');

    const totalResenas = await Resena.countDocuments();

    res.success({
      resenas,
      total: totalResenas,
      pagina,
      limite
    });

  } catch (error) {
    next(error);
  }
};

const obtenerResenaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de reseña inválido', 400);
    }

    const resena = await Resena.findById(id)
      .populate('usuario', 'nombre email')
      .populate('producto', 'nombre categoria precio')
      .select('-__v');

    if (!resena) {
      return res.error('Reseña no encontrada', 404);
    }

    res.success({ resena });

  } catch (error) {
    next(error);
  }
};

const obtenerResenasPorProducto = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const saltar = (pagina - 1) * limite;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.error('ID de producto inválido', 400);
    }

    const resenas = await Resena.find({ producto: productId })
      .populate('usuario', 'nombre')
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite)
      .select('-__v');

    const totalResenas = await Resena.countDocuments({ producto: productId });

    const promedioCalificacion = await Resena.aggregate([
      { $match: { producto: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$calificacion' }
        }
      }
    ]);

    res.success({
      resenas,
      total: totalResenas,
      promedioCalificacion: promedioCalificacion[0]?.promedio || 0,
      pagina,
      limite
    });

  } catch (error) {
    next(error);
  }
};

const obtenerPromedioCalificaciones = async (req, res, next) => {
  try {
    const promedios = await Resena.aggregate([
      {
        $group: {
          _id: '$producto',
          promedioCalificacion: { $avg: '$calificacion' },
          totalResenas: { $sum: 1 }
        }
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
        $lookup: {
          from: 'categorias',
          localField: 'producto.categoria',
          foreignField: '_id',
          as: 'categoria'
        }
      },
      {
        $unwind: '$categoria'
      },
      {
        $project: {
          'producto.nombre': 1,
          'producto.precio': 1,
          'categoria.nombre': 1,
          promedioCalificacion: { $round: ['$promedioCalificacion', 2] },
          totalResenas: 1
        }
      },
      {
        $sort: { promedioCalificacion: -1, totalResenas: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.success({ promedios });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearResena,
  obtenerResenasProducto,
  obtenerResenasPorUsuario,
  actualizarResena,
  eliminarResena,
  reportarResena,
  obtenerResenasReportadas,
  obtenerResenas,
  obtenerResenaPorId,
  obtenerResenasPorProducto,
  obtenerPromedioCalificaciones
};
