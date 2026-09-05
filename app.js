// app.js
// Configuracion principal de la aplicacion Express.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import productsRoutes from './src/routes/products.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import usersRoutes from './src/routes/users.routes.js';
import salesRoutes from './src/routes/sales.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Frontend: sirve todo lo que hay en /public (index.html, css, js).
// Al entrar a http://localhost:3000/ se abre el dashboard directamente.
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/products', productsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sales', salesRoutes);

// Ruta de salud, sirve para chequear que el servidor esta activo
app.get('/up', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor activo'
  });
});

// Ruta para manejar rutas de API no encontradas
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada'
  });
});

export default app;
