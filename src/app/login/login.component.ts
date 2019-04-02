import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  isLoading: boolean = true;
  loginForm: FormGroup;
  signUpForm: FormGroup;

  user: any;
  userEmail: string;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) { }

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
      } else {
        this.isLoading = false;
      }
    });
  }

  signIn(): void {
    this.auth.login(
      this.loginForm.get('emailLogin').value,
      this.loginForm.get('passwordLogin').value
    );
  }

  signUp(): void {
    this.auth.signup(this.signUpForm.get('usernameSignUp').value,
      this.signUpForm.get('emailSignUp').value,
      this.signUpForm.get('passwordSignUp').value);
  }

  logout(): void {
    this.auth.logout();
  }
}
