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
const { validarEsquema } = require('../middleware/validacion');
const { 
  esquemaAgregarProducto,
  esquemaActualizarCantidad 
} = require('../validation/esquemasCarrito');

const router = express.Router();

router.use(autenticar);

router.get('/', obtenerCarrito);

router.post(
  '/productos',
  validarEsquema(esquemaAgregarProducto),
  agregarProducto
);

router.put(
  '/productos',
  validarEsquema(esquemaActualizarCantidad),
  actualizarCantidad
);

router.delete('/productos/:idProducto', eliminarProducto);

router.delete('/', limpiarCarrito);

router.get('/verificar-disponibilidad', verificarDisponibilidad);

module.exports = router;