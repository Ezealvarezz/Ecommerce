const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const generarToken = (usuarioId) => {
  return jwt.sign({ usuarioId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const autenticar = async (req, res, next) => {
  try {
    console.log('🔐 Iniciando autenticación...');
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🎫 Token encontrado:', token.substring(0, 20) + '...');
    }

    if (!token) {
      console.log('❌ No se encontró token');
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    console.log('🔍 Verificando token...');
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decodificado:', decodificado);

    console.log('👤 Buscando usuario ID:', decodificado.usuarioId);
    const usuario = await Usuario.findById(decodificado.usuarioId).select('+contrasena');
    if (!usuario) {
      console.log('❌ Usuario no encontrado para ID:', decodificado.usuarioId);
      return res.status(401).json({
        success: false,
        message: 'Token inválido - Usuario no encontrado'
      });
    }

    console.log('✅ Usuario encontrado:', usuario.email, 'Rol:', usuario.rol);

    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    await usuario.actualizarUltimoAcceso();

    req.usuario = usuario;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error en la autenticación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

const requerirAdmin = (req, res, next) => {
  console.log('🔍 Usuario actual:', req.usuario?.email, 'Rol:', req.usuario?.rol);
  if (!req.usuario || req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      success: false,
      message: 'Se requieren permisos de administrador'
    });
  }
  next();
};

const verificarPropietarioOAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  const { userId } = req.params;
  const esAdmin = req.usuario.rol === 'admin';
  const esPropietario = req.usuario.id === userId;

  if (!esAdmin && !esPropietario) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a este recurso'
    });
  }

  next();
};

module.exports = {
  generarToken,
  autenticar,
  autorizar,
  requerirAdmin,
  verificarPropietarioOAdmin
};

const requerirPropietarioOAdmin = (obtenerIdPropietario) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      if (req.usuario.rol === 'administrador') {
        return next();
      }

      const idPropietario = await obtenerIdPropietario(req);
      
      if (req.usuario._id.toString() === idPropietario.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

const usuarioComproProducto = async (usuarioId, productoId) => {
  const { Pedido } = require('../models');
  
  const pedido = await Pedido.findOne({
    usuario: usuarioId,
    'items.producto': productoId,
    estado: 'entregado'
  });

  return !!pedido;
};

module.exports = {
  generarToken,
  autenticar,
  autorizar,
  requerirAdmin,
  requerirPropietarioOAdmin,
  usuarioComproProducto
};
