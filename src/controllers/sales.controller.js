// src/controllers/sales.controller.js
// Controladores para ventas.

import {
  createSaleService,
  getSalesService,
  getSaleService
} from '../services/sales.service.js';

// Controlador para registrar una nueva venta (uno o más productos)
export const createSale = async (req, res) => {
  try {
    const { items } = req.body;

    const sale = await createSaleService(items);

    res.status(201).json(sale);

  } catch (error) {
    if (error.message === 'PRODUCTO_NO_ENCONTRADO') {
      return res.status(404).json({
        error: `Un producto de la venta no existe. ${error.detalle || ''}`.trim()
      });
    }

    if (error.message === 'STOCK_INSUFICIENTE') {
      return res.status(409).json({
        error: `No hay stock suficiente. ${error.detalle || ''}`.trim()
      });
    }

    res.status(500).json({
      error: 'Error registrando la venta'
    });
  }
};

// Controlador para listar todas las ventas
export const getSales = async (req, res) => {
  try {
    const sales = await getSalesService();

    res.json(sales);

  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo ventas'
    });
  }
};

// Controlador para obtener una venta por id
export const getSaleById = async (req, res) => {
  try {
    const sale = await getSaleService(req.params.id);

    if (!sale) {
      return res.status(404).json({
        error: 'Venta no encontrada'
      });
    }

    res.json(sale);

  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo la venta'
    });
  }
};
