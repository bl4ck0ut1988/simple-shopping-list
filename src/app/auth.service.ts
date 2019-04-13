import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';

import { Observable } from 'rxjs';

@Injectable()
export class AuthService {

  user: Observable<firebase.User>;
  userCollection: AngularFirestoreCollection<any>;

  constructor(
    private firebaseAuth: AngularFireAuth,
    private afs: AngularFirestore,
    public snackBar: MatSnackBar) {
    this.user = firebaseAuth.authState;
    this.userCollection = this.afs.collection('users');
  }

  doGoogleLogin() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      this.firebaseAuth.auth
      .signInWithPopup(provider)
      .then(res => {
        resolve(res);
      });
    });
  }

  signup(username: string, email: string, password: string, snackBar: MatSnackBar) {
    this.firebaseAuth
    .auth
    .createUserWithEmailAndPassword(email, password)
    .then(response => {
      const user: firebase.User = response.user;
      this.userCollection.doc(user.uid).set({
        username: username,
        email: user.email
      });
      console.log('Success!', response);
    })
    .catch(error => {
      console.log('Something went wrong:', error.message);
      snackBar.open('Can not sign up: ' + error.message, 'Dismiss', {duration: 3000});
    });
  }

  login(email: string, password: string, snackBar: MatSnackBar) {
    this.firebaseAuth
    .auth
    .signInWithEmailAndPassword(email, password)
    .then(value => {
      console.log('Login Successful!', value.user.uid);
    })
    .catch(error => {
      console.log('Can not login:', error.message);
      snackBar.open('Can not sign in: ' + error.message, 'Dismiss', {duration: 3000});
    });
  }

  logout() {
    this.firebaseAuth.auth.signOut();
  }

  getUser(): Observable<firebase.User> {
    return this.user;
  }
}
