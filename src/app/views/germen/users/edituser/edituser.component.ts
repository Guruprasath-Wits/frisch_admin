import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from 'src/app/admin.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edituser',
  templateUrl: './edituser.component.html',
  styleUrls: ['./edituser.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class EdituserComponent implements OnInit {
  loginForm: FormGroup;
  userId: number = 0;
  user: any = {};  // Default initialization for user
  roles: any[] = []; // Initialize roles array

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    // Initialize the form group with controls and validators
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
      password: ['',Validators.required]
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
    // Get the user ID from the route parameters
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) {
      this.userId = +id;
      this.fetchUserDetails(); // Fetch user details by ID
      this.loadRoles();  // Load available roles for user selection
    }
  }

  // Function to load roles from the server
  loadRoles() {
    this.adminService.getRole().subscribe({
      next: (response: any) => {
        this.roles = response.role || [];
        console.log('Roles loaded:', this.roles);  // Log roles for debugging
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  
  fetchUserDetails() {
    this.adminService.getUserById(this.userId).subscribe(
      (response) => {
        this.user = response.user; 
        this.populateForm();  
      },
      (error) => {
        console.error('Error fetching user details:', error);
      }
    );
  }

  populateForm() {
    if (this.user) {
      this.loginForm.patchValue({
        
        lname: this.user.lname || '',
        fname: this.user.fname || '',
        username: this.user.lname + this.user.fname || '',
        company_name: this.user.company_name || '',
        email: this.user.email || '',
        phone: this.user.phone || '',
        address: this.user.address || '',
        street: this.user.street || '',
        zipcode: this.user.zipcode || '',
        Subtown: this.user.subtown || '',
        bday: this.user.dob || '',
        acchold: this.user.acc_no || '',
        IBAN: this.user.ban_no || '',
        BIC: this.user.bc_no || '',
        role: this.user.role || ''
      });
    }
  }

  
  onSubmit() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      const updatedUser = { id: this.userId, ...this.loginForm.value };
      this.adminService.updateUser(this.userId, updatedUser).subscribe(
        (response) => {
          Swal.fire('User Updated', 'User updated successfully', 'success');
          this.router.navigate(['/users']);
        },
        (error) => {
          Swal.fire('Error', 'Something went wrong', 'error');
          console.error('Error updating user:', error);
        }
      );
    }
  }

  get f() {
    return this.loginForm.controls;
  }
}
