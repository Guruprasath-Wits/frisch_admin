import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../../admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent implements OnInit {
  imprintForm: FormGroup;
  isEditMode = false;
  currentImprintId: string | null = null;
  isLoading = false; // Added for loading state

  constructor(private fb: FormBuilder, private settingService: AdminService) {
    this.imprintForm = this.fb.group({
      name: ['', Validators.required],
      company_name: ['', Validators.required],
      address: [''],
      tel: [''],
      email: [''],
      business_type: ['', Validators.required],
      platform: [''],
      link: [''],
      notes: [''],
      privacy_policy:['']
    });
  }

  ngOnInit(): void {
    this.getSettings();
  }

  getSettings(): void {
    this.isLoading = true;
    this.settingService.loadImprint().subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response?.status && response.impressum?.length) {
          console.log(response);
          
          const imprintData = response.impressum[0]; // Accessing the first object in the array
          this.imprintForm.patchValue(imprintData);
          this.currentImprintId = imprintData.id;
          this.isEditMode = true;
        } else {
          console.warn('No imprint data found.');
        }
      },
      error => {
        this.isLoading = false;
        console.error('Error fetching settings:', error);
        Swal.fire('Error', 'Failed to fetch imprint settings', 'error');
      }
    );
  }
  

  onSubmit() {
    if (this.imprintForm.invalid) {
      this.imprintForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const requestData = this.imprintForm.value; // Now sending JSON instead of FormData

    if (this.currentImprintId) {
      this.updateSetting(requestData);
    } else {
      this.createSetting(requestData);
    }
  }

  createSetting(requestData: any): void {
    this.settingService.createImprint(requestData).subscribe(
      response => {
        this.isLoading = false;
        if (response.status) {
          Swal.fire('Success', 'Imprint created successfully', 'success');
          this.getSettings();
        } else {
          Swal.fire('Error', response.message || 'Failed to create imprint', 'error');
        }
      },
      error => {
        this.isLoading = false;
        console.error('Error creating imprint:', error);
        Swal.fire('Error', 'An error occurred while creating the imprint', 'error');
      }
    );
  }

  updateSetting(requestData: any): void {
    if (!this.currentImprintId) return;

    this.settingService.updateImprint(this.currentImprintId, requestData).subscribe(
      response => {
        this.isLoading = false;
        if (response.status) {
          Swal.fire('Success', 'Imprint updated successfully', 'success');
          this.getSettings();
        } else {
          Swal.fire('Error', response.message || 'Failed to update imprint', 'error');
        }
      },
      error => {
        this.isLoading = false;
        console.error('Error updating imprint:', error);
        Swal.fire('Error', 'An error occurred while updating the imprint', 'error');
      }
    );
  }

  editSetting(): void {
    this.isEditMode = true;
  }
}
