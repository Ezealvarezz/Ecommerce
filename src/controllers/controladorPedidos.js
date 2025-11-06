const Pedido = require('../models/Pedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const { mongoose } = require('mongoose');

const crearPedido = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const { direccionEntrega, metodoPago, notas } = req.body;

    const carrito = await Carrito.findOne({ usuario: idUsuario })
      .populate('productos.producto');

    if (!carrito || carrito.productos.length === 0) {
      return res.error('El carrito está vacío', 400);
    }

    for (const item of carrito.productos) {
      if (!item.producto) {
        return res.error('Uno o más productos ya no están disponibles', 400);
      }

      if (!item.producto.disponible) {
        return res.error(
          `El producto "${item.producto.nombre}" no está disponible`,
          400
        );
      }

      if (item.producto.stock < item.cantidad) {
        return res.error(
          `Stock insuficiente para "${item.producto.nombre}". Stock disponible: ${item.producto.stock}`,
          400
        );
      }
    }

    await carrito.calcularTotales();

    const numeroPedido = await generarNumeroPedido();

    const nuevoPedido = new Pedido({
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

    const pedidoGuardado = await nuevoPedido.save();

    for (const item of carrito.productos) {
      await Producto.findByIdAndUpdate(
        item.producto._id,
        { 
          $inc: { stock: -item.cantidad },
          fechaActualizacion: new Date()
        }
      );
    }

    carrito.productos = [];
    await carrito.save();

    const pedidoCompleto = await Pedido.findById(pedidoGuardado._id)
      .populate('usuario', 'nombre email')
      .populate({
        path: 'productos.producto',
        select: 'nombre imagenes categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    res.success(
      { pedido: pedidoCompleto },
      'Pedido creado exitosamente',
      201
    );

  } catch (error) {
    next(error);
  }
};

const obtenerPedidos = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';
    
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const saltar = (pagina - 1) * limite;

    const filtros = esAdmin ? {} : { usuario: idUsuario };

    if (req.query.estado) {
      filtros.estado = req.query.estado;
    }

    if (req.query.fechaInicio && req.query.fechaFin) {
      filtros.fechaCreacion = {
        $gte: new Date(req.query.fechaInicio),
        $lte: new Date(req.query.fechaFin)
      };
    }

    const pedidos = await Pedido.find(filtros)
      .populate('usuario', 'nombre email')
      .populate({
        path: 'productos.producto',
        select: 'nombre imagenes categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      })
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite);

    const totalPedidos = await Pedido.countDocuments(filtros);
    const totalPaginas = Math.ceil(totalPedidos / limite);

    res.success({
      pedidos,
      informacionPaginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalPedidos,
        limite,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas
      }
    });

  } catch (error) {
    next(error);
  }
};

const obtenerPedidoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de pedido inválido', 400);
    }

    const filtros = { _id: id };
    if (!esAdmin) {
      filtros.usuario = idUsuario;
    }

    const pedido = await Pedido.findOne(filtros)
      .populate('usuario', 'nombre email telefono')
      .populate({
        path: 'productos.producto',
        select: 'nombre descripcion imagenes categoria especificaciones',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    if (!pedido) {
      return res.error('Pedido no encontrado', 404);
    }

    res.success({ pedido });

  } catch (error) {
    next(error);
  }
};

const actualizarEstadoPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, notasAdmin } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de pedido inválido', 400);
    }

    const estadosValidos = ['pendiente', 'confirmado', 'procesando', 'enviado', 'entregado', 'cancelado'];
    
    if (!estadosValidos.includes(estado)) {
      return res.error('Estado inválido', 400);
    }

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.error('Pedido no encontrado', 404);
    }

    if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
      return res.error('No se puede modificar un pedido entregado o cancelado', 400);
    }

    if (estado === 'cancelado' && pedido.estado !== 'pendiente') {
      return res.error('Solo se pueden cancelar pedidos en estado pendiente', 400);
    }

    if (estado === 'cancelado') {
      for (const item of pedido.productos) {
        await Producto.findByIdAndUpdate(
          item.producto,
          { 
            $inc: { stock: item.cantidad },
            fechaActualizacion: new Date()
          }
        );
      }
    }

    const historialEstado = {
      estado: estado,
      fecha: new Date(),
      notas: notasAdmin
    };

    pedido.estado = estado;
    pedido.historialEstados.push(historialEstado);
    
    if (estado === 'entregado') {
      pedido.fechaEntrega = new Date();
    }

    await pedido.save();

    const pedidoActualizado = await Pedido.findById(id)
      .populate('usuario', 'nombre email')
      .populate({
        path: 'productos.producto',
        select: 'nombre imagenes categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    res.success(
      { pedido: pedidoActualizado },
      'Estado del pedido actualizado exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const cancelarPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('ID de pedido inválido', 400);
    }

    const filtros = { _id: id };
    if (!esAdmin) {
      filtros.usuario = idUsuario;
    }

    const pedido = await Pedido.findOne(filtros);
    if (!pedido) {
      return res.error('Pedido no encontrado', 404);
    }

    if (pedido.estado !== 'pendiente' && pedido.estado !== 'confirmado') {
      return res.error('No se puede cancelar este pedido', 400);
    }

    for (const item of pedido.productos) {
      await Producto.findByIdAndUpdate(
        item.producto,
        { 
          $inc: { stock: item.cantidad },
          fechaActualizacion: new Date()
        }
      );
    }

    const historialEstado = {
      estado: 'cancelado',
      fecha: new Date(),
      notas: esAdmin ? 'Cancelado por administrador' : 'Cancelado por usuario'
    };

    pedido.estado = 'cancelado';
    pedido.historialEstados.push(historialEstado);

    await pedido.save();

    const pedidoActualizado = await Pedido.findById(id)
      .populate('usuario', 'nombre email')
      .populate({
        path: 'productos.producto',
        select: 'nombre imagenes categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    res.success(
      { pedido: pedidoActualizado },
      'Pedido cancelado exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const obtenerEstadisticasPedidos = async (req, res, next) => {
  try {
    const fechaInicio = req.query.fechaInicio 
      ? new Date(req.query.fechaInicio) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const fechaFin = req.query.fechaFin 
      ? new Date(req.query.fechaFin)
      : new Date();

    const filtroFecha = {
      fechaCreacion: { $gte: fechaInicio, $lte: fechaFin }
    };

    const [
      totalPedidos,
      pedidosPorEstado,
      ventasTotales,
      promedioVenta
    ] = await Promise.all([
      Pedido.countDocuments(filtroFecha),
      
      Pedido.aggregate([
        { $match: filtroFecha },
        { $group: { _id: '$estado', cantidad: { $sum: 1 } } }
      ]),
      
      Pedido.aggregate([
        { 
          $match: { 
            ...filtroFecha, 
            estado: { $ne: 'cancelado' } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      
      Pedido.aggregate([
        { 
          $match: { 
            ...filtroFecha, 
            estado: { $ne: 'cancelado' } 
          } 
        },
        { $group: { _id: null, promedio: { $avg: '$total' } } }
      ])
    ]);

    const estadisticas = {
      periodo: {
        fechaInicio,
        fechaFin
      },
      totalPedidos,
      distribucionEstados: pedidosPorEstado.reduce((acc, curr) => {
        acc[curr._id] = curr.cantidad;
        return acc;
      }, {}),
      ventasTotales: ventasTotales[0]?.total || 0,
      ventaPromedio: promedioVenta[0]?.promedio || 0
    };

    res.success({ estadisticas });

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
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstadoPedido,
  cancelarPedido,
  obtenerEstadisticasPedidos
};