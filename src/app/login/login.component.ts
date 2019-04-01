import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  signUpForm: FormGroup;

  user: any;
  userEmail: string;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      emailLogin: ['', Validators.required],
      passwordLogin: ['', Validators.required]
    });

    this.signUpForm = this.fb.group({
      usernameSignUp: ['', Validators.required],
      emailSignUp: ['', Validators.required],
      passwordSignUp: ['', Validators.required]
    });

    this.user = this.auth.getUser();
    this.user.subscribe(user => {
      if (user) {
        this.router.navigate(['/listview']);
      }
    });
  }

  signIn(): void {
    this.auth.login(
      this.loginForm.get('emailLogin').value,
      this.loginForm.get('passwordLogin').value,
      this.snackBar
    );
  }

  signInWithGoogle(): void {
    this.auth.doGoogleLogin();
  }

  signUp(): void {
    this.auth.signup(this.signUpForm.get('usernameSignUp').value,
      this.signUpForm.get('emailSignUp').value,
      this.signUpForm.get('passwordSignUp').value,
      this.snackBar);
  }

  logout(): void {
    this.auth.logout();
  }
}

@Component({
  selector: 'notification-snack-bar',
  templateUrl: '../notification-snack-bar.html'
})
export class NotificationSnackBarComponent {}
