import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../../admin.service';
import Swal from 'sweetalert2';

interface Area {
  id: number;
  area_name: string;
  zipcode: number;
}

@Component({
  selector: 'app-delivery-areas',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './delivery-areas.component.html',
  styleUrls: ['./delivery-areas.component.scss']
})
export class DeliveryAreasComponent implements OnInit {

  areas: Area[] = [];
  areaForm: FormGroup;
  isEditMode: boolean = false;
  selectedArea: Area | null = null;
  page: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  constructor(private fb: FormBuilder, private adminService: AdminService) {
    this.areaForm = this.fb.group({
      area_name: ['', Validators.required],
      zipcode: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getAreazips();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.areas.length / this.itemsPerPage);
  }

  getAreazips(): void {
    this.adminService.getArea().subscribe(
      (response) => {
        console.log('API Response:', response); // Debugging

        if (response && response.status && Array.isArray(response.area)) {
          this.areas = response.area.map((area: { id: number; area_name: string; zipcode: string }) => ({
            id: area.id,
            area_name: area.area_name,
            zipcode: area.zipcode,
          }));
        } else {
          console.warn('No areas found or invalid response format.');
          this.areas = []; // Ensure areas array is reset
        }

        this.calculateTotalPages(); // Ensure pagination updates
      },
      (error) => {
        console.error('Error fetching areas:', error);
        this.areas = []; // Reset areas on error
      }
    );
  }


  onSubmit(): void {
    if (this.areaForm.valid) {
      const formValue = this.areaForm.value;

      // Explicitly define areaData as an Area object
      const areaData: Area = {
        id: this.isEditMode && this.selectedArea ? this.selectedArea.id : 0, // Use 0 or a unique value for new areas
        area_name: formValue.area_name,
        zipcode: formValue.zipcode
      };

      if (this.isEditMode && this.selectedArea) {
        // Update existing area
        this.adminService.updateAera(areaData).subscribe(
          (response) => {
            if (response.status) {
              this.getAreazips(); // Refresh list
              this.resetForm();
              Swal.fire('Success', 'Area updated successfully', 'success');
            } else {
              console.error('Failed to update area:', response.message);
            }
          },
          (error) => {
            console.error('Error updating area:', error);
          }
        );
      } else {
        // Create new area
        this.adminService.createAera(areaData).subscribe(
          (response) => {
            if (response.status) {
              this.getAreazips(); // Refresh list
              this.resetForm();
              Swal.fire('Success', 'Area added successfully', 'success');
            } else {
              console.error('Failed to add area:', response.message);
            }
          },
          (error) => {
            console.error('Error adding area:', error);
          }
        );
      }
    } else {
      Swal.fire('Error', 'All fields are required', 'error');
    }
  }

  onEdit(area: Area): void {
    this.isEditMode = true;
    this.selectedArea = area;

    this.areaForm.patchValue({
      area_name: area.area_name,
      zipcode: area.zipcode,
      id: area.id
    });
  }

  onDelete(areaId: number): void {
    this.adminService.deleteAera(areaId).subscribe(
      (response) => {
        if (response.status) {
          this.areas = this.areas.filter(area => area.id !== areaId); // Remove from UI
          setTimeout(() => this.getAreazips(), 300); // Refresh with delay
          Swal.fire('Success', 'Area deleted successfully', 'success');
        } else {
          console.error('Failed to delete area:', response.message);
        }
      },
      (error) => {
        console.error('Error deleting area:', error);
      }
    );
  }


  resetForm(): void {
    this.isEditMode = false;
    this.selectedArea = null;
    this.areaForm.reset();
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

  get paginatedAreas(): Area[] {
    const start = (this.page - 1) * this.itemsPerPage;
    return this.areas.slice(start, start + this.itemsPerPage);
  }
}
