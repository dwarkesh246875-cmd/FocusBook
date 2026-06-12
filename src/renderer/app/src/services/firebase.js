import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAtiRt9tTyTVtZnmUT1OXCURHYBA3NszFc",
  authDomain: "focusbook-d7b4a.firebaseapp.com",
  projectId: "focusbook-d7b4a",
  storageBucket: "focusbook-d7b4a.firebasestorage.app",
  messagingSenderId: "810679641718",
  appId: "1:810679641718:web:542352b8c3db610efae157",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const getUserRefs = (uid) => {
  return {
    tasksRef: collection(db, 'users', uid, 'tasks'),
    metaRef: doc(db, 'users', uid, 'meta', 'stats')
  };
};
