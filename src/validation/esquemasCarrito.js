const Joi = require('joi');

const esquemaAgregarProducto = Joi.object({
  idProducto: Joi.string().hex().length(24).required().messages({
    'string.empty': 'El ID del producto es requerido',
    'string.length': 'ID de producto inválido'
  }),
  cantidad: Joi.number().integer().min(1).required().messages({
    'number.base': 'La cantidad debe ser un número',
    'number.integer': 'La cantidad debe ser un número entero',
    'number.min': 'La cantidad debe ser mayor a 0',
    'any.required': 'La cantidad es requerida'
  })
});

const esquemaActualizarCantidad = Joi.object({
  idProducto: Joi.string().hex().length(24).required().messages({
    'string.empty': 'El ID del producto es requerido',
    'string.length': 'ID de producto inválido'
  }),
  cantidad: Joi.number().integer().min(1).required().messages({
    'number.base': 'La cantidad debe ser un número',
    'number.integer': 'La cantidad debe ser un número entero',
    'number.min': 'La cantidad debe ser mayor a 0',
    'any.required': 'La cantidad es requerida'
  })
});

module.exports = {
  esquemaAgregarProducto,
  esquemaActualizarCantidad
};