// src/services/sales.service.js
// Lógica de negocio para ventas.
// Es el intermediario entre el controlador y el modelo.

import {
  createSaleModel,
  getAllSalesModel,
  getSaleByIdModel
} from '../models/sales.model.js';

// Crear una venta con uno o más ítems (descuenta stock de cada producto)
export const createSaleService = async (items) => {
  return await createSaleModel(items);
};

// Obtener todas las ventas
export const getSalesService = async () => {
  return await getAllSalesModel();
};

// Obtener una venta por id
export const getSaleService = async (id) => {
  return await getSaleByIdModel(id);
};
