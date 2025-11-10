# Guía de Pruebas en Postman - API E-commerce

Esta guía te ayudará a probar todos los endpoints de la API E-commerce usando Postman.

## Configuración Inicial

### 1. Variables de Entorno en Postman

Crea un **Environment** en Postman con estas variables:

- `baseUrl`: `http://localhost:3000`
- `token`: (se llenará automáticamente después del login)

### 2. Script para Capturar Token Automáticamente

En las requests de **Login** y **Registro**, agrega este script en la pestaña **Tests**:

```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const responseJson = pm.response.json();
    if (responseJson.data && responseJson.data.token) {
        pm.environment.set("token", responseJson.data.token);
    }
}
```

### 3. Autorización Automática

Para endpoints que requieren autenticación, en la pestaña **Authorization**:
- Tipo: `Bearer Token`
- Token: `{{token}}`

## Endpoints de la API

### 🔐 **AUTENTICACIÓN**

#### 1. Registrar Usuario
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/usuarios/registro`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "contrasena": "123456",
  "telefono": "1234567890",
  "direccion": {
    "calle": "Calle Principal 123",
    "ciudad": "Madrid",
    "codigoPostal": "28001",
    "pais": "España"
  }
}
```

#### 2. Iniciar Sesión
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/usuarios/login`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "juan@ejemplo.com",
  "contrasena": "123456"
}
```

### 👤 **USUARIOS**

#### 3. Obtener Perfil del Usuario
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/usuarios/perfil`
- **Authorization**: Bearer Token `{{token}}`

#### 4. Actualizar Perfil
- **Método**: `PUT`
- **URL**: `{{baseUrl}}/api/usuarios/perfil`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "nombre": "Juan Pérez Actualizado",
  "telefono": "9876543210",
  "direccion": {
    "calle": "Nueva Calle 456",
    "ciudad": "Barcelona",
    "codigoPostal": "08001",
    "pais": "España"
  }
}
```

#### 5. Listar Todos los Usuarios (Solo Admin)
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/usuarios`
- **Authorization**: Bearer Token `{{token}}`
- **Query Params** (opcional):
  - `pagina`: `1`
  - `limite`: `10`
  - `buscar`: `juan`

### 📦 **CATEGORÍAS**

#### 6. Crear Categoría (Solo Admin)
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/categorias`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "nombre": "Electrónicos",
  "descripcion": "Dispositivos electrónicos y gadgets",
  "activa": true
}
```

#### 7. Obtener Todas las Categorías
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/categorias`
- **Query Params** (opcional):
  - `pagina`: `1`
  - `limite`: `10`
  - `buscar`: `electrónicos`

#### 8. Obtener Categorías Activas
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/categorias/activas`

#### 9. Obtener Categoría por ID
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/categorias/CATEGORIA_ID`
- Reemplaza `CATEGORIA_ID` con el ID real de la categoría

### 🛍️ **PRODUCTOS**

#### 10. Crear Producto (Solo Admin)
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/productos`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "nombre": "iPhone 15",
  "descripcion": "Último modelo de iPhone con tecnología avanzada",
  "precio": 999.99,
  "categoria": "CATEGORIA_ID_AQUI",
  "stock": 50,
  "imagenes": [
    "https://ejemplo.com/iphone15-1.jpg",
    "https://ejemplo.com/iphone15-2.jpg"
  ],
  "disponible": true,
  "especificaciones": {
    "marca": "Apple",
    "modelo": "iPhone 15",
    "almacenamiento": "128GB"
  },
  "etiquetas": ["smartphone", "apple", "móvil"]
}
```

#### 11. Obtener Todos los Productos
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/productos`
- **Query Params** (opcional):
  - `pagina`: `1`
  - `limite`: `10`
  - `categoria`: `electrónicos`
  - `buscar`: `iphone`
  - `precioMin`: `100`
  - `precioMax`: `1000`
  - `disponible`: `true`
  - `ordenar`: `precio_asc`

#### 12. Buscar Productos
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/productos/buscar`
- **Query Params**:
  - `termino`: `iphone`

#### 13. Productos Destacados
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/productos/destacados`
- **Query Params** (opcional):
  - `limite`: `5`

#### 14. Obtener Producto por ID
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/productos/PRODUCTO_ID`

#### 15. Actualizar Stock (Solo Admin)
- **Método**: `PATCH`
- **URL**: `{{baseUrl}}/api/productos/PRODUCTO_ID/stock`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "operacion": "incrementar",
  "stock": 10
}
```

### 🛒 **CARRITO**

#### 16. Obtener Carrito del Usuario
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/carrito`
- **Authorization**: Bearer Token `{{token}}`

#### 17. Agregar Producto al Carrito
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/carrito/productos`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "idProducto": "PRODUCTO_ID_AQUI",
  "cantidad": 2
}
```

#### 18. Actualizar Cantidad de Producto
- **Método**: `PUT`
- **URL**: `{{baseUrl}}/api/carrito/productos`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "idProducto": "PRODUCTO_ID_AQUI",
  "cantidad": 3
}
```

#### 19. Eliminar Producto del Carrito
- **Método**: `DELETE`
- **URL**: `{{baseUrl}}/api/carrito/productos/PRODUCTO_ID`
- **Authorization**: Bearer Token `{{token}}`

#### 20. Limpiar Carrito Completo
- **Método**: `DELETE`
- **URL**: `{{baseUrl}}/api/carrito`
- **Authorization**: Bearer Token `{{token}}`

### 📋 **PEDIDOS**

#### 21. Crear Pedido
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/pedidos`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "direccionEntrega": {
    "calle": "Calle de Entrega 789",
    "ciudad": "Valencia",
    "codigoPostal": "46001",
    "pais": "España"
  },
  "metodoPago": "tarjeta",
  "notas": "Entregar en horario de mañana"
}
```

#### 22. Obtener Pedidos del Usuario
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/pedidos`
- **Authorization**: Bearer Token `{{token}}`
- **Query Params** (opcional):
  - `pagina`: `1`
  - `limite`: `10`
  - `estado`: `pendiente`

#### 23. Obtener Pedido por ID
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/pedidos/PEDIDO_ID`
- **Authorization**: Bearer Token `{{token}}`

#### 24. Actualizar Estado del Pedido (Solo Admin)
- **Método**: `PATCH`
- **URL**: `{{baseUrl}}/api/pedidos/PEDIDO_ID/estado`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "estado": "confirmado",
  "notasAdmin": "Pedido confirmado y en preparación"
}
```

#### 25. Cancelar Pedido
- **Método**: `PATCH`
- **URL**: `{{baseUrl}}/api/pedidos/PEDIDO_ID/cancelar`
- **Authorization**: Bearer Token `{{token}}`

### ⭐ **RESEÑAS**

#### 26. Crear Reseña
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/resenas`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "idProducto": "PRODUCTO_ID_AQUI",
  "calificacion": 5,
  "comentario": "Excelente producto, muy recomendado. La calidad es excepcional."
}
```

#### 27. Obtener Reseñas de un Producto
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/resenas/producto/PRODUCTO_ID`
- **Query Params** (opcional):
  - `pagina`: `1`
  - `limite`: `10`
  - `calificacion`: `5`
  - `ordenar`: `recientes`

#### 28. Obtener Reseñas del Usuario
- **Método**: `GET`
- **URL**: `{{baseUrl}}/api/resenas/usuario`
- **Authorization**: Bearer Token `{{token}}`

#### 29. Actualizar Reseña
- **Método**: `PUT`
- **URL**: `{{baseUrl}}/api/resenas/RESENA_ID`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "calificacion": 4,
  "comentario": "Buen producto, aunque podría mejorar en algunos aspectos."
}
```

#### 30. Reportar Reseña
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/resenas/RESENA_ID/reportar`
- **Authorization**: Bearer Token `{{token}}`
- **Body** (raw JSON):
```json
{
  "motivo": "contenido_falso",
  "descripcion": "Esta reseña contiene información incorrecta sobre el producto"
}
```

## Flujo de Prueba Recomendado

### 1. **Configuración Inicial**
1. Iniciar el servidor: `npm run dev`
2. Crear el environment en Postman
3. Configurar las variables `baseUrl` y `token`

### 2. **Flujo de Usuario Normal**
1. **Registrar usuario** → Capturar token automáticamente
2. **Crear categoría** (si eres admin)
3. **Crear producto** (si eres admin)
4. **Buscar productos** disponibles
5. **Agregar productos al carrito**
6. **Verificar carrito**
7. **Crear pedido**
8. **Crear reseña** del producto

### 3. **Flujo de Administrador**
1. **Login como admin**
2. **Crear categorías y productos**
3. **Ver todos los usuarios**
4. **Actualizar stock de productos**
5. **Cambiar estados de pedidos**
6. **Ver reseñas reportadas**

## Respuestas Esperadas

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    // Datos del resultado
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detalles adicionales"
  }
}
```

## Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error en la petición
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `429` - Demasiadas peticiones
- `500` - Error interno del servidor

## Consejos para las Pruebas

1. **Orden de las pruebas**: Sigue el flujo lógico (registro → login → crear datos → operar)
2. **Guarda los IDs**: Copia los IDs de respuestas para usarlos en otras requests
3. **Verifica tokens**: Asegúrate de que el token se esté capturando correctamente
4. **Prueba errores**: Intenta casos de error como datos inválidos, tokens expirados, etc.
5. **Usa Collections**: Organiza las requests en colecciones de Postman para mejor organización

¡Con esta guía podrás probar completamente tu API E-commerce en español!