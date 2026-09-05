// src/config/database.js
// Conexión a la base de datos local SQLite.

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

dotenv.config();

// better-sqlite3 es un modulo nativo (CommonJS). En algunos entornos
// (Windows + ciertas versiones de Node) el "import Database from
// 'better-sqlite3'" no resuelve bien la clase por como Node interpreta
// el interop ESM/CJS, y tira "Database is not a constructor".
// Usar createRequire evita ese problema por completo.
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// La ruta del archivo de base de datos se puede configurar por .env
// (DB_PATH); si no se define, se usa database.db en la raíz del proyecto.
const dbPath = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.resolve(__dirname, '../../database.db');

const db = new Database(dbPath);

// better-sqlite3 recomienda activar WAL para mejor rendimiento
// y evitar bloqueos cuando hay varias lecturas/escrituras seguidas.
db.pragma('journal_mode = WAL');

const tableExists = (table) =>
  Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)
  );

const columnsOf = (table) =>
  db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);

const addColumnIfMissing = (table, column, definition) => {
  if (!columnsOf(table).includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

// Las FK se desactivan durante el armado/migración de tablas y se
// reactivan al final, para poder reorganizar "sales" sin conflictos.
db.pragma('foreign_keys = OFF');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );
`);

// Migración de productos: category/size/color (por si vienen de una
// base anterior a esos campos).
addColumnIfMissing('products', 'category', 'TEXT');
addColumnIfMissing('products', 'size', 'TEXT');
addColumnIfMissing('products', 'color', 'TEXT');

// ---------------------------------------------------------------
// Migración de ventas: de "una venta = un producto" (esquema viejo,
// tabla sales con product_id/quantity/unit_price/total en la misma
// fila) a "una venta = varios productos" (sales + sale_items).
// ---------------------------------------------------------------

const salesEsEsquemaViejo = tableExists('sales') && columnsOf('sales').includes('product_id');

if (salesEsEsquemaViejo) {
  db.exec('ALTER TABLE sales RENAME TO sales_old');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    total REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

if (salesEsEsquemaViejo) {
  const ventasViejas = db.prepare('SELECT * FROM sales_old').all();

  const insertSale = db.prepare(
    'INSERT INTO sales (id, created_at, total) VALUES (?, ?, ?)'
  );
  const insertItem = db.prepare(
    `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
     VALUES (?, ?, ?, ?, ?)`
  );

  const migrarVentas = db.transaction(() => {
    for (const venta of ventasViejas) {
      insertSale.run(venta.id, venta.created_at, venta.total);
      insertItem.run(venta.id, venta.product_id, venta.quantity, venta.unit_price, venta.total);
    }
  });

  migrarVentas();

  db.exec('DROP TABLE sales_old');

  console.log(
    `Migración de ventas: ${ventasViejas.length} venta(s) anterior(es) convertida(s) al nuevo formato (venta + items).`
  );
}

db.pragma('foreign_keys = ON');

export default db;
