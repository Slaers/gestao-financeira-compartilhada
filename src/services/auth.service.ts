import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Firestore
} from 'firebase/firestore';
import { Usuario } from '../models/usuario.model';

const firebaseConfig = {
  apiKey: "AIzaSyBeJyVD0Os7WWpEiObShsYzE2qoNRV3PY0",
  authDomain: "gestao-finc-compartilhada.firebaseapp.com",
  projectId: "gestao-finc-compartilhada",
  storageBucket: "gestao-finc-compartilhada.firebasestorage.app",
  messagingSenderId: "988873226213",
  appId: "1:988873226213:web:8cb05b07ba7c48e574e10c",
  measurementId: "G-WGWJJXRT71"
};

class AuthService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  private async updateUserData(firebaseUser: FirebaseUser): Promise<void> {
    const userRef = doc(this.db, 'users', firebaseUser.uid);
    const data: Usuario = {
      id: firebaseUser.uid,
      nome: firebaseUser.displayName || undefined,
      email: firebaseUser.email || undefined,
    };
    try {
      await setDoc(userRef, data, { merge: true });
      console.log("User data updated/created in Firestore:", data);
    } catch (error) {
      console.error("Error updating user data in Firestore:", error);
    }
  }

  onAuthStateChangedWrapper(callback: (user: Usuario | null) => void): () => void {
    return onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(this.db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            callback(docSnap.data() as Usuario);
          } else {
            // If no Firestore data, use info from firebaseUser and create doc
            const newUser: Usuario = {
              id: firebaseUser.uid,
              nome: firebaseUser.displayName || undefined,
              email: firebaseUser.email || undefined,
            };
            await this.updateUserData(firebaseUser); // This will create the document
            callback(newUser);
          }
        } catch (error) {
          console.error("Error fetching user document from Firestore:", error);
          // Fallback to firebaseUser data if Firestore fails
          const fallbackUser: Usuario = {
            id: firebaseUser.uid,
            nome: firebaseUser.displayName || undefined,
            email: firebaseUser.email || undefined,
          };
          callback(fallbackUser);
        }
      } else {
        callback(null);
      }
    });
  }

  async googleSignIn(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(this.auth, provider);
      await this.updateUserData(userCredential.user);
      console.log("Google sign-in successful.");
    } catch (error) {
      console.error("Google sign-in error:", error);
      // Handle specific errors, e.g., popup closed by user
      if (error.code === 'auth/popup-closed-by-user') {
        alert('Login popup was closed. Please try again.');
      } else {
        alert('An error occurred during Google Sign-In. Please try again.');
      }
    }
  }

  async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Sign out error:", error);
      alert('An error occurred during sign out. Please try again.');
    }
  }
}

export const authService = new AuthService();
