const Joi = require('joi');

const esquemaCrearProducto = Joi.object({
  nombre: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'El nombre del producto es requerido',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres'
  }),
  descripcion: Joi.string().min(10).max(1000).required().messages({
    'string.empty': 'La descripción es requerida',
    'string.min': 'La descripción debe tener al menos 10 caracteres',
    'string.max': 'La descripción no puede exceder 1000 caracteres'
  }),
  precio: Joi.number().min(0).required().messages({
    'number.base': 'El precio debe ser un número',
    'number.min': 'El precio no puede ser negativo',
    'any.required': 'El precio es requerido'
  }),
  categoria: Joi.string().hex().length(24).required().messages({
    'string.empty': 'La categoría es requerida',
    'string.length': 'ID de categoría inválido'
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'El stock debe ser un número',
    'number.integer': 'El stock debe ser un número entero',
    'number.min': 'El stock no puede ser negativo',
    'any.required': 'El stock es requerido'
  }),
  imagenes: Joi.array().items(Joi.string().uri()).max(5).optional(),
  disponible: Joi.boolean().default(true),
  especificaciones: Joi.object().optional(),
  etiquetas: Joi.array().items(Joi.string()).max(10).optional()
});

const esquemaActualizarProducto = Joi.object({
  nombre: Joi.string().min(2).max(100).optional(),
  descripcion: Joi.string().min(10).max(1000).optional(),
  precio: Joi.number().min(0).optional(),
  categoria: Joi.string().hex().length(24).optional(),
  stock: Joi.number().integer().min(0).optional(),
  imagenes: Joi.array().items(Joi.string().uri()).max(5).optional(),
  disponible: Joi.boolean().optional(),
  especificaciones: Joi.object().optional(),
  etiquetas: Joi.array().items(Joi.string()).max(10).optional()
});

const esquemaActualizarStock = Joi.object({
  operacion: Joi.string().valid('establecer', 'incrementar', 'decrementar').required().messages({
    'any.only': 'La operación debe ser: establecer, incrementar o decrementar',
    'any.required': 'La operación es requerida'
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'El stock debe ser un número',
    'number.integer': 'El stock debe ser un número entero',
    'number.min': 'El stock no puede ser negativo',
    'any.required': 'El stock es requerido'
  })
});

module.exports = {
  esquemaCrearProducto,
  esquemaActualizarProducto,
  esquemaActualizarStock
};
