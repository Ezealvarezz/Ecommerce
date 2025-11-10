const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const { mongoose } = require('mongoose');

const obtenerCarrito = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;

    let carrito = await Carrito.findOne({ usuario: idUsuario })
      .populate({
        path: 'productos.producto',
        select: 'nombre precio imagenes disponible stock categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    if (!carrito) {
      carrito = new Carrito({
        usuario: idUsuario,
        productos: []
      });
      await carrito.save();
    }

    const productosDisponibles = carrito.productos.filter(item => 
      item.producto && 
      item.producto.disponible && 
      item.producto.stock > 0
    );

    if (productosDisponibles.length !== carrito.productos.length) {
      carrito.productos = productosDisponibles;
      await carrito.save();
    }

    await carrito.calcularTotales();

    res.success({ carrito });

  } catch (error) {
    next(error);
  }
};

const agregarProducto = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const { idProducto, cantidad } = req.body;

    if (!mongoose.Types.ObjectId.isValid(idProducto)) {
      return res.error('ID de producto inválido', 400);
    }

    if (!cantidad || cantidad < 1) {
      return res.error('La cantidad debe ser mayor a 0', 400);
    }

    const producto = await Producto.findById(idProducto);
    if (!producto) {
      return res.error('Producto no encontrado', 404);
    }

    if (!producto.disponible) {
      return res.error('El producto no está disponible', 400);
    }

    if (producto.stock < cantidad) {
      return res.error(`Stock insuficiente. Stock disponible: ${producto.stock}`, 400);
    }

    let carrito = await Carrito.findOne({ usuario: idUsuario });
    
    if (!carrito) {
      carrito = new Carrito({
        usuario: idUsuario,
        productos: []
      });
    }

    const productoExistente = carrito.productos.find(
      item => item.producto.toString() === idProducto
    );

    if (productoExistente) {
      const nuevaCantidad = productoExistente.cantidad + cantidad;
      
      if (producto.stock < nuevaCantidad) {
        return res.error(
          `Stock insuficiente. Cantidad en carrito: ${productoExistente.cantidad}, Stock disponible: ${producto.stock}`,
          400
        );
      }
      
      productoExistente.cantidad = nuevaCantidad;
      productoExistente.precioUnitario = producto.precio;
    } else {
      carrito.productos.push({
        producto: idProducto,
        cantidad,
        precioUnitario: producto.precio
      });
    }

    await carrito.save();
    await carrito.calcularTotales();

    const carritoPopulado = await Carrito.findById(carrito._id)
      .populate({
        path: 'productos.producto',
        select: 'nombre precio imagenes disponible stock categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    res.success(
      { carrito: carritoPopulado },
      'Producto agregado al carrito exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const actualizarCantidad = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const { idProducto, cantidad } = req.body;

    if (!mongoose.Types.ObjectId.isValid(idProducto)) {
      return res.error('ID de producto inválido', 400);
    }

    if (!cantidad || cantidad < 1) {
      return res.error('La cantidad debe ser mayor a 0', 400);
    }

    const producto = await Producto.findById(idProducto);
    if (!producto || !producto.disponible) {
      return res.error('Producto no disponible', 404);
    }

    if (producto.stock < cantidad) {
      return res.error(`Stock insuficiente. Stock disponible: ${producto.stock}`, 400);
    }

    const carrito = await Carrito.findOne({ usuario: idUsuario });
    if (!carrito) {
      return res.error('Carrito no encontrado', 404);
    }

    const productoEnCarrito = carrito.productos.find(
      item => item.producto.toString() === idProducto
    );

    if (!productoEnCarrito) {
      return res.error('Producto no encontrado en el carrito', 404);
    }

    productoEnCarrito.cantidad = cantidad;
    productoEnCarrito.precioUnitario = producto.precio;

    await carrito.save();
    await carrito.calcularTotales();

    const carritoPopulado = await Carrito.findById(carrito._id)
      .populate({
        path: 'productos.producto',
        select: 'nombre precio imagenes disponible stock categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    res.success(
      { carrito: carritoPopulado },
      'Cantidad actualizada exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const eliminarProducto = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const { idProducto } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idProducto)) {
      return res.error('ID de producto inválido', 400);
    }

    const carrito = await Carrito.findOne({ usuario: idUsuario });
    if (!carrito) {
      return res.error('Carrito no encontrado', 404);
    }

    const indiceProducto = carrito.productos.findIndex(
      item => item.producto.toString() === idProducto
    );

    if (indiceProducto === -1) {
      return res.error('Producto no encontrado en el carrito', 404);
    }

    carrito.productos.splice(indiceProducto, 1);

    await carrito.save();
    await carrito.calcularTotales();

    const carritoPopulado = await Carrito.findById(carrito._id)
      .populate({
        path: 'productos.producto',
        select: 'nombre precio imagenes disponible stock categoria',
        populate: {
          path: 'categoria',
          select: 'nombre'
        }
      });

    res.success(
      { carrito: carritoPopulado },
      'Producto eliminado del carrito exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const limpiarCarrito = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;

    const carrito = await Carrito.findOne({ usuario: idUsuario });
    if (!carrito) {
      return res.error('Carrito no encontrado', 404);
    }

    carrito.productos = [];
    await carrito.save();
    await carrito.calcularTotales();

    res.success(
      { carrito },
      'Carrito limpiado exitosamente'
    );

  } catch (error) {
    next(error);
  }
};

const verificarDisponibilidad = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;

    const carrito = await Carrito.findOne({ usuario: idUsuario })
      .populate({
        path: 'productos.producto',
        select: 'nombre precio disponible stock'
      });

    if (!carrito || carrito.productos.length === 0) {
      return res.error('Carrito vacío', 400);
    }

    const productosNoDisponibles = [];
    const productosStockInsuficiente = [];

    for (const item of carrito.productos) {
      if (!item.producto) {
        productosNoDisponibles.push({
          mensaje: 'Producto eliminado'
        });
        continue;
      }

      if (!item.producto.disponible) {
        productosNoDisponibles.push({
          id: item.producto._id,
          nombre: item.producto.nombre,
          motivo: 'Producto no disponible'
        });
      } else if (item.producto.stock < item.cantidad) {
        productosStockInsuficiente.push({
          id: item.producto._id,
          nombre: item.producto.nombre,
          cantidadSolicitada: item.cantidad,
          stockDisponible: item.producto.stock
        });
      }
    }

    const esDisponible = productosNoDisponibles.length === 0 && 
                        productosStockInsuficiente.length === 0;

    res.success({
      disponible: esDisponible,
      productosNoDisponibles,
      productosStockInsuficiente
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerCarrito,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto,
  limpiarCarrito,
  verificarDisponibilidad
};

