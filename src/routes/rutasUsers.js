const express = require('express');
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  registrarUsuario,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/controladorUsuarios');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');

const router = express.Router();

router.post('/', registrarUsuario);

router.get('/', requerirAdmin, obtenerUsuarios);

router.get('/:id', requerirAdmin, obtenerUsuarioPorId);

router.put('/:id', requerirAdmin, actualizarUsuario);

router.delete('/:id', requerirAdmin, eliminarUsuario);

module.exports = router;
