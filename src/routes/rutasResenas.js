const express = require('express');
const {
  crearResena,
  obtenerResenasProducto,
  obtenerResenasPorUsuario,
  actualizarResena,
  eliminarResena,
  reportarResena,
  obtenerResenasReportadas
} = require('../controllers/controladorResenas');

const { autenticar, requerirAdmin } = require('../middleware/autenticacion');
const { validarEsquema } = require('../middleware/validacion');
const { 
  esquemaCrearResena,
  esquemaActualizarResena,
  esquemaReportarResena 
} = require('../validation/esquemasResenas');

const router = express.Router();

router.get('/producto/:idProducto', obtenerResenasProducto);

router.get('/reportadas', autenticar, requerirAdmin, obtenerResenasReportadas);

router.get('/usuario', autenticar, obtenerResenasPorUsuario);

router.post(
  '/',
  autenticar,
  validarEsquema(esquemaCrearResena),
  crearResena
);

router.put(
  '/:id',
  autenticar,
  validarEsquema(esquemaActualizarResena),
  actualizarResena
);

router.delete('/:id', autenticar, eliminarResena);

router.post(
  '/:id/reportar',
  autenticar,
  validarEsquema(esquemaReportarResena),
  reportarResena
);

module.exports = router;