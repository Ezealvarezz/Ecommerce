const express = require('express');
const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  actualizarStock,
  buscarProductos,
  obtenerProductosDestacados
} = require('../controllers/controladorProductos');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');
const { validarEsquema } = require('../middleware/validacion');
const { 
  esquemaCrearProducto,
  esquemaActualizarProducto,
  esquemaActualizarStock
} = require('../validation/esquemasProducto');

const router = express.Router();

router.get('/', obtenerProductos);

router.get('/buscar', buscarProductos);

router.get('/destacados', obtenerProductosDestacados);

router.get('/:id', obtenerProductoPorId);

router.post(
  '/',
  autenticar,
  requerirAdmin,
  validarEsquema(esquemaCrearProducto),
  crearProducto
);

router.put(
  '/:id',
  autenticar,
  requerirAdmin,
  validarEsquema(esquemaActualizarProducto),
  actualizarProducto
);

router.patch(
  '/:id/stock',
  autenticar,
  requerirAdmin,
  validarEsquema(esquemaActualizarStock),
  actualizarStock
);

router.delete(
  '/:id',
  autenticar,
  requerirAdmin,
  eliminarProducto
);

module.exports = router;