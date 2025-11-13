const Joi = require('joi');

const esquemaCrearPedido = Joi.object({
  direccionEntrega: Joi.object({
    calle: Joi.string().required(),
    ciudad: Joi.string().required(),
    codigoPostal: Joi.string().required(),
    pais: Joi.string().required()
  }).required().messages({
    'any.required': 'La dirección de entrega es requerida'
  }),
  metodoPago: Joi.string().valid('tarjeta', 'paypal', 'transferencia', 'contado').required().messages({
    'any.only': 'Método de pago inválido',
    'any.required': 'El método de pago es requerido'
  }),
  notas: Joi.string().max(500).optional()
});

const esquemaActualizarEstado = Joi.object({
  estado: Joi.string().valid('pendiente', 'confirmado', 'procesando', 'enviado', 'entregado', 'cancelado').required().messages({
    'any.only': 'Estado inválido',
    'any.required': 'El estado es requerido'
  }),
  notasAdmin: Joi.string().max(500).optional()
});

module.exports = {
  esquemaCrearPedido,
  esquemaActualizarEstado
};
