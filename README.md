# API Ecommerce

REST API para un sistema de e-commerce desarrollado con Node.js, Express y MongoDB.

## Características

- Autenticación con JWT
- Autorización basada en roles (cliente/administrador)
- CRUD completo para todas las entidades
- Agregaciones y operadores de MongoDB
- Manejo de errores centralizado
- Respuestas JSON estandarizadas

## Entidades

- **Usuarios**: Clientes y administradores
- **Productos**: Con categorías, stock y reseñas
- **Categorías**: Agrupación de productos
- **Carritos**: Carrito de compras por usuario
- **Pedidos**: Órdenes con estado y método de pago
- **Reseñas**: Calificaciones y comentarios de productos

## Instalación

```bash
npm install
npm run dev
```

## Variables de Entorno

Configurar las variables en el archivo `.env`:

- `MONGODB_URI`: URI de conexión a MongoDB
- `JWT_SECRET`: Clave secreta para JWT
- `PORT`: Puerto del servidor

## Rutas de la API

### Usuarios (`/api/users`)
- `GET /api/users` - Listar todos los usuarios (admin)
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Registrar nuevo usuario
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Productos (`/api/productos`)
- `GET /api/productos` - Listar productos con categoría
- `GET /api/productos/filtro` - Filtrar por precio y marca
- `GET /api/productos/top` - Productos más reseñados
- `PATCH /api/productos/:id/stock` - Actualizar stock

### Categorías (`/api/categorias`)
- CRUD completo
- `GET /api/categorias/stats` - Estadísticas por categoría

### Carritos (`/api/carrito`)
- `GET /api/carrito/:usuarioId` - Ver carrito
- `GET /api/carrito/:usuarioId/total` - Calcular total

### Pedidos (`/api/ordenes`)
- CRUD completo
- `GET /api/ordenes/stats` - Estadísticas de pedidos
- `PATCH /api/ordenes/:id/status` - Actualizar estado

### Reseñas (`/api/resenas`)
- CRUD completo
- `GET /api/resenas/top` - Promedio de calificaciones
- `POST /api/resenas` - Crear reseña (solo compradores)

## Autenticación

La API utiliza JWT para autenticación. Incluir el token en el header:

```
Authorization: Bearer <token>
```

## Testing

Usar Postman o Insomnia para probar todas las rutas. El proyecto incluye colecciones organizadas por modelo.