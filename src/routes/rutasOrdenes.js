const express = require('express');
const {
  obtenerOrdenes,
  obtenerOrdenPorId,
  crearOrden
} = require('../controllers/controladorOrdenes');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');

const router = express.Router();

router.get('/', requerirAdmin, obtenerOrdenes);

router.get('/:id', autenticar, obtenerOrdenPorId);

router.post('/', autenticar, crearOrden);

module.exports = router;
