const Pedido = require('../models/Pedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const { mongoose } = require('mongoose');

const obtenerOrdenes = async (req, res, next) => {
try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const saltar = (pagina - 1) * limite;

    const ordenes = await Pedido.find()
        .populate('usuario', 'nombre email telefono')
        .populate({
        path: 'productos.producto',
        select: 'nombre imagenes categoria precio',
        populate: {
            path: 'categoria',
            select: 'nombre'
        }
    })
    .sort({ fechaCreacion: -1 })
      .skip(saltar)
    .limit(limite);

    const totalOrdenes = await Pedido.countDocuments();
    const totalPaginas = Math.ceil(totalOrdenes / limite);

    res.success({
        ordenes,
        informacionPaginacion: {
            paginaActual: pagina,
            totalPaginas,
            totalOrdenes,
            limite
        }
    });

} catch (error) {
    next(error);
}
};

const obtenerOrdenPorId = async (req, res, next) => {
try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.error('ID de orden inválido', 400);
    }

    const filtros = { _id: id };
    if (!esAdmin) {
      filtros.usuario = idUsuario;
    }

    const orden = await Pedido.findOne(filtros)
      .populate('usuario', 'nombre email telefono')
      .populate({
        path: 'productos.producto',
        select: 'nombre descripcion imagenes categoria especificaciones',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    if (!orden) {
      return res.error('Orden no encontrada', 404);
    }

    res.success({ orden });

  } catch (error) {
    next(error);
  }
};

const crearOrden = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const { direccionEntrega, metodoPago, notas } = req.body;

    const carrito = await Carrito.findOne({ usuario: idUsuario })
      .populate('productos.producto');

    if (!carrito || carrito.productos.length === 0) {
      return res.error('El carrito está vacío', 400);
    }

    for (const item of carrito.productos) {
      if (!item.producto || !item.producto.disponible) {
        return res.error('Uno o más productos no están disponibles', 400);
      }

      if (item.producto.stock < item.cantidad) {
        return res.error(
          `Stock insuficiente para "${item.producto.nombre}"`, 400
        );
      }
    }

    await carrito.calcularTotales();

    const numeroPedido = await generarNumeroPedido();

    const nuevaOrden = new Pedido({
      numeroPedido,
      usuario: idUsuario,
      productos: carrito.productos.map(item => ({
        producto: item.producto._id,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.cantidad * item.precioUnitario
      })),
      subtotal: carrito.subtotal,
      impuestos: carrito.impuestos,
      costoEnvio: carrito.costoEnvio,
      total: carrito.total,
      direccionEntrega,
      metodoPago,
      notas
    });

    const ordenGuardada = await nuevaOrden.save();

    for (const item of carrito.productos) {
      await Producto.findByIdAndUpdate(
        item.producto._id,
        { $inc: { stock: -item.cantidad } }
      );
    }

    carrito.productos = [];
    await carrito.save();

    const ordenCompleta = await Pedido.findById(ordenGuardada._id)
      .populate('usuario', 'nombre email')
      .populate({
        path: 'productos.producto',
        select: 'nombre imagenes categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    res.success({ orden: ordenCompleta }, 'Orden creada exitosamente', 201);

  } catch (error) {
    next(error);
  }
};

const actualizarOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de orden inválido', 400);
    }

    const filtros = { _id: id };
    if (!esAdmin) {
      filtros.usuario = idUsuario;
    }

    const datosActualizacion = { ...req.body };
    delete datosActualizacion._id;
    delete datosActualizacion.__v;

    const ordenActualizada = await Pedido.findOneAndUpdate(
      filtros,
      datosActualizacion,
      { new: true, runValidators: true }
    )
    .populate('usuario', 'nombre email')
    .populate('productos.producto', 'nombre precio');

    if (!ordenActualizada) {
      return res.error('Orden no encontrada', 404);
    }

    res.success({ orden: ordenActualizada }, 'Orden actualizada exitosamente');

  } catch (error) {
    next(error);
  }
};

const eliminarOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de orden inválido', 400);
    }

    const filtros = { _id: id };
    if (!esAdmin) {
      filtros.usuario = idUsuario;
    }

    const orden = await Pedido.findOne(filtros);
    if (!orden) {
      return res.error('Orden no encontrada', 404);
    }

    if (orden.estado !== 'pendiente') {
      return res.error('Solo se pueden eliminar órdenes pendientes', 400);
    }

    await Pedido.findByIdAndDelete(id);

    res.success({ id }, 'Orden eliminada exitosamente');

  } catch (error) {
    next(error);
  }
};

const obtenerEstadisticasOrdenes = async (req, res, next) => {
  try {
    const estadisticas = await Pedido.aggregate([
      {
        $group: {
          _id: '$estado',
          total: { $sum: 1 },
          montoTotal: { $sum: '$total' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    const resumen = await Pedido.aggregate([
      {
        $group: {
          _id: null,
          totalOrdenes: { $sum: 1 },
          montoTotalGeneral: { $sum: '$total' },
          montoPromedio: { $avg: '$total' }
        }
      }
    ]);

    res.success({
      estadisticasPorEstado: estadisticas,
      resumenGeneral: resumen[0] || {
        totalOrdenes: 0,
        montoTotalGeneral: 0,
        montoPromedio: 0
      }
    });

  } catch (error) {
    next(error);
  }
};

const obtenerOrdenesPorUsuario = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const saltar = (pagina - 1) * limite;

    const ordenes = await Pedido.find({ usuario: userId })
      .populate({
        path: 'productos.producto',
        select: 'nombre imagenes categoria precio',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite);

    const totalOrdenes = await Pedido.countDocuments({ usuario: userId });

    res.success({
      ordenes,
      total: totalOrdenes,
      pagina,
      limite
    });

  } catch (error) {
    next(error);
  }
};

const actualizarEstadoOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, notasAdmin } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de orden inválido', 400);
    }

    const orden = await Pedido.findById(id);
    if (!orden) {
      return res.error('Orden no encontrada', 404);
    }

    const historialEstado = {
      estado: estado,
      fecha: new Date(),
      notas: notasAdmin
    };

    orden.estado = estado;
    orden.historialEstados.push(historialEstado);

    if (estado === 'entregado') {
      orden.fechaEntrega = new Date();
    }

    await orden.save();

    const ordenActualizada = await Pedido.findById(id)
      .populate('usuario', 'nombre email')
      .populate('productos.producto', 'nombre precio');

    res.success({ orden: ordenActualizada }, 'Estado actualizado exitosamente');

  } catch (error) {
    next(error);
  }
};

const generarNumeroPedido = async () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  const prefijo = `ORD-${año}${mes}${dia}`;

  const ultimoPedido = await Pedido.findOne({
    numeroPedido: new RegExp(`^${prefijo}`)
  }).sort({ numeroPedido: -1 });

  let numeroSecuencial = 1;

  if (ultimoPedido) {
    const ultimoNumero = ultimoPedido.numeroPedido.split('-').pop();
    numeroSecuencial = parseInt(ultimoNumero) + 1;
  }

  return `${prefijo}-${String(numeroSecuencial).padStart(4, '0')}`;
};

module.exports = {
  obtenerOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  actualizarOrden,
  eliminarOrden,
  obtenerEstadisticasOrdenes,
  obtenerOrdenesPorUsuario,
  actualizarEstadoOrden
};
