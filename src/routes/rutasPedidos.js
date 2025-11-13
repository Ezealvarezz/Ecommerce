const express = require('express');
const {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstadoPedido,
  cancelarPedido,
  obtenerEstadisticasPedidos
} = require('../controllers/controladorPedidos');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');
const { validar, esquemasPedido } = require('../middleware/validacion');

const router = express.Router();

router.use(autenticar);

router.get('/', obtenerPedidos);

router.get('/estadisticas', requerirAdmin, obtenerEstadisticasPedidos);

router.get('/:id', obtenerPedidoPorId);

router.post(
  '/',
  validar(esquemasPedido.crear),
  crearPedido
);

router.patch(
  '/:id/estado',
  requerirAdmin,
  validar(esquemasPedido.actualizarEstado),
  actualizarEstadoPedido
);

router.patch('/:id/cancelar', cancelarPedido);

module.exports = router;
