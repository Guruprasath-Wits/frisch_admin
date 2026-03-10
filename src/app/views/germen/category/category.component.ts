import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../admin.service';
import Swal from 'sweetalert2';

import { CommonModule } from '@angular/common';

interface Category {
  id?: number; // Optional, but needs handling when used
  category_name: string;
  category_type: string;

  category_desc: string;
  delivery_fee_weekday: number;
  delivery_fee_weekend: number;
  holiday_fee: number;
}

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    TranslateModule
  ]
})
export class CategoryComponent implements OnInit {
  categoryForm: FormGroup;
  categories: Category[] = [];
  currentCategory: Category | null = null;
  isEditMode: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  mainCategories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.categoryForm = this.fb.group({
      category_name: ['', Validators.required],
      category_type: ['', Validators.required],

      category_desc: ['', Validators.required],
      delivery_fee_weekday: [0, Validators.required],
      delivery_fee_weekend: [0, Validators.required],
      holiday_fee: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.getCategories();
    this.getMainCategories();
  }

  getMainCategories(): void {
    this.adminService.getMainCategory().subscribe(
      (response: any) => {
        if (response.status) {
          this.mainCategories = response.category;
        }
      },
      error => {
        console.error('Error fetching main categories:', error);
      }
    );
  }



  getCategories(): void {
    this.adminService.getCategory({}).subscribe(
      (response: any) => {
        if (response.status) {
          console.log('Raw category response:', response.category);
          this.categories = response.category;
          console.log('Processed categories:', this.categories);
          this.totalPages = Math.ceil(this.categories.length / this.itemsPerPage);
        } else {
          console.error('Failed to fetch categories:', response.message);
        }
      },
      error => {
        console.error('Error fetching categories:', error);
      }
    );
  }



  onSubmit(): void {
    if (!this.categoryForm.value.category_name || !this.categoryForm.value.category_type) {
      Swal.fire('Error', 'Fill the required field', 'error')
      return
    }
    const formData = new FormData();
    formData.append('category_name', this.categoryForm.value.category_name);
    formData.append('category_type', this.categoryForm.value.category_type);

    formData.append('category_desc', this.categoryForm.value.category_desc);
    formData.append('delivery_fee_weekday', this.categoryForm.value.delivery_fee_weekday);
    formData.append('delivery_fee_weekend', this.categoryForm.value.delivery_fee_weekend);
    formData.append('holiday_fee', this.categoryForm.value.holiday_fee);

    if (this.isEditMode && this.currentCategory?.id) {

      this.adminService.updateCategory(this.currentCategory.id, formData).subscribe(
        response => {
          Swal.fire('Updated!', 'Sub-Category has been updated.', 'success');
          this.resetForm();
          this.getCategories();
        },
        error => {
          Swal.fire('Error', 'Failed to update sub-category()', 'error');
        }
      );
    } else {

      this.adminService.addCategory(formData).subscribe(
        response => {
          Swal.fire('Added!', 'Sub-Category has been added.', 'success');
          this.resetForm();
          this.getCategories();
        },
        error => {
          Swal.fire('Error', 'Failed to add sub-category', 'error');
        }
      );
    }
  }


  onEdit(category: Category): void {
    this.isEditMode = true;
    this.currentCategory = category;

    this.categoryForm.patchValue({
      category_name: category.category_name,
      category_type: category.category_type,
      category_desc: category.category_desc,
      delivery_fee_weekday: category.delivery_fee_weekday,
      delivery_fee_weekend: category.delivery_fee_weekend,
      holiday_fee: category.holiday_fee
    });
  }



  onDelete(id?: number): void {
    if (id === undefined) {
      console.error('No category ID provided for deletion');
      return; // Exit if id is not defined
    }

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
        this.adminService.removeCategory(id).subscribe(
          response => {
            this.categories = this.categories.filter((f) => f.id !== id);
            Swal.fire('Deleted!', 'Sub-Category has been deleted.', 'success');
            // this.getCategories();
          },
          error => {
            Swal.fire('Error', 'Failed to delete sub-category', 'error');
          }
        );
      }
    });
  }

  resetForm(): void {
    this.categoryForm.reset();
    this.isEditMode = false;
    this.currentCategory = null;
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  get paginatedCategories() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.categories.slice(startIndex, endIndex);
  }

}
