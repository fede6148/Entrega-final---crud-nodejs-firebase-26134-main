// src/models/users.model.js
// Acceso directo a Firestore para la colección "users".
// Contiene funciones para CRUD de usuarios.

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';

import db from '../config/firebase.js';

const usersCollection = collection(db, 'users');

// GET todos los usuarios
export const getAllUsersModel = async () => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// GET un usuario por ID
export const getUserByIdModel = async (id) => {
  const userRef = doc(usersCollection, id);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  return { id: snapshot.id, ...snapshot.data() };
};

// GET un usuario por email (para chequear duplicados)
export const getUserByEmailModel = async (email) => {
  const q = query(usersCollection, where('email', '==', email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

// POST crear usuario
export const createUserModel = async (userData) => {
  const userRef = await addDoc(usersCollection, userData);
  return userRef.id;
};

// PUT actualizar usuario
export const updateUserModel = async (id, userData) => {
  const userRef = doc(usersCollection, id);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  await updateDoc(userRef, userData);

  return { id: userRef.id, ...userData };
};

// DELETE eliminar usuario
export const deleteUserModel = async (id) => {
  const userRef = doc(usersCollection, id);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  await deleteDoc(userRef);

  return { id: snapshot.id, ...snapshot.data() };
};
