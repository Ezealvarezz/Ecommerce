const express = require('express');
const {
  obtenerCarrito,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto,
  limpiarCarrito,
  verificarDisponibilidad
} = require('../controllers/controladorCarrito');

const { autenticar } = require('../middleware/autenticacion');
const { validar, esquemasCarrito } = require('../middleware/validacion');

const router = express.Router();

router.use(autenticar);

router.get('/', obtenerCarrito);

router.post(
  '/',
  validar(esquemasCarrito.agregarItem),
  agregarProducto
);

router.put(
  '/',
  validar(esquemasCarrito.actualizarItem),
  actualizarCantidad
);

router.delete('/:idProducto', eliminarProducto);

router.delete('/', limpiarCarrito);

router.get('/verificar-disponibilidad', verificarDisponibilidad);

module.exports = router;
