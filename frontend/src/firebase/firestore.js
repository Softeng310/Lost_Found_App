import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './config.js';

// Collection reference
const itemsCollection = collection(db, 'items');

// Add a new lost/found item
export const addItem = async (itemData) => {
    try {
        const docRef = await addDoc(itemsCollection, {
            ...itemData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...itemData };
    } catch (error) {
        console.error('Error adding item: ', error);
        throw error;
    }
};

// Get all items
export const getAllItems = async () => {
    try {
        const q = query(itemsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting items: ', error);
        throw error;
    }
};

// Get items by type (lost/found)
export const getItemsByType = async (type) => {
    try {
        const q = query(
            itemsCollection,
            where('type', '==', type),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting items by type: ', error);
        throw error;
    }
};

// Get a single item by ID
export const getItemById = async (id) => {
    try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Item not found');
        }
    } catch (error) {
        console.error('Error getting item: ', error);
        throw error;
    }
};

// Update an item
export const updateItem = async (id, updateData) => {
    try {
        const docRef = doc(db, 'items', id);
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        return { id, ...updateData };
    } catch (error) {
        console.error('Error updating item: ', error);
        throw error;
    }
};

// Delete an item
export const deleteItem = async (id) => {
    try {
        const docRef = doc(db, 'items', id);
        await deleteDoc(docRef);
        return id;
    } catch (error) {
        console.error('Error deleting item: ', error);
        throw error;
    }
};

// Search items by keyword
export const searchItems = async (keyword) => {
    try {
        const q = query(
            itemsCollection,
            where('title', '>=', keyword),
            where('title', '<=', keyword + '\uf8ff'),
            orderBy('title'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error searching items: ', error);
        throw error;
    }
}; 