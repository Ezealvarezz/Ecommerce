const express = require('express');
const {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerProductosPorCategoria,
  obtenerCategoriasActivas
} = require('../controllers/controladorCategorias');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');
const { validarEsquema } = require('../middleware/validacion');
const { 
  esquemaCrearCategoria,
  esquemaActualizarCategoria 
} = require('../validation/esquemasCategorias');

const router = express.Router();

router.get('/', obtenerCategorias);

router.get('/activas', obtenerCategoriasActivas);

router.get('/:id', obtenerCategoriaPorId);

router.get('/:id/productos', obtenerProductosPorCategoria);

router.post(
  '/',
  autenticar,
  requerirAdmin,
  crearCategoria
);

router.put(
  '/:id',
  autenticar,
  requerirAdmin,
  validarEsquema(esquemaActualizarCategoria),
  actualizarCategoria
);

router.delete(
  '/:id',
  autenticar,
  requerirAdmin,
  eliminarCategoria
);

module.exports = router;
