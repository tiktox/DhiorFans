// Test Firebase connection
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAg2XWnxEB0c0qYEatzIzO4DEZwoO0SZjM",
  authDomain: "moment24-200cb.firebaseapp.com",
  projectId: "moment24-200cb",
  storageBucket: "moment24-200cb.firebasestorage.app",
  messagingSenderId: "162325479083",
  appId: "1:162325479083:web:b9c46e895f2bac327d81ee"
};

async function testFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase conectado correctamente');
    console.log('Project ID:', firebaseConfig.projectId);
  } catch (error) {
    console.error('❌ Error conectando Firebase:', error.message);
  }
}

testFirebase();