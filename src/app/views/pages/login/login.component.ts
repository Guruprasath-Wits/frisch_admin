import { Component, OnInit } from '@angular/core';
import { NgStyle, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  ContainerComponent, RowComponent, ColComponent, CardGroupComponent,
  TextColorDirective, CardComponent, CardBodyComponent, FormDirective,
  InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective
} from '@coreui/angular';
import { AdminService } from '../../../admin.service';
import Swal from 'sweetalert2';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule,
    ContainerComponent, RowComponent, ColComponent, CardGroupComponent,
    TextColorDirective, CardComponent, CardBodyComponent, FormDirective,
    InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective, NgStyle, HttpClientModule
  ]
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup = new FormGroup({});
  usernameError: boolean = false;
  passwordError: boolean = false;
  resData: any;  // Define resData type based on expected API response

  constructor(private router: Router, private _adminService: AdminService) { }

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl(''),
      password: new FormControl('')
    });
  }

  onSubmit() {
    const { email, password } = this.loginForm.value;

    // Reset error flags
    this.usernameError = !email;
    this.passwordError = !password;

    // Validate form
    if (this.usernameError || this.passwordError) {
      console.log('Form contains errors');
      return;
    }

    console.log('Form Values:', this.loginForm.value);




    this._adminService.login(this.loginForm.value).subscribe(
      (resData: any) => {
        this.resData = resData;
        // console.log(this.resData);

        if (this.resData.status) {
          localStorage.setItem('authToken', resData.token);
          localStorage.setItem('roleId', String(this.resData.user.role_id));
          localStorage.setItem('currentUser', String(this.resData.user.id));
          this.loadComponent();
        } else {
          Swal.fire('Failed');
          this.resetForm();
        }
      },
      (err: any) => {
        console.error(err);
        Swal.fire('Login Failed', 'An error occurred during login. Please try again.', 'error');
        this.resetForm();
      }
    );
  }

  resetForm() {
    this.loginForm.reset();
    this.usernameError = false;
    this.passwordError = false;
  }

  loadComponent() {
    if (this.resData.token) {
      Swal.fire({
        title: 'Login Successfully',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'swal-narrow-alert'
        }
      }).then(() => {
        // Force a hard reload to clear any cached state between user sessions
        window.location.href = '/#/dashboard';
      });
    }
    else {
      Swal.fire({
        title: 'Failed',
        text: 'Login failed. Please check your credentials.',
        icon: 'error',
        confirmButtonText: 'Try Again'
      });
    }
  }
}
