// app.js
// Configuracion principal de la aplicacion Express.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import productsRoutes from './src/routes/products.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import usersRoutes from './src/routes/users.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de salud, sirve para chequear que el servidor esta funcionando
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor funcionando correctamente'
  });
});

// Rutas
app.use('/api/products', productsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Ruta de salud, sirve para chequear que el servidor esta activo
app.get("/up", (req, res) => {
  res.json({
    status: "ok",
    message: "Servidor activo",
  });
});

// Ruta para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada'
  });
});

export default app;
