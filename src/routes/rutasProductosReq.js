const express = require('express');
const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  filtrarProductos,
  obtenerProductosTop,
  actualizarStock
} = require('../controllers/controladorProductos');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');

const router = express.Router();

router.get('/', obtenerProductos);

router.get('/filtro', filtrarProductos);

router.get('/top', obtenerProductosTop);

router.get('/:id', obtenerProductoPorId);

router.post('/', autenticar, requerirAdmin, crearProducto);

router.put('/:id', autenticar, requerirAdmin, actualizarProducto);

router.delete('/:id', autenticar, requerirAdmin, eliminarProducto);

router.patch('/:id/stock', autenticar, requerirAdmin, actualizarStock);

module.exports = router;
