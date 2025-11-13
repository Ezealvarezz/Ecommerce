const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const { User, Category, Product } = require('./src/models');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('🌱 Iniciando seed de datos...');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log('🗑️  Datos existentes eliminados');

    const adminUser = await User.create({
      nombre: 'Administrador',
      email: 'admin@ecommerce.com',
      password: 'admin123',
      telefono: '1234567890',
      direccion: {
        calle: 'Av. Principal 123',
        ciudad: 'Buenos Aires',
        codigoPostal: '1000',
        pais: 'Argentina'
      },
      rol: 'administrador'
    });

    const customer = await User.create({
      nombre: 'Juan Pérez',
      email: 'juan@email.com',
      password: 'password123',
      telefono: '0987654321',
      direccion: {
        calle: 'Calle Falsa 456',
        ciudad: 'Córdoba',
        codigoPostal: '5000',
        pais: 'Argentina'
      },
      rol: 'cliente'
    });

    console.log('👥 Usuarios creados');

    const categories = await Category.create([
      {
        nombre: 'Electrónicos',
        descripcion: 'Dispositivos electrónicos y tecnología'
      },
      {
        nombre: 'Ropa',
        descripcion: 'Vestimenta y accesorios'
      },
      {
        nombre: 'Hogar',
        descripcion: 'Artículos para el hogar y decoración'
      },
      {
        nombre: 'Deportes',
        descripcion: 'Equipamiento deportivo y fitness'
      },
      {
        nombre: 'Libros',
        descripcion: 'Libros y material educativo'
      }
    ]);

    console.log('📂 Categorías creadas');

    const products = await Product.create([
      {
        nombre: 'iPhone 15 Pro',
        descripcion: 'El último iPhone con tecnología avanzada',
        precio: 1200000,
        stock: 50,
        categoria: categories[0]._id,
        marca: 'Apple',
        imagenes: ['https://example.com/iphone15.jpg'],
        destacado: true
      },
      {
        nombre: 'Samsung Galaxy S24',
        descripcion: 'Smartphone Android de alta gama',
        precio: 900000,
        stock: 30,
        categoria: categories[0]._id,
        marca: 'Samsung',
        imagenes: ['https://example.com/galaxy.jpg']
      },
      {
        nombre: 'Notebook Dell XPS 13',
        descripcion: 'Laptop ultrabook para profesionales',
        precio: 1500000,
        stock: 20,
        categoria: categories[0]._id,
        marca: 'Dell',
        imagenes: ['https://example.com/dell.jpg'],
        destacado: true
      },
      {
        nombre: 'Camiseta Adidas',
        descripcion: 'Camiseta deportiva de algodón',
        precio: 25000,
        stock: 100,
        categoria: categories[1]._id,
        marca: 'Adidas',
        imagenes: ['https://example.com/camiseta.jpg']
      },
      {
        nombre: 'Jeans Levis 501',
        descripcion: 'Jeans clásicos de denim',
        precio: 80000,
        stock: 75,
        categoria: categories[1]._id,
        marca: 'Levis',
        imagenes: ['https://example.com/jeans.jpg']
      },
      {
        nombre: 'Sofá de 3 Cuerpos',
        descripcion: 'Sofá cómodo para sala de estar',
        precio: 450000,
        stock: 15,
        categoria: categories[2]._id,
        marca: 'HomeDecor',
        imagenes: ['https://example.com/sofa.jpg']
      },
      {
        nombre: 'Bicicleta Mountain Bike',
        descripcion: 'Bicicleta para montaña y aventuras',
        precio: 350000,
        stock: 25,
        categoria: categories[3]._id,
        marca: 'Trek',
        imagenes: ['https://example.com/bike.jpg'],
        destacado: true
      },
      {
        nombre: 'El Quijote',
        descripcion: 'Clásico de la literatura española',
        precio: 15000,
        stock: 200,
        categoria: categories[4]._id,
        marca: 'Editorial Planeta',
        imagenes: ['https://example.com/quijote.jpg']
      }
    ]);

    console.log('📦 Productos creados');

    console.log('✅ Seed completado exitosamente!');
    console.log('📧 Admin: admin@ecommerce.com / admin123');
    console.log('👤 Cliente: juan@email.com / password123');

  } catch (error) {
    console.error('❌ Error en seed:', error.message);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedData };
