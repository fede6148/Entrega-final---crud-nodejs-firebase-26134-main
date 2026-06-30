// controllers/auth.controllers.js
// Controladores para autenticación
// Este controlador se comunica con el servicio para obtener los datos  
// y enviar la respuesta al cliente.

import { generateToken } from '../utils/jwt.js';

// Usuario de prueba, hardcodeado porque no hay un modulo de usuarios todavia
const defaultUser = {
  id: 1,
  name: "User",
  email: "user@email.com",
  password: "strongPass123",
  admin: true
};

// Controlador para manejar el login de usuarios
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Si faltan credenciales en el body, se devuelve un error de petición invalida
  if (!email || !password) {
    return res.status(400).json({
      error: 'Faltan credenciales'
    });
  }

  if (
    email === defaultUser.email &&
    password === defaultUser.password
  ) {

    const token = generateToken(defaultUser);

    return res.json({
      message: "El login fue exitoso",
      token
    });
  }

  // Si las credenciales son inválidas, se devuelve un error
  return res.status(401).json({
    error: 'Credenciales inválidas'
  });
};
