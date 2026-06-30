// routes/auth.routes.js
// Rutas para autenticación
// Este archivo define las rutas para la autenticación y 
// se comunica con el controlador.    


import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

// Crear el router
const router = Router();

router.post('/login', login);

export default router;