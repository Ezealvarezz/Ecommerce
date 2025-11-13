const { Usuario, Carrito } = require('../models');
const { generarToken } = require('../middleware/autenticacion');
const { manejadorAsincrono } = require('../middleware/errorHandler');

const registrarUsuario = manejadorAsincrono(async (req, res) => {
  const { nombre, email, contrasena, telefono, direccion, rol } = req.body;

  const usuarioExistente = await Usuario.findOne({ email });
  if (usuarioExistente) {
    return res.error('El usuario ya existe con este email', 400);
  }

  const usuario = await Usuario.create({
    nombre,
    email,
    contrasena,
    telefono,
    direccion,
    rol
  });

  await Carrito.create({
    usuario: usuario._id,
    items: []
  });

  const token = generarToken(usuario._id);

  usuario.contrasena = undefined;

  res.success(
    {
      usuario,
      token
    },
    'Usuario registrado exitosamente',
    201
  );
});

const loginUsuario = manejadorAsincrono(async (req, res) => {
  const { email, contrasena } = req.body;

  const usuario = await Usuario.findOne({ email }).select('+contrasena');
  
  if (!usuario || !(await usuario.compararContrasena(contrasena))) {
    return res.error('Credenciales inválidas', 401);
  }

  if (!usuario.activo) {
    return res.error('Cuenta desactivada', 401);
  }

  await usuario.actualizarUltimoAcceso();

  const token = generarToken(usuario._id);

  usuario.contrasena = undefined;

  res.success(
    {
      usuario,
      token
    },
    'Login exitoso'
  );
});

const obtenerUsuarios = manejadorAsincrono(async (req, res) => {
  const pagina = parseInt(req.query.pagina) || 1;
  const limite = parseInt(req.query.limite) || 10;
  const saltar = (pagina - 1) * limite;

  const filtro = {};
  if (req.query.rol) {
    filtro.rol = req.query.rol;
  }
  if (req.query.activo !== undefined) {
    filtro.activo = req.query.activo === 'true';
  }

  const usuarios = await Usuario.find(filtro)
    .select('-contrasena')
    .sort({ createdAt: -1 })
    .skip(saltar)
    .limit(limite)
    .populate('carrito');

  const total = await Usuario.countDocuments(filtro);
  const totalPaginas = Math.ceil(total / limite);

  res.success({
    usuarios,
    paginacion: {
      paginaActual: pagina,
      totalPaginas,
      totalUsuarios: total,
      tieneSiguiente: pagina < totalPaginas,
      tieneAnterior: pagina > 1
    }
  });
});

const obtenerUsuarioPorId = manejadorAsincrono(async (req, res) => {
  const usuario = await Usuario.findById(req.params.id)
    .select('-contrasena')
    .populate('carrito')
    .populate('pedidos');

  if (!usuario) {
    return res.error('Usuario no encontrado', 404);
  }

  res.success(usuario);
});

const actualizarUsuario = manejadorAsincrono(async (req, res) => {
  const { nombre, telefono, direccion } = req.body;

  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) {
    return res.error('Usuario no encontrado', 404);
  }

  if (nombre) usuario.nombre = nombre;
  if (telefono) usuario.telefono = telefono;
  if (direccion) usuario.direccion = direccion;

  await usuario.save();

  res.success(usuario, 'Usuario actualizado exitosamente');
});

const eliminarUsuario = manejadorAsincrono(async (req, res) => {
  const usuario = await Usuario.findById(req.params.id);
  
  if (!usuario) {
    return res.error('Usuario no encontrado', 404);
  }

  await Carrito.findOneAndDelete({ usuario: usuario._id });

  usuario.activo = false;
  await usuario.save();

  res.success(null, 'Usuario eliminado exitosamente');
});

const obtenerMiPerfil = manejadorAsincrono(async (req, res) => {
  const usuario = await Usuario.findById(req.usuario._id)
    .select('-contrasena')
    .populate('carrito')
    .populate('pedidos');

  res.success(usuario);
});

const actualizarContrasena = manejadorAsincrono(async (req, res) => {
  const { contrasenaActual, nuevaContrasena } = req.body;

  const usuario = await Usuario.findById(req.usuario._id).select('+contrasena');

  if (!(await usuario.compararContrasena(contrasenaActual))) {
    return res.error('Contraseña actual incorrecta', 400);
  }

  usuario.contrasena = nuevaContrasena;
  await usuario.save();

  res.success(null, 'Contraseña actualizada exitosamente');
});

const obtenerEstadisticasUsuarios = manejadorAsincrono(async (req, res) => {
  const estadisticas = await Usuario.aggregate([
    {
      $group: {
        _id: '$rol',
        cantidad: { $sum: 1 }
      }
    },
    {
      $project: {
        rol: '$_id',
        cantidad: 1,
        _id: 0
      }
    }
  ]);

  const totalUsuarios = await Usuario.countDocuments();
  const usuariosActivos = await Usuario.countDocuments({ activo: true });
  const usuariosRecientes = await Usuario.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  res.success({
    totalUsuarios,
    usuariosActivos,
    usuariosInactivos: totalUsuarios - usuariosActivos,
    usuariosRecientes,
    usuariosPorRol: estadisticas
  });
});

module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  obtenerMiPerfil,
  actualizarContrasena,
  obtenerEstadisticasUsuarios
};
