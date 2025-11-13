const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Usuario = require('./src/models/Usuario');

async function verificarToken() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce_db');
    
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOiI2OTE1MDcyYWZjYzRmNjY3ZDJmZmQ0YmEiLCJpYXQiOjE3NjI5ODYyOTYsImV4cCI6MTc2MzU5MTA5Nn0.rlMln5amHqwT8VAuL-9APBuB11hny2DVLvvmzuEaHl0";
    
    console.log('🔍 Decodificando token...');
    const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_jwt_muy_segura_cambiar_en_produccion');
    
    console.log('Token decodificado:', decodificado);
    
    console.log('🔍 Buscando usuario con ID:', decodificado.usuarioId);
    const usuario = await Usuario.findById(decodificado.usuarioId);
    
    if (!usuario) {
        console.log('❌ Usuario no encontrado en la base de datos');
    } else {
        console.log('✅ Usuario encontrado:', {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
        });
    }
    
} catch (error) {
    console.error('Error:', error.message);
    } finally {
    await mongoose.connection.close();
    }
}

verificarToken();
