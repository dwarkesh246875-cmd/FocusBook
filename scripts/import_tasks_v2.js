const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");

const files = fs.readdirSync(__dirname);
const keyFile = files.find(f => f.startsWith('focusbook-') && f.endsWith('.json'));

if (!keyFile) {
  console.error("Could not find the service account key file. Please download it again to this folder.");
  process.exit(1);
}

const serviceAccount = require("./" + keyFile);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper to generate a UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Add days to a date and return YYYY-MM-DD
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, '0');
  const day = String(result.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function upload() {
  try {
    const email = "dwarkesh246875@gmail.com";
    console.log(`Finding user UID for ${email}...`);
    const user = await getAuth().getUserByEmail(email);
    const uid = user.uid;
    console.log(`Found UID: ${uid}`);

    const tasksRef = db.collection('users').doc(uid).collection('tasks');

    console.log("Cleaning up previously imported individual tasks...");
    const snapshot = await tasksRef.where("area", "==", "career").get();
    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const str = data.text || data.name || "";
      if (str.startsWith('[')) {
        await doc.ref.delete();
        deletedCount++;
      }
    }
    console.log(`Deleted ${deletedCount} incorrect tasks.`);

    const dataPath = 'career-tasks.json';
    console.log(`Reading ${dataPath}...`);
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    const today = new Date();
    let totalAdded = 0;

    console.log("Transforming and uploading grouped tasks...");

    // Iterate through weeks and days
    for (const week of data.weeks) {
      for (const day of week.days) {
        // Day 1 = 0 days from today, Day 2 = 1 day from today, etc.
        const daysOffset = day.dayNumber - 1;
        const taskDate = addDays(today, daysOffset);

        const subItemsArray = day.tasks.map(t => ({
          id: uuidv4(),
          name: t.text,
          done: false
        }));

        const focusbookTask = {
          id: uuidv4(),
          name: `[W${week.weekNumber}D${day.dayNumber}] ${week.title} - ${day.title}`,
          done: false,
          area: "career",
          priority: "medium",
          date: taskDate,
          schedule: "date",
          created: Date.now(),
          subItems: subItemsArray
        };

        await tasksRef.doc(focusbookTask.id).set(focusbookTask);
        totalAdded++;
      }
    }

    console.log(`Upload complete! Inserted ${totalAdded} nicely grouped daily tasks into your FocusBook app.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

upload();
