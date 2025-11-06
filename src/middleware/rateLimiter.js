const rateLimit = require('express-rate-limit');

const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const limitadorAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const limitadorRestablecerContrasena = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Demasiadas solicitudes de restablecimiento de contraseña, intenta de nuevo en 1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const limitadorRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos de registro, intenta de nuevo en 1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  limitadorGeneral,
  limitadorAutenticacion,
  limitadorRestablecerContrasena,
  limitadorRegistro
};