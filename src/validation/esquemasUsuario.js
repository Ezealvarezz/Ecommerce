const Joi = require('joi');

const esquemaRegistro = Joi.object({
  nombre: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'El nombre es requerido',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 50 caracteres'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'El email es requerido',
    'string.email': 'Debe proporcionar un email válido'
  }),
  contrasena: Joi.string().min(6).required().messages({
    'string.empty': 'La contraseña es requerida',
    'string.min': 'La contraseña debe tener al menos 6 caracteres'
  }),
  telefono: Joi.string().min(10).max(15).optional(),
  direccion: Joi.object({
    calle: Joi.string().required(),
    ciudad: Joi.string().required(),
    codigoPostal: Joi.string().required(),
    pais: Joi.string().required()
  }).optional()
});

const esquemaLogin = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'El email es requerido',
    'string.email': 'Debe proporcionar un email válido'
  }),
  contrasena: Joi.string().required().messages({
    'string.empty': 'La contraseña es requerida'
  })
});

const esquemaActualizarPerfil = Joi.object({
  nombre: Joi.string().min(2).max(50).optional(),
  telefono: Joi.string().min(10).max(15).optional(),
  direccion: Joi.object({
    calle: Joi.string().required(),
    ciudad: Joi.string().required(),
    codigoPostal: Joi.string().required(),
    pais: Joi.string().required()
  }).optional()
});

const esquemaCambiarContrasena = Joi.object({
  contrasenaActual: Joi.string().required().messages({
    'string.empty': 'La contraseña actual es requerida'
  }),
  contrasenaNueva: Joi.string().min(6).required().messages({
    'string.empty': 'La nueva contraseña es requerida',
    'string.min': 'La nueva contraseña debe tener al menos 6 caracteres'
  })
});

module.exports = {
  esquemaRegistro,
  esquemaLogin,
  esquemaActualizarPerfil,
  esquemaCambiarContrasena
};
