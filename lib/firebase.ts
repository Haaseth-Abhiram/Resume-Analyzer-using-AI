import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDEZhON_y4VYxWnurSvd0A0XYCJYLpNMro",
  authDomain: "resumeanalyzer-28c25.firebaseapp.com",
  projectId: "resumeanalyzer-28c25",
  storageBucket: "resumeanalyzer-28c25.firebasestorage.app",
  messagingSenderId: "865023360322",
  appId: "1:865023360322:web:7bf9071b6dd83ac8a41cdb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 
const googleProvider = new GoogleAuthProvider();

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signUp = async (email: string, password: string, fullName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: fullName
    });
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      fullName,
      email,
      createdAt: new Date().toISOString()
    });
    
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    await setDoc(doc(db, 'users', result.user.uid), {
      fullName: result.user.displayName,
      email: result.user.email,
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data();
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export { auth, db, storage };