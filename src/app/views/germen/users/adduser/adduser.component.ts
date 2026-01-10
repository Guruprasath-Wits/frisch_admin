import { Component, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import {
  ContainerComponent,
  RowComponent,
  ColComponent,
  CardGroupComponent,
  TextColorDirective,
  CardComponent,
  CardBodyComponent,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  FormControlDirective,
  ButtonDirective,

} from '@coreui/angular';

@Component({
  selector: 'app-adduser',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardGroupComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    FormDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    FormControlDirective,
    ButtonDirective,
    NgStyle,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule
  ],
  templateUrl: './adduser.component.html',
  styleUrl: './adduser.component.scss'
})
export class AdduserComponent implements OnInit {
  loginForm: FormGroup;
  userId: number = 0;
  user: any;
  roles: any[] = []; // Array to store roles

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.loginForm = this.fb.group({
      username: [],
      lname: [''],
      fname: [''],
      company_name: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      street: [''],
      zipcode: [''],
      Subtown: [''],
      bday: [''],
      acchold: [''],
      IBAN: ['', []],
      BIC: [''],
      role: ['', Validators.required], // Added required validator
      password: ['', Validators.required],
      floor: [''],
      lift_availability: ['']
    });
    // this.loginForm.get('role')?.valueChanges.subscribe((selectedRole) => {
    //   const ibanControl = this.loginForm.get('IBAN');

    //   if (selectedRole === 'Customer') {
    //     ibanControl?.setValidators([
    //       Validators.required,
    //       Validators.pattern(/^[A-Z0-9]{22}$/) // IBAN 22 characters pattern
    //     ]);
    //   } else {
    //     ibanControl?.clearValidators();
    //   }
    //   ibanControl?.updateValueAndValidity();
    // });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles() {
    this.adminService.getRole().subscribe({
      next: (response: any) => {
        this.roles = response.role;
        console.log('Roles loaded:', this.roles);
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  populateForm() {
    if (this.user) {
      this.loginForm.patchValue({

        fname: this.user.fname,
        lname: this.user.lname,
        username: this.user.lname + this.user.fname || '',
        company_name: this.user.company_name,
        email: this.user.email,
        phone: this.user.phone,
        address: this.user.address,
        street: this.user.street,
        password: this.user.password,
        zipcode: this.user.zipcode,
        Subtown: this.user.subtown,
        bday: this.user.dob,
        acchold: this.user.acc_no,
        IBAN: this.user.ban_no,
        BIC: this.user.bc_no,
        role: this.user.role
      });
    }
  }

  onSubmit() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      const createUser = { id: this.userId, ...this.loginForm.value };
      console.log('====================================');
      console.log(createUser);
      console.log('====================================');
      this.adminService.createUser(createUser).subscribe(
        (response) => {
          console.log('User Created successfully:', response);
          Swal.fire('User Created', 'User Created successfully', 'success');

          this.router.navigate(['/users']);
        },
        (error) => {
          console.error('Error updating user:', error);
          Swal.fire('Error', 'Something Went wrong', 'error');

        }
      );
    }
  }

  get f() {
    return this.loginForm.controls;
  }
}