// middlewares/product.middleware.js
// Este middleware se utiliza para validar los datos (name, price, stock)
// de los productos antes de enviarlos al controlador.

export const validateProduct = (req, res, next) => {

  const {
    name,
    price,
    stock
  } = req.body;

  if (!name || !price || !stock) {
    return res.status(400).json({
      error: 'Todos los campos son obligatorios'
    });
  }

  if (typeof name !== 'string') {
    return res.status(400).json({
      error: 'El nombre debe ser string'
    });
  }

  if (typeof price !== 'number') {
    return res.status(400).json({
      error: 'El precio debe ser numérico'
    });
  }

  if (price <= 0) {
    return res.status(400).json({
      error: 'Precio inválido, debe ser mayor a 0'
    });
  }

  next();
};
