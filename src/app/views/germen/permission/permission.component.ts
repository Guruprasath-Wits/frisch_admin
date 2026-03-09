import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminService } from '../../../admin.service';
import { CommonModule } from '@angular/common';

interface Role {
  id: number;
  role_name: string;
  access: { [key: string]: number };
}

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
})
export class PermissionComponent implements OnInit {
  roleForm: FormGroup;
  pages: string[] = [
    'Category', 'Product', 'Customer_Enquiry', 'Coupon Management', 'OrderList', 'Sample_Order',
    'Our_Delivery_Areas', 'User_Advantages', 'Jobs', 'FAQ', 'Roles',
    'Permissions', 'Users', 'Settings', 'Imprint', 'Subscription_Transactions'
  ];
  allocatedAccess: { [key: string]: number } = {};
  roles: Role[] = [];
  permissions: Role[] = [];
  isEditMode: boolean = false;
  selectedRole: Role | null = null;
  page: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  dropdownOpen: boolean = false;

  constructor(private fb: FormBuilder, private adminService: AdminService) {
    this.roleForm = this.fb.group({
      role: ['', Validators.required],
    });

    this.initializeAccess();
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  get f() {
    return this.roleForm.controls;
  }

  initializeAccess(): void {
    this.pages.forEach((page) => (this.allocatedAccess[page] = 0));
  }

  loadRoles(): void {
    this.adminService.getRole().subscribe({
      next: (response: any) => {
        if (response.status) {
          this.roles = response.role;
          this.calculateTotalPages();
        } else {
          Swal.fire('Error!', 'Failed to load roles.', 'error');
        }
      },
      error: (error: any) => Swal.fire('Error!', 'Failed to load roles.', 'error'),
    });
  }

  loadPermissions(): void {
    this.adminService.loadPermissions().subscribe({
      next: (response: any) => {
        if (response.status) {
          this.permissions = response.permissions.map((permission: any) => {
            const filteredAccess = this.pages.reduce((acc, page) => {
              if (permission[page] === 1) {
                acc[page] = 1;
              }
              return acc;
            }, {} as { [key: string]: number });

            return {
              id: permission.role_id,
              role_name: this.getRoleName(permission.role_id),
              access: filteredAccess,
            };
          });
        } else {
          Swal.fire('Error!', 'Failed to load permissions.', 'error');
        }
      },
      error: () => Swal.fire('Error!', 'Failed to load permissions.', 'error'),
    });
  }

  getRoleName(roleId: number): string {
    const role = this.roles.find((role) => role.id === roleId);
    return role ? role.role_name : 'Unknown';
  }

  onAccessChange(page: string, event: Event): void {
    this.allocatedAccess[page] = (event.target as HTMLInputElement).checked ? 1 : 0;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectRole(role: any) {
    this.roleForm.patchValue({ role: role.id });
    this.dropdownOpen = false;
  }

  getSelectedRoleName(): string {
    const roleId = this.roleForm.get('role')?.value;
    const role = this.roles.find(r => r.id == roleId);
    return role ? role.role_name : 'Choose a role...';
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      Swal.fire('Error!', 'Please select a role.', 'error');
      return;
    }

    const roleData = {
      role_id: this.roleForm.value.role,
      access: this.allocatedAccess,
    };

    if (this.isEditMode && this.selectedRole) {
      this.adminService.updatePermissions(roleData.role_id, roleData).subscribe({
        next: () => {
          Swal.fire('Success!', 'Permissions updated successfully.', 'success');
          this.loadPermissions();
          this.resetForm();
        },
        error: () => Swal.fire('Error!', 'Failed to update permissions.', 'error'),
      });
    } else {
      this.adminService.savePermissions(roleData).subscribe({
        next: () => {
          Swal.fire('Success!', 'Permissions added successfully.', 'success');
          this.loadPermissions();
          this.resetForm();
        },
        error: () => Swal.fire('Error!', 'Failed to add permissions.', 'error'),
      });
    }
  }

  onEdit(permission: Role): void {
    this.isEditMode = true;
    this.selectedRole = permission;

    this.roleForm.patchValue({ role: permission.id });
    this.initializeAccess();

    Object.keys(permission.access).forEach((page) => {
      this.allocatedAccess[page] = permission.access[page];
    });
  }

  onDelete(roleId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deletePermission(roleId).subscribe({
          next: (response: any) => {
            if (response.status) {
              // Successfully deleted, filter out the deleted role
              this.permissions = this.permissions.filter((p) => p.id !== roleId);

              // Recalculate pagination after deletion
              this.calculateTotalPages();

              // Show success message after deletion
              Swal.fire('Deleted!', 'Role has been deleted successfully.', 'success');
            } else {
              Swal.fire('Error!', response.message || 'Failed to delete the role.', 'error');
            }
          },
          error: (error: any) => {
            Swal.fire('Error!', error.message || 'Failed to delete the role.', 'error');
          },
        });
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedRole = null;
    this.roleForm.reset();
    this.initializeAccess();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.permissions.length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  get paginatedPermissions(): Role[] {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    return this.permissions.slice(startIndex, startIndex + this.itemsPerPage);
  }
}
