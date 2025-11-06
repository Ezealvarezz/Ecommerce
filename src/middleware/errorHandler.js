const manejadorErrores = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = {
      message,
      statusCode: 404
    };
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue)[0];
    const message = `El ${campo} ya existe`;
    error = {
      message,
      statusCode: 400
    };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = {
      message,
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = {
      message,
      statusCode: 401
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

const noEncontrado = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const manejadorAsincrono = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const formatearRespuesta = (req, res, next) => {
  res.success = (datos, mensaje = 'Operación exitosa', codigoEstado = 200) => {
    res.status(codigoEstado).json({
      success: true,
      mensaje,
      datos,
      timestamp: new Date().toISOString()
    });
  };

  res.error = (mensaje = 'Error interno del servidor', codigoEstado = 500, errores = null) => {
    res.status(codigoEstado).json({
      success: false,
      mensaje,
      errores,
      timestamp: new Date().toISOString()
    });
  };

  next();
};

module.exports = {
  manejadorErrores,
  noEncontrado,
  manejadorAsincrono,
  formatearRespuesta
};