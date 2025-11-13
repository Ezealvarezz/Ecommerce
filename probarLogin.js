const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./src/models/Usuario');

async function probarLogin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce_db');
    
    console.log('Conectado a MongoDB');
    
    const usuario = await Usuario.findOne({ email: 'superadmin@test.com' }).select('+contrasena');
    
    if (!usuario) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo
    });
    
    const esCorrecta = await bcrypt.compare('123456', usuario.contrasena);
    
    console.log('Contraseña correcta:', esCorrecta);
    
    if (esCorrecta) {
      console.log('🎉 LOGIN EXITOSO');
    } else {
      console.log('❌ Contraseña incorrecta');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

probarLogin();
