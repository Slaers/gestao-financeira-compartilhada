import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app'; // Import firebase
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser$: Observable<Usuario | null | undefined>; // undefined for loading, null for not logged in

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore
  ) {
    this.currentUser$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.afs.doc<Usuario>(`users/${user.uid}`).valueChanges().pipe(
            map(userData => {
              if (userData) {
                return {
                  id: user.uid,
                  nome: userData.nome || user.displayName || 'Usuário sem nome', // Fallback for name
                  email: userData.email || user.email || undefined
                };
              } else {
                // If no document in 'users' collection, try to create one or return partial data
                // This case might need more robust handling depending on app requirements
                return {
                  id: user.uid,
                  nome: user.displayName || 'Usuário sem nome',
                  email: user.email || undefined
                };
              }
            })
          );
        } else {
          return of(null); // User is not logged in
        }
      })
    );
  }

  // Get current user's data
  getCurrentUser(): Observable<Usuario | null | undefined> {
    return this.currentUser$;
  }

  // Get current user's ID (convenience)
  getCurrentUserId(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => user ? user.uid : null)
    );
  }

  // Example Login (Google - can be expanded)
  async googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const credential = await this.afAuth.signInWithPopup(provider);
    if (credential.user) {
      return this.updateUserData(credential.user);
    }
    return null;
  }

  // Example Logout
  async signOut() {
    await this.afAuth.signOut();
  }

  // Updates or creates user data in Firestore 'users' collection
  private updateUserData(firebaseUser: firebase.User) {
    const userRef = this.afs.doc(`users/${firebaseUser.uid}`);
    const data: Usuario = {
      id: firebaseUser.uid,
      nome: firebaseUser.displayName || 'Usuário', // Ensure name is present
      email: firebaseUser.email || undefined,
    };
    return userRef.set(data, { merge: true });
  }
}
