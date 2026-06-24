const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

const serviceAccount = require("./focusbook-d7b4a-firebase-adminsdk-fbsvc-c91109a644.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function upload() {
  try {
    const dataPath = 'career-tasks-firebase.json';
    console.log(`Reading ${dataPath}...`);
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Write to the DK collection, document 'career-tasks'
    const fullPath = `DK/career-tasks`;
    console.log(`Uploading to Firestore at: ${fullPath} ...`);
    
    await db.doc(fullPath).set(jsonData);
    console.log('Upload complete! You can now check the Firebase console.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

upload();
