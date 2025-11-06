const Joi = require('joi');

const esquemaCrearCategoria = Joi.object({
  nombre: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'El nombre de la categoría es requerido',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 50 caracteres'
  }),
  descripcion: Joi.string().min(10).max(200).optional(),
  activa: Joi.boolean().default(true)
});

const esquemaActualizarCategoria = Joi.object({
  nombre: Joi.string().min(2).max(50).optional(),
  descripcion: Joi.string().min(10).max(200).optional(),
  activa: Joi.boolean().optional()
});

module.exports = {
  esquemaCrearCategoria,
  esquemaActualizarCategoria
};