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
const { validarEsquema } = require('../middleware/validacion');
const { 
  esquemaCrearPedido,
  esquemaActualizarEstado 
} = require('../validation/esquemasPedidos');

const router = express.Router();

router.use(autenticar);

router.get('/', obtenerPedidos);

router.get('/estadisticas', requerirAdmin, obtenerEstadisticasPedidos);

router.get('/:id', obtenerPedidoPorId);

router.post(
  '/',
  validarEsquema(esquemaCrearPedido),
  crearPedido
);

router.patch(
  '/:id/estado',
  requerirAdmin,
  validarEsquema(esquemaActualizarEstado),
  actualizarEstadoPedido
);

router.patch('/:id/cancelar', cancelarPedido);

module.exports = router;