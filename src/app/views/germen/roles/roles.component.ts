import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';  
import { Observable } from 'rxjs';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';

interface Role {
  id: number;
  role_name: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'] // Fixed 'styleUrl' to 'styleUrls'
})
export class RolesComponent implements OnInit {

  role: Role[] = []; // Initialize role as an empty array
  roleForm: FormGroup;
  isEditMode: boolean = false;
  selectedRole: Role | null = null;
  page: number = 1; 
  itemsPerPage: number = 5;
  totalPages: number = 1; // Initialize totalPages

  constructor(private fb: FormBuilder, private roleService: AdminService) { // Inject RoleService
    // Define form controls for the role form
    this.roleForm = this.fb.group({
      role_name: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadRoles(); // Load roles from API on initialization
  }

  loadRoles(): void {
    this.roleService.getRole().subscribe(
      response => {
        this.role = response.role; 
        this.calculateTotalPages(); 
      },
      error => {
        console.error('Error fetching roles:', error);
      }
    );
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.role.length / this.itemsPerPage);
  }

  onSubmit(): void {
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;

      // Prepare the role object
      const roleData: Role = {
        id: this.isEditMode && this.selectedRole ? this.selectedRole.id : 0, // Set to 0 if new role
        role_name: formValue.role_name,
      };

      if (this.isEditMode && this.selectedRole) {

        // Update role via API
        this.roleService.updateRole(roleData).subscribe(
          response => {
            if (response.status) {
              const index = this.role.findIndex((c) => c.id === this.selectedRole!.id);
              this.role[index] = response.role; 
              this.resetForm(); 
              this.calculateTotalPages(); 
              Swal.fire('Added!', 'Roles has been added.', 'success');
            } else {
              console.error('Failed to update role:', response.message);
              Swal.fire('Error!', 'Error updating Role.', 'error');

            }
          },
          error => {
            console.error('Error updating role:', error);
            Swal.fire('Error!', 'Error updating Role.', 'error');

          }
        );
      } else {

        if(roleData){

          this.roleService.createRole(roleData).subscribe(
            response => {
              if (response.status) {
                this.role.push(response.role); // Add the new role to the list
                this.resetForm(); // Reset form after successful creation
                this.calculateTotalPages();
                Swal.fire('Added!', 'Roles has been added.', 'success');
                 // Recalculate total pages after creation
              } else {
  
                Swal.fire('Error!', 'Error Create Role.', 'error');
                // console.error('Failed to create role:', response.message);
              
  
              }
            },
            error => {
              Swal.fire('Error!', 'Error Create Role.', 'error');
  
              console.error('Error creating role:', error);
            }
          );

        }
        else{

          Swal.fire('Error!', 'Error Create Role.', 'error');


        }

       
        
       
      }
    }
  }

  onEdit(role: Role): void {
    this.isEditMode = true;
    this.selectedRole = role;

    this.roleForm.patchValue({
      role_name: role.role_name,
    });
  }

  onDelete(roleId: number): void {
    // Delete role via API
    this.roleService.deleteRole(roleId).subscribe(
      response => {
        if (response.status) {
          this.role = this.role.filter((c) => c.id !== roleId); // Remove the deleted role
          this.calculateTotalPages(); 
          Swal.fire('Sucess!', 'Deleted Sucessfully', 'success');
          
        } else {
          console.error('Failed to delete role:', response.message);
        }
      },
      error => {
        console.error('Error deleting role:', error);
      }
    );
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedRole = null;
    this.roleForm.reset();
  }

  // Pagination methods
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

  // Get paginated role
  get paginatedRole(): Role[] {
    // Check if role is defined and return a slice, otherwise return an empty array
    const start = (this.page - 1) * this.itemsPerPage;
    return this.role ? this.role.slice(start, start + this.itemsPerPage) : [];
  }
}
