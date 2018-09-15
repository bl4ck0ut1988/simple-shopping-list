import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;

  usernameValue: string;
  passwordValue: string;

  user: any;
  userEmail: string;

  constructor(private fb: FormBuilder, private auth: AuthService) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.user = this.auth.getUser();
    this.user.subscribe(bla => {
      this.userEmail = bla ? bla.email : '';
    });
  }

  signIn(): void {
    this.auth.login(this.usernameValue, this.passwordValue);
  }

  signUp(): void {
    this.auth.signup(this.usernameValue, this.passwordValue);
  }

  logout(): void {
    this.auth.logout();
  }

}
