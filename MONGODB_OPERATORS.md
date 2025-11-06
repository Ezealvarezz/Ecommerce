# Operadores de MongoDB Utilizados

## Operadores de Comparación

### `$eq` (Equal)
```javascript
// En userController.js - filtrar usuarios por rol
filter.rol = req.query.rol; // Implícito $eq

// En orderController.js - filtrar pedidos por estado  
filter.estado = req.query.estado; // Implícito $eq
```

### `$ne` (Not Equal)
```javascript
// En productController.js - obtener productos activos
filter.activo = { $ne: false };
```

### `$gte` y `$lte` (Greater/Less Than or Equal)
```javascript
// En productController.js - filtrar por rango de precios
if (minPrice && maxPrice) {
  filter.precio = { 
    $gte: parseFloat(minPrice), 
    $lte: parseFloat(maxPrice) 
  };
}

// En orderController.js - filtrar por rango de fechas
if (req.query.fechaInicio && req.query.fechaFin) {
  filter.fechaPedido = {
    $gte: new Date(req.query.fechaInicio),
    $lte: new Date(req.query.fechaFin)
  };
}
```

### `$and` y `$or`
```javascript
// En Review.js - verificar si usuario compró producto
const pedidoEntregado = await Order.findOne({
  $and: [
    { usuario: this.usuario },
    { 'items.producto': this.producto },
    { estado: 'entregado' }
  ]
});

// En productController.js - búsqueda por texto
if (req.query.search) {
  filter.$or = [
    { nombre: new RegExp(req.query.search, 'i') },
    { descripcion: new RegExp(req.query.search, 'i') }
  ];
}
```

## Operadores de Modificación

### `$set`
```javascript
// En productController.js - actualizar stock
const product = await Product.findByIdAndUpdate(
  req.params.id,
  { $set: { stock: stock } },
  { new: true, runValidators: true }
);
```

### `$push`
```javascript
// En cartController.js - agregar item al carrito
this.items.push({
  producto: productoId,
  cantidad: cantidad,
  precio: precio
});

// En reviewController.js - agregar votante
this.util.votantes.push(usuarioId);
```

### `$pull`
```javascript
// En cartController.js - remover item del carrito
cart.items.pull(itemId);
```

### `$inc` (Increment)
```javascript
// En orderController.js - reducir stock al crear pedido
await Product.findByIdAndUpdate(
  item.producto,
  { $inc: { stock: -item.cantidad } }
);

// En orderController.js - restaurar stock al cancelar
await Product.findByIdAndUpdate(
  item.producto,
  { $inc: { stock: item.cantidad } }
);
```

## Operadores de Agregación

### `$lookup` (Join)
```javascript
// En categoryController.js - obtener productos por categoría
const stats = await Category.aggregate([
  {
    $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: 'categoria',
      as: 'productos'
    }
  }
]);

// En reviewController.js - obtener datos del producto
{
  $lookup: {
    from: 'products',
    localField: '_id',
    foreignField: '_id',
    as: 'producto'
  }
}
```

### `$group`
```javascript
// En orderController.js - estadísticas por estado
const ordersByStatus = await Order.aggregate([
  {
    $group: {
      _id: '$estado',
      count: { $sum: 1 },
      totalAmount: { $sum: '$total' }
    }
  }
]);

// En reviewController.js - promedio de calificaciones
{
  $group: {
    _id: '$producto',
    promedioCalificacion: { $avg: '$calificacion' },
    totalResenas: { $sum: 1 }
  }
}
```

### `$match`
```javascript
// En productController.js - filtrar productos activos
{
  $match: {
    activo: true,
    precio: { $gte: minPrice, $lte: maxPrice }
  }
}

// En reviewController.js - filtrar por mínimo de reseñas
{
  $match: {
    totalResenas: { $gte: 5 }
  }
}
```

### `$sort`
```javascript
// En orderController.js - ordenar por fecha
{ $sort: { fechaPedido: -1 } }

// En reviewController.js - ordenar por calificación
{ $sort: { promedioCalificacion: -1, totalResenas: -1 } }
```

### `$unwind`
```javascript
// En orderController.js - descomponer items de pedidos
{ $unwind: '$items' }

// En categoryController.js - descomponer productos
{ $unwind: '$producto' }
```

### `$count`
```javascript
// En cartController.js - contar items en carrito
totalItems: { $sum: '$items.cantidad' }
```

### `$avg` y `$sum`
```javascript
// En productController.js - estadísticas generales
{
  $group: {
    _id: null,
    totalProducts: { $sum: 1 },
    averagePrice: { $avg: '$precio' },
    totalStock: { $sum: '$stock' }
  }
}

// En cartController.js - totales del carrito
{
  $group: {
    _id: '$_id',
    subtotal: { $sum: '$items.subtotal' },
    total: { $sum: '$items.totalConDescuento' }
  }
}
```

### Agregaciones Complejas

#### Cálculo de totales de carrito con descuentos
```javascript
const result = await Cart.aggregate([
  { $match: { usuario: cart.usuario, activo: true } },
  { $unwind: '$items' },
  {
    $lookup: {
      from: 'products',
      localField: 'items.producto',
      foreignField: '_id',
      as: 'productInfo'
    }
  },
  { $unwind: '$productInfo' },
  {
    $addFields: {
      'items.subtotal': { $multiply: ['$items.cantidad', '$items.precio'] },
      'items.descuento': {
        $multiply: [
          { $multiply: ['$items.cantidad', '$items.precio'] },
          { $divide: ['$productInfo.descuento', 100] }
        ]
      }
    }
  },
  {
    $group: {
      _id: '$_id',
      subtotal: { $sum: '$items.subtotal' },
      totalDescuentos: { $sum: '$items.descuento' },
      total: { $sum: '$items.totalConDescuento' }
    }
  }
]);
```

#### Top productos vendidos
```javascript
const topProducts = await Order.aggregate([
  { $match: { estado: { $in: ['entregado', 'enviado'] } } },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.producto',
      totalSold: { $sum: '$items.cantidad' },
      revenue: { $sum: { $multiply: ['$items.cantidad', '$items.precio'] } }
    }
  },
  { $sort: { totalSold: -1 } },
  { $limit: 10 }
]);
```