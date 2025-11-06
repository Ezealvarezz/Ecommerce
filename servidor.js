const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const { manejadorErrores, noEncontrado, formatearRespuesta } = require('./src/middleware/errorHandler');
const { limitadorGeneral } = require('./src/middleware/rateLimiter');

const rutasUsuarios = require('./src/routes/rutasUsuarios');
const rutasProductos = require('./src/routes/rutasProductos');
const rutasCategorias = require('./src/routes/rutasCategorias');
const rutasCarrito = require('./src/routes/rutasCarrito');
const rutasPedidos = require('./src/routes/rutasPedidos');
const rutasResenas = require('./src/routes/rutasResenas');

const conectarDB = require('./src/config/database');

const aplicacion = express();

conectarDB();

aplicacion.use(helmet());

const opcionesCors = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
aplicacion.use(cors(opcionesCors));

aplicacion.use(limitadorGeneral);

aplicacion.use(express.json({ limit: '10mb' }));
aplicacion.use(express.urlencoded({ extended: true, limit: '10mb' }));

aplicacion.use(formatearRespuesta);

aplicacion.get('/health', (req, res) => {
  res.success({
    estado: 'OK',
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV,
    version: '1.0.0'
  }, 'API funcionando correctamente');
});

aplicacion.get('/api', (req, res) => {
  res.success({
    mensaje: 'API E-commerce REST',
    version: '1.0.0',
    endpoints: {
      usuarios: '/api/usuarios',
      productos: '/api/productos',
      categorias: '/api/categorias',
      carrito: '/api/carrito',
      pedidos: '/api/pedidos',
      resenas: '/api/resenas'
    },
    documentacion: 'Ver README.md para documentación completa'
  });
});

aplicacion.use('/api/usuarios', rutasUsuarios);
aplicacion.use('/api/productos', rutasProductos);
aplicacion.use('/api/categorias', rutasCategorias);
aplicacion.use('/api/carrito', rutasCarrito);
aplicacion.use('/api/pedidos', rutasPedidos);
aplicacion.use('/api/resenas', rutasResenas);

aplicacion.use(noEncontrado);

aplicacion.use(manejadorErrores);

const PUERTO = process.env.PORT || 3000;

const servidor = aplicacion.listen(PUERTO, () => {
  console.log(`🚀 Servidor ejecutándose en modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Puerto: ${PUERTO}`);
  console.log(`🌐 URL: http://localhost:${PUERTO}`);
  console.log(`📚 API Docs: http://localhost:${PUERTO}/api`);
  console.log(`❤️  Health Check: http://localhost:${PUERTO}/health`);
});

process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err.message);
  console.log('🔄 Cerrando servidor debido a un error no manejado...');
  
  servidor.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err.message);
  console.log('🔄 Cerrando servidor debido a una excepción no capturada...');
  
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido. Cerrando servidor gracefully...');
  
  servidor.close(() => {
    console.log('🔄 Proceso terminado');
  });
});

module.exports = aplicacion;