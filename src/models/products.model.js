// models/products.model.js
// Lógica de acceso a datos para productos
// Este modelo se comunica con la base de datos local (SQLite)
// para obtener los datos y realizar las operaciones necesarias.

import db from '../config/database.js';

// función GET para obtener todos los productos
export const getAllProductsModel = async () => {
  const stmt = db.prepare('SELECT * FROM products');
  return stmt.all();
};

// función GET para obtener un producto por ID
export const getProductByIdModel = async (id) => {
  const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
  const product = stmt.get(id);

  return product || null;
};

// función POST para crear un nuevo producto
export const createProductModel = async (product) => {
  const { name, description, price, stock, category, size, color } = product;

  const stmt = db.prepare(
    `INSERT INTO products (name, description, price, stock, category, size, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    name,
    description ?? null,
    price,
    stock,
    category ?? null,
    size ?? null,
    color ?? null
  );

  return result.lastInsertRowid;
};

// función PUT para actualizar un producto existente
export const updateProductModel = async (id, product) => {
  const existing = await getProductByIdModel(id);

  if (!existing) {
    return null;
  }

  const {
    name = existing.name,
    description = existing.description,
    price = existing.price,
    stock = existing.stock,
    category = existing.category,
    size = existing.size,
    color = existing.color
  } = product;

  const stmt = db.prepare(
    `UPDATE products
     SET name = ?, description = ?, price = ?, stock = ?, category = ?, size = ?, color = ?
     WHERE id = ?`
  );
  stmt.run(name, description, price, stock, category, size, color, id);

  return {
    id: Number(id),
    name,
    description,
    price,
    stock,
    category,
    size,
    color
  };
};

// función DELETE para eliminar un producto por ID.
// Lanza 'PRODUCTO_CON_VENTAS' si el producto tiene ventas asociadas
// (la tabla sales referencia a products, y no se permite borrar en
// cascada para no perder el historial de ventas).
export const deleteProductModel = async (id) => {
  const existing = await getProductByIdModel(id);

  if (!existing) {
    return null;
  }

  try {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      throw new Error('PRODUCTO_CON_VENTAS');
    }
    throw error;
  }

  return existing;
};
