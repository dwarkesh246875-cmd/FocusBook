const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyAtiRt9tTyTVtZnmUT1OXCURHYBA3NszFc",
  authDomain: "focusbook-d7b4a.firebaseapp.com",
  projectId: "focusbook-d7b4a",
  storageBucket: "focusbook-d7b4a.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = process.argv[2];
const password = process.argv[3];
const docPathSuffix = process.argv[4] || 'career-tasks/default';

if (!email || !password) {
  console.error('Usage: node upload_firestore.js <email> <password> [docPathSuffix]');
  process.exit(1);
}

async function upload() {
  try {
    console.log(`Signing in as ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    console.log(`Signed in successfully! UID: ${uid}`);

    const dataPath = 'career-tasks-firebase.json';
    console.log(`Reading ${dataPath}...`);
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    const fullPath = `users/${uid}/${docPathSuffix}`;
    console.log(`Uploading to Firestore at: ${fullPath} ...`);
    
    await setDoc(doc(db, fullPath), jsonData);
    console.log('Upload complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

upload();
