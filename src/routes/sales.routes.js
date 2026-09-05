// src/routes/sales.routes.js
// Rutas para ventas
// Este archivo define las rutas para las ventas y se comunica con el controlador.
//
// Nota: se saco verifyToken de estas rutas porque, sin pantalla de login,
// no hay forma de generar el token para usarlas. Si en el futuro reactivan
// el login, alcanza con volver a poner verifyToken (import ya disponible
// en auth.middleware.js) delante de los handlers que corresponda.

import { Router } from 'express';
import {
  createSale,
  getSales,
  getSaleById
} from '../controllers/sales.controller.js';
import { validateSale } from '../middlewares/sale.middleware.js';

// Crear el router
const router = Router();

// Definir las rutas para ventas
router.get('/', getSales);

router.get('/:id', getSaleById);

router.post('/', validateSale, createSale);

export default router;
