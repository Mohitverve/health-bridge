// 1️⃣ Install these first:
//    npm install firebase

import { initializeApp } from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getFirestore }   from 'firebase/firestore';


// Your web app’s Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyBo_anFAq__cS-sER6GBJ4z7Pj7cDgTR0s",
  authDomain: "health-2e9a7.firebaseapp.com",
  projectId: "health-2e9a7",
  storageBucket: "health-2e9a7.firebasestorage.app",
  messagingSenderId: "483964364663",
  appId: "1:483964364663:web:6740ba70dc0c697dcc2372"
};
const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);