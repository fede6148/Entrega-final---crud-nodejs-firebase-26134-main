// src/models/sales.model.js
// Acceso a datos para ventas.
// Una venta (sales) tiene uno o más ítems (sale_items), cada uno
// referenciando un producto. Todo el registro de una venta —chequeo
// de stock, inserción de la venta, inserción de los ítems y descuento
// de stock— pasa dentro de una única transacción: si algo falla,
// no queda nada a medias (ni la venta, ni los descuentos de stock).

import db from '../config/database.js';

const getProductStmt = db.prepare('SELECT * FROM products WHERE id = ?');

const insertSaleStmt = db.prepare(
  'INSERT INTO sales (total) VALUES (?)'
);

const insertItemStmt = db.prepare(
  `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
   VALUES (?, ?, ?, ?, ?)`
);

const decreaseStockStmt = db.prepare(
  'UPDATE products SET stock = stock - ? WHERE id = ?'
);

const selectSaleStmt = db.prepare('SELECT * FROM sales WHERE id = ?');

const selectItemsBySaleStmt = db.prepare(`
  SELECT
    si.id AS id,
    si.product_id AS productId,
    p.name AS productName,
    p.size AS productSize,
    p.color AS productColor,
    si.quantity AS quantity,
    si.unit_price AS unitPrice,
    si.subtotal AS subtotal
  FROM sale_items si
  JOIN products p ON p.id = si.product_id
  WHERE si.sale_id = ?
  ORDER BY si.id ASC
`);

// Junta varios ítems del mismo producto en uno solo, sumando cantidades.
// Evita el caso raro de "vender el mismo producto dos veces" en la
// misma venta generando dos descuentos de stock separados.
const consolidarItems = (items) => {
  const porProducto = new Map();

  for (const { productId, quantity } of items) {
    const actual = porProducto.get(productId) || 0;
    porProducto.set(productId, actual + quantity);
  }

  return Array.from(porProducto.entries()).map(([productId, quantity]) => ({
    productId,
    quantity
  }));
};

const armarSale = (saleId) => {
  const sale = selectSaleStmt.get(saleId);
  const items = selectItemsBySaleStmt.all(saleId);

  return {
    id: sale.id,
    createdAt: sale.created_at,
    total: sale.total,
    items
  };
};

// función POST para crear una venta con uno o más ítems.
// Lanza 'PRODUCTO_NO_ENCONTRADO' o 'STOCK_INSUFICIENTE' (con el detalle
// del producto afectado en error.detalle) si corresponde.
export const createSaleModel = async (items) => {
  const itemsConsolidados = consolidarItems(items);

  const registrarVenta = db.transaction(() => {
    let total = 0;
    const itemsAProcesar = [];

    // Primero se valida TODO (existencia + stock) antes de tocar nada,
    // así una venta con 3 productos y el tercero sin stock no deja los
    // dos primeros descontados a mitad de camino.
    for (const { productId, quantity } of itemsConsolidados) {
      const product = getProductStmt.get(productId);

      if (!product) {
        const error = new Error('PRODUCTO_NO_ENCONTRADO');
        error.detalle = `Producto con id ${productId} no existe`;
        throw error;
      }

      if (product.stock < quantity) {
        const error = new Error('STOCK_INSUFICIENTE');
        error.detalle = `${product.name}: pediste ${quantity}, hay ${product.stock} en stock`;
        throw error;
      }

      const subtotal = Number((product.price * quantity).toFixed(2));
      total += subtotal;

      itemsAProcesar.push({
        productId,
        quantity,
        unitPrice: product.price,
        subtotal
      });
    }

    total = Number(total.toFixed(2));

    const saleResult = insertSaleStmt.run(total);
    const saleId = saleResult.lastInsertRowid;

    for (const item of itemsAProcesar) {
      insertItemStmt.run(saleId, item.productId, item.quantity, item.unitPrice, item.subtotal);
      decreaseStockStmt.run(item.quantity, item.productId);
    }

    return saleId;
  });

  const saleId = registrarVenta();
  return armarSale(saleId);
};

// función GET para listar todas las ventas (más recientes primero),
// cada una con sus ítems.
export const getAllSalesModel = async () => {
  const ventas = db.prepare('SELECT id FROM sales ORDER BY id DESC').all();
  return ventas.map((v) => armarSale(v.id));
};

// función GET para obtener una venta por id, con sus ítems.
export const getSaleByIdModel = async (id) => {
  const sale = selectSaleStmt.get(id);
  if (!sale) return null;

  return armarSale(id);
};
