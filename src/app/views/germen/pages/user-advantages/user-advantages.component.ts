import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';

interface Advantages {
  id: number;
  adv_qns: string;
  adv_ans: string;
}

@Component({
  selector: 'app-user-advantages',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-advantages.component.html',
  styleUrls: ['./user-advantages.component.scss']
})
export class UserAdvantagesComponent implements OnInit {

  userAdv: Advantages[] = [];
  advantagesForm: FormGroup;
  isEditMode: boolean = false;
  selectedAdvantages: Advantages | null = null;
  page: number = 1; 
  itemsPerPage: number = 5;
  totalPages: number = 1;

  constructor(private fb: FormBuilder, private adminService: AdminService) {
    this.advantagesForm = this.fb.group({
      adv_qns: ['', Validators.required],
      adv_ans: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getAdvantages();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.userAdv.length / this.itemsPerPage);
  }

  getAdvantages(): void {
    this.adminService.getAdvantages().subscribe(
      (response) => {
        if (response.status) {
          this.userAdv = response.userAdv.map((adv: any) => ({
            id: adv.id,
            adv_qns: adv.adv_qns,
            adv_ans: adv.adv_ans,
          }));
          this.calculateTotalPages();
        } else {
          console.error('Failed to fetch advantages:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching advantages:', error);
      }
    );
  }

  onSubmit(): void {
    if (this.advantagesForm.valid) {
      const formValue = this.advantagesForm.value;
      const advantagesData: Partial<Advantages> = {
        adv_qns: formValue.adv_qns,
        adv_ans: formValue.adv_ans
      };

      if (this.isEditMode && this.selectedAdvantages) {
        advantagesData.id = this.selectedAdvantages.id;
        this.adminService.updateAdvantages(advantagesData as Advantages).subscribe(
          (response) => {
            if (response.status) {
              this.getAdvantages();
              this.resetForm();
              Swal.fire('Success', 'Advantages updated successfully', 'success');
            } else {
              console.error('Failed to update advantages:', response.message);
            }
          },
          (error) => {
            console.error('Error updating advantages:', error);
          }
        );
      } else {
        this.adminService.createAdvantages(advantagesData).subscribe(
          (response) => {
            if (response.status) {
              this.getAdvantages();
              this.resetForm();
              Swal.fire('Success', 'Advantages added successfully', 'success');
            } else {
              console.error('Failed to add advantages:', response.message);
            }
          },
          (error) => {
            console.error('Error adding advantages:', error);
          }
        );
      }
    } else {
      Swal.fire('Error', 'All fields are required', 'error');
    }
  }

  onEdit(advantages: Advantages): void {
    this.isEditMode = true;
    this.selectedAdvantages = advantages;
    this.advantagesForm.patchValue({
      adv_qns: advantages.adv_qns,
      adv_ans: advantages.adv_ans,
    });
  }

  onDelete(advantagesId: number): void {
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
        this.adminService.deleteAdvantages(advantagesId).subscribe(
          response => {
            this.userAdv = this.userAdv.filter(area => area.id !== advantagesId); 
            Swal.fire('Deleted!', 'SampleOrder Product has been deleted.', 'success');
            // this.getAdvantages();
          },
          error => {
            Swal.fire('Error', 'Failed to delete SampleOrder Product', 'error');
          }
        );
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedAdvantages = null;
    this.advantagesForm.reset();
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

  get paginatedUserAdv(): Advantages[] {
    const start = (this.page - 1) * this.itemsPerPage;
    return this.userAdv.slice(start, start + this.itemsPerPage);
  }
}
