const express = require('express');
const {
  registrarUsuario,
  loginUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  obtenerMiPerfil,
  actualizarContrasena,
  obtenerEstadisticasUsuarios
} = require('../controllers/controladorUsuarios');
const { autenticar, requerirAdmin, requerirPropietarioOAdmin } = require('../middleware/autenticacion');
const { validar, esquemasUsuario } = require('../middleware/validacion');
const { limitadorRegistro, limitadorAutenticacion } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/registro', limitadorRegistro, registrarUsuario);
router.post('/login', limitadorAutenticacion, loginUsuario);

router.use(autenticar);

router.get('/me', obtenerMiPerfil);
router.put('/me/password', actualizarContrasena);

router.get('/', requerirAdmin, obtenerUsuarios);
router.get('/stats', requerirAdmin, obtenerEstadisticasUsuarios);

router.get('/:id', requerirPropietarioOAdmin(async (req) => req.params.id), obtenerUsuarioPorId);
router.put('/:id', requerirPropietarioOAdmin(async (req) => req.params.id), validar(esquemasUsuario.actualizar), actualizarUsuario);

router.delete('/:id', requerirAdmin, eliminarUsuario);

module.exports = router;
