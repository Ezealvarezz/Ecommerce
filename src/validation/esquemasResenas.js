const Joi = require('joi');

const esquemaCrearResena = Joi.object({
  idProducto: Joi.string().hex().length(24).required().messages({
    'string.empty': 'El ID del producto es requerido',
    'string.length': 'ID de producto inválido'
  }),
  calificacion: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'La calificación debe ser un número',
    'number.integer': 'La calificación debe ser un número entero',
    'number.min': 'La calificación mínima es 1',
    'number.max': 'La calificación máxima es 5',
    'any.required': 'La calificación es requerida'
  }),
  comentario: Joi.string().min(10).max(500).required().messages({
    'string.empty': 'El comentario es requerido',
    'string.min': 'El comentario debe tener al menos 10 caracteres',
    'string.max': 'El comentario no puede exceder 500 caracteres'
  })
});

const esquemaActualizarResena = Joi.object({
  calificacion: Joi.number().integer().min(1).max(5).optional(),
  comentario: Joi.string().min(10).max(500).optional()
});

const esquemaReportarResena = Joi.object({
  motivo: Joi.string().valid('spam', 'lenguaje_inapropiado', 'contenido_falso', 'otro').required().messages({
    'any.only': 'Motivo de reporte inválido',
    'any.required': 'El motivo del reporte es requerido'
  }),
  descripcion: Joi.string().max(300).optional()
});

module.exports = {
  esquemaCrearResena,
  esquemaActualizarResena,
  esquemaReportarResena
};