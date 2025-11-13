const Joi = require('joi');

const esquemasUsuario = {
  registro: Joi.object({
    nombre: Joi.string().min(2).max(50).required().messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 50 caracteres',
      'any.required': 'El nombre es obligatorio'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es obligatorio'
    }),
    contrasena: Joi.string().min(6).required().messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es obligatoria'
    }),
    telefono: Joi.string().pattern(/^\d{10,15}$/).required().messages({
      'string.pattern.base': 'El teléfono debe tener entre 10 y 15 dígitos',
      'any.required': 'El teléfono es obligatorio'
    }),
    direccion: Joi.object({
      calle: Joi.string().required(),
      ciudad: Joi.string().required(),
      codigoPostal: Joi.string().required(),
      pais: Joi.string().default('Argentina')
    }).required(),
    rol: Joi.string().valid('cliente', 'administrador').default('cliente')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    contrasena: Joi.string().required()
  }),

  actualizar: Joi.object({
    nombre: Joi.string().min(2).max(50),
    telefono: Joi.string().pattern(/^\d{10,15}$/),
    direccion: Joi.object({
      calle: Joi.string(),
      ciudad: Joi.string(),
      codigoPostal: Joi.string(),
      pais: Joi.string()
    })
  })
};

const esquemasProducto = {
  crear: Joi.object({
    nombre: Joi.string().min(2).max(100).required(),
    descripcion: Joi.string().min(10).max(1000).required(),
    precio: Joi.number().min(0).required(),
    stock: Joi.number().min(0).required(),
    categoria: Joi.string().required(),
    marca: Joi.string().min(2).max(50).required(),
    imagenes: Joi.array().items(Joi.string().uri()),
    especificaciones: Joi.object(),
    destacado: Joi.boolean().default(false),
    descuento: Joi.number().min(0).max(100).default(0)
  }),

  actualizar: Joi.object({
    nombre: Joi.string().min(2).max(100),
    descripcion: Joi.string().min(10).max(1000),
    precio: Joi.number().min(0),
    stock: Joi.number().min(0),
    categoria: Joi.string(),
    marca: Joi.string().min(2).max(50),
    imagenes: Joi.array().items(Joi.string().uri()),
    especificaciones: Joi.object(),
    destacado: Joi.boolean(),
    descuento: Joi.number().min(0).max(100),
    activo: Joi.boolean()
  }),

  actualizarStock: Joi.object({
    stock: Joi.number().min(0).required()
  })
};

const esquemasCategoria = {
  crear: Joi.object({
    nombre: Joi.string().min(2).max(50).required(),
    descripcion: Joi.string().min(10).max(500).required(),
    imagen: Joi.string().uri()
  }),

  actualizar: Joi.object({
    nombre: Joi.string().min(2).max(50),
    descripcion: Joi.string().min(10).max(500),
    imagen: Joi.string().uri(),
    activa: Joi.boolean()
  })
};

const esquemasCarrito = {
  agregarItem: Joi.object({
    producto: Joi.string().required(),
    cantidad: Joi.number().min(1).required()
  }),

  actualizarItem: Joi.object({
    cantidad: Joi.number().min(1).required()
  })
};

const esquemasPedido = {
  crear: Joi.object({
    metodoPago: Joi.object({
      tipo: Joi.string().valid('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'mercadopago').required(),
      detalles: Joi.object()
    }).required(),
    direccionEnvio: Joi.object({
      calle: Joi.string().required(),
      ciudad: Joi.string().required(),
      codigoPostal: Joi.string().required(),
      pais: Joi.string().required()
    }).required(),
    notas: Joi.string().max(500)
  }),

  actualizarEstado: Joi.object({
    estado: Joi.string().valid('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado').required(),
    numeroSeguimiento: Joi.string()
  })
};

const esquemasResena = {
  crear: Joi.object({
    producto: Joi.string().required(),
    calificacion: Joi.number().min(1).max(5).required(),
    comentario: Joi.string().min(10).max(1000).required()
  }),

  actualizar: Joi.object({
    calificacion: Joi.number().min(1).max(5),
    comentario: Joi.string().min(10).max(1000)
  }),

  respuesta: Joi.object({
    texto: Joi.string().min(10).max(500).required()
  })
};

const validar = (esquema) => {
  return (req, res, next) => {
    const { error } = esquema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errores = error.details.map(detalle => ({
        campo: detalle.path.join('.'),
        mensaje: detalle.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errores
      });
    }

    next();
  };
};

const validarConsulta = (esquema) => {
  return (req, res, next) => {
    const { error } = esquema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errores = error.details.map(detalle => ({
        campo: detalle.path.join('.'),
        mensaje: detalle.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errores
      });
    }

    next();
  };
};

module.exports = {
  validar,
  validarConsulta,
  esquemasUsuario,
  esquemasProducto,
  esquemasCategoria,
  esquemasCarrito,
  esquemasPedido,
  esquemasResena
};
