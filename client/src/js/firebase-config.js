import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbgxOB65n5WUnmsiOvdGBqQ08-459_-gk",
  authDomain: "coffee-management-7f0b0.firebaseapp.com",
  projectId: "coffee-management-7f0b0",
  storageBucket: "coffee-management-7f0b0.firebasestorage.app",
  messagingSenderId: "555141288649",
  appId: "1:555141288649:web:530e3dd73daad908dbb318"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Khởi tạo các dịch vụ
const auth = getAuth(app);
const db = getFirestore(app);

// Xuất các dịch vụ để dùng trong các file khác
export { auth, db };
