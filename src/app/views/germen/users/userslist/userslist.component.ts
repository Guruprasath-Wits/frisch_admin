import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from '../../../../admin.service';
import Swal from 'sweetalert2';

export interface User {
  id: number;
  username: string;
  email: string;
  phoneNo: string;
  address: string;
  street: string;
  zipCode: string;
  subtown: string;
  bday: string;
  acc_no: string;
  ban_no: string;
  bc_no: string;
  role: string;
  ort: string;
  active: boolean;
  status: string;
}

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-userslist',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, TranslateModule],
  templateUrl: './userslist.component.html',
  styleUrls: ['./userslist.component.scss']
})



export class UserslistComponent implements OnInit {


  users: User[] = [];
  searchTerm: string = '';
  searchEmail: string = '';
  searchPhone: string = '';
  page: number = 1;
  itemsPerPage: number = 5;

  constructor(private router: Router, private adminService: AdminService) { }

  ngOnInit(): void {

    this.loadUser();

  }

  toggleUser(user: User) {
    const newStatus = user.status === '1' ? 0 : 1;

    this.adminService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        user.status = newStatus.toString(); // keep string consistency
      },
      error: (err) => {
        console.error('Error updating status:', err);
      }
    });
  }


  onToggleChange(user: any, isChecked: boolean) {
    const newStatus = isChecked ? 1 : 0;

    // Ensure user.id is converted to number if needed
    this.adminService.updateUserStatus(+user.id, newStatus).subscribe({
      next: (response) => {
        console.log('Status updated:', response);
        user.status = newStatus.toString(); // keep consistency with string
      },
      error: (err) => {
        console.error('Failed to update status:', err);
      }
    });
  }










  loadUser(): void {
    this.adminService.loadUsers().subscribe(
      (response: any) => {
        console.log(response);

        this.users = response.user.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          phoneNo: user.phone,
          street: user.street,
          address: user.address,
          zipCode: user.zipcode,
          subtown: user.subtown,
          bday: user.dob,
          acc_no: user.acc_no,
          ban_no: user.ban_no,
          bc_no: user.bc_no,
          role: user.role,
          ort: user.ort, // Ensure ort is defined, default to empty string if not present
          status: user.status
        }));

      },
      (error: any) => {
        console.error('Error fetching users:', error);
      }
    );
  }



  get filteredUsers() {
    return this.users.filter(user =>
      (!this.searchTerm || user.username.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (!this.searchEmail || user.email.toLowerCase().includes(this.searchEmail.toLowerCase())) &&
      (!this.searchPhone || user.phoneNo.includes(this.searchPhone))
    );
  }

  get totalPages() {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  addUser() {
    this.router.navigate(['/users/useradd']);
  }

  editUser(user: any) {
    this.router.navigate(['/users/useredit', user.id]);
    console.log('Editing user:', user);
  }

  deleteUser(userId: number) {
    this.users = this.users.filter(user => user.id !== userId);
    console.log('Deleted user with ID:', userId);

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6"
    }).then(result => {
      if (result.isConfirmed) {
        this.adminService.deleteUser(userId).subscribe(
          response => {
            this.users = this.users.filter((p) => p.id !== userId);
            Swal.fire('Deleted!', 'User has been deleted.', 'success');
            // this.loadUser();
          },
          (error: any) => {
            Swal.fire('Error', 'Failed to delete User', 'error');
          }
        );
      }
    });


  }

  onPageChange(newPage: number) {
    this.page = newPage;
  }

  // Methods for pagination
  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }
}
