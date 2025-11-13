const express = require('express');
const {
  obtenerResenas,
  obtenerResenaPorId,
  crearResena,
  actualizarResena,
  eliminarResena,
  obtenerResenasPorProducto,
  obtenerPromedioCalificaciones
} = require('../controllers/controladorResenas');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');

const router = express.Router();

router.get('/', obtenerResenas);

router.get('/producto/:productId', obtenerResenasPorProducto);

router.get('/top', obtenerPromedioCalificaciones);

router.get('/:id', obtenerResenaPorId);

router.post('/', autenticar, crearResena);

router.put('/:id', autenticar, actualizarResena);

router.delete('/:id', autenticar, eliminarResena);

module.exports = router;
