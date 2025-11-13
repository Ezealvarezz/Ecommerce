const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./src/models/Usuario');

async function crearAdminDirecto() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce_db');
    
    console.log('Conectado a MongoDB');
    
    const eliminados = await Usuario.deleteMany({ 
      $or: [
        { email: 'superadmin@test.com' },
        { rol: 'administrador' }
      ]
    });
    
    console.log('Usuarios eliminados:', eliminados.deletedCount);
    
    const adminDirecto = new Usuario({
      nombre: 'Super Admin',
      email: 'superadmin@test.com',
      contrasena: '123456', // Contraseña sin encriptar
      telefono: '1234567890',
      rol: 'administrador',
      activo: true
    });
    
    const usuarioGuardado = await adminDirecto.save();
    console.log('Usuario guardado con ID:', usuarioGuardado._id);
    
    console.log('✅ Super Admin creado exitosamente');
    console.log('Email: superadmin@test.com');
    console.log('Contraseña: 123456');
    console.log('Rol:', adminDirecto.rol);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearAdminDirecto();
