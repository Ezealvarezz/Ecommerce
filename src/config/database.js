const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

const conectarDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri || mongoUri.includes('localhost')) {
      try {
        await mongoose.connect('mongodb://localhost:27017/ecommerce_db', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 2000, // Timeout rápido
        });
        console.log('MongoDB Conectado: localhost (instalación local)');
      } catch (error) {
        console.log('MongoDB local no disponible, usando base de datos en memoria...');
        mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('MongoDB Conectado: memoria (desarrollo)');
      }
    } else {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB Conectado: remoto');
    }
    
    mongoose.connection.on('error', (err) => {
      console.error('Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB desconectado');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      if (mongoServer) {
        await mongoServer.stop();
      }
      console.log('Conexión MongoDB cerrada por terminación de la aplicación');
      process.exit(0);
    });

  } catch (error) {
    console.error('Falló la conexión a la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = conectarDB;
