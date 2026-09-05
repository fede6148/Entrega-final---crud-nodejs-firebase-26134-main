// routes/products.routes.js
// Rutas para productos
// Este archivo define las rutas para los productos y se comunica con el controlador.

import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/products.controller.js';
import { validateProduct } from '../middlewares/product.middleware.js';

import { verifyToken } from '../middlewares/auth.middleware.js';

// Crear el router
const router = Router();

// Definir las rutas para productos
router.get('/', getProducts);

router.get('/:id', getProductById);

router.post('/', verifyToken, validateProduct, createProduct);

router.put('/:id', verifyToken, validateProduct, updateProduct);

router.delete('/:id', verifyToken, deleteProduct);

export default router;
