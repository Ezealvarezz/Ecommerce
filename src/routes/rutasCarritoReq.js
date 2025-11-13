const express = require('express');
const {
    obtenerCarritoPorUsuario,
    obtenerTotalCarrito,
    agregarProducto,
    actualizarCantidad,
    eliminarProducto,
    limpiarCarrito
} = require('../controllers/controladorCarrito');

const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

router.get('/usuario/:usuarioId', autenticar, obtenerCarritoPorUsuario);

router.get('/usuario/:usuarioId/total', autenticar, obtenerTotalCarrito);

router.post('/', autenticar, agregarProducto);

router.put('/', autenticar, actualizarCantidad);

router.delete('/productos/:idProducto', autenticar, eliminarProducto);

router.delete('/', autenticar, limpiarCarrito);

module.exports = router;
