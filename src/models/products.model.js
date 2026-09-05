// models/products.model.js
// Lógica de acceso a datos para productos
// Este modelo se comunica con la base de datos (Firebase) 
// para obtener los datos y realizar las operaciones necesarias.

// Importamos las funciones necesarias de Firebase
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

// Importamos la configuración de Firebase
import db from '../config/firebase.js';

const productsCollection = collection(db, 'products');


// función GET para obtener todos los productos
export const getAllProductsModel = async () => {
  const snapshot = await getDocs(productsCollection);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// función GET para obtener un producto por ID
export const getProductByIdModel = async (id) => {
  const productRef = doc(productsCollection, id);

  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
};

// función POST para crear un nuevo producto
export const createProductModel = async (product) => {
  const productRef = await addDoc(productsCollection, product);

  return productRef.id;
};

// función PUT para actualizar un producto existente
export const updateProductModel = async (id, product) => {
  const productRef = doc(productsCollection, id);

  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    return null;
  }

  await updateDoc(productRef, product);

  return {
    id: productRef.id,
    ...product
  };
};

// función DELETE para eliminar un producto por ID
export const deleteProductModel = async (id) => {
  const productRef = doc(productsCollection, id);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    return null;
  }

  const deletedProduct = {
    id: snapshot.id,
    ...snapshot.data()
  };

  await deleteDoc(productRef);

  return deletedProduct;
};
