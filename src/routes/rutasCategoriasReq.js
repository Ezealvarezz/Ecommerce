const express = require('express');
const {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerEstadisticasCategorias
} = require('../controllers/controladorCategorias');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');

const router = express.Router();

router.get('/', obtenerCategorias);

router.get('/stats', obtenerEstadisticasCategorias);

router.get('/:id', obtenerCategoriaPorId);

router.post('/', autenticar, requerirAdmin, crearCategoria);

router.put('/:id', autenticar, requerirAdmin, actualizarCategoria);

router.delete('/:id', autenticar, requerirAdmin, eliminarCategoria);

module.exports = router;
