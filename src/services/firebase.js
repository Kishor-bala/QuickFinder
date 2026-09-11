/**
 * Firebase Web SDK Initialization
 * Project: quick--finder
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA9dr9QYy1Y6NMuWQrVqtG-hNa5y4zrrD4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'quick--finder.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'quick--finder',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'quick--finder.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1046058442614',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1046058442614:web:451cfbe2966c146e7fa457',
};

const firebaseApp = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);
export const firebaseFirestore = getFirestore(firebaseApp);

export default firebaseApp;

