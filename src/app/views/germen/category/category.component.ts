import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { file_url } from 'src/app/config';
import { CommonModule } from '@angular/common';

interface Category {
  id?: number; // Optional, but needs handling when used
  category_name: string;
  category_type: string;

  category_desc: string;
  category_img?: string;
}

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ]
})
export class CategoryComponent implements OnInit {
  categoryForm: FormGroup;
  categories: Category[] = [];
  imagePreview: string | null = null;
  currentCategory: Category | null = null;
  isEditMode: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  file = file_url

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.categoryForm = this.fb.group({
      category_name: ['', Validators.required],
      category_type: ['', Validators.required],

      category_desc: ['', Validators.required],
      image_file: [null]
    });
  }

  ngOnInit(): void {
    this.getCategories();
  }

  removeImage(): void {
    this.categoryForm.patchValue({ image_file: null });
    this.imagePreview = null;
  }

  getCategories(): void {
    this.adminService.getCategory({}).subscribe(
      (response: any) => {
        if (response.status) {
          this.categories = response.category.map((cat: any) => ({
            ...cat,
            category_img: `${cat.category_img}`
          }));
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

  // onFileChange(event: any): void {
  //   if (event.target.files.length > 0) {
  //     const file = event.target.files[0];
  //     this.categoryForm.patchValue({ image_file: file });
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       this.imagePreview = reader.result as string;
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type! Please upload a JPG, PNG, or JPEG image.');
        return;
      }

      this.categoryForm.patchValue({ image_file: file });

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if(!this.categoryForm.value.category_name || !this.categoryForm.value.category_type){
      Swal.fire('Error','Fill the required field', 'error')
      return
    }
    const formData = new FormData();
    formData.append('category_name', this.categoryForm.value.category_name);
    formData.append('category_type', this.categoryForm.value.category_type);

    formData.append('category_desc', this.categoryForm.value.category_desc);

    // Append image if it's a new file, else retain existing image
    if (this.categoryForm.value.image_file) {
      formData.append('category_img', this.categoryForm.value.image_file);
    } else if (this.currentCategory?.category_img) {
      formData.append('category_img', this.currentCategory.category_img); // Ensure backend can handle this
    }

    if (this.isEditMode && this.currentCategory?.id) {
      
      this.adminService.updateCategory(this.currentCategory.id, formData).subscribe(
        response => {
          Swal.fire('Updated!', 'Category has been updated.', 'success');
          this.resetForm();
          this.getCategories();
        },
        error => {
          Swal.fire('Error', 'Failed to update category()', 'error');
        }
      );
    } else {
      
      this.adminService.addCategory(formData).subscribe(
        response => {
          Swal.fire('Added!', 'Category has been added.', 'success');
          this.resetForm();
          this.getCategories();
        },
        error => {
          Swal.fire('Error', 'Failed to add category', 'error');
        }
      );
    }
  }
  

  onEdit(category: Category): void {
    this.isEditMode = true;
    this.currentCategory = category;
  
    // Extract the relative path for the category image
    const imagePath = category.category_img?.replace(/^http:\/\/[^\/]+\/uploads\//, 'uploads/') || null;
  
    this.categoryForm.patchValue({
      category_name: category.category_name,
      category_type: category.category_type,
      category_desc: category.category_desc,
      image_file: null // Reset the file input field
    });
  
    this.imagePreview = imagePath; // Use the relative path for the preview
  
    // Listen for new file uploads and update the preview dynamically
    this.categoryForm.get('image_file')?.valueChanges.subscribe((file: File | null) => {
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string; // Update preview with new file
        };
        reader.readAsDataURL(file);
      } else {
        this.imagePreview = imagePath; // Retain relative path if no new image is uploaded
      }
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
            Swal.fire('Deleted!', 'Category has been deleted.', 'success');
            // this.getCategories();
          },
          error => {
            Swal.fire('Error', 'Failed to delete category', 'error');
          }
        );
      }
    });
  }

  resetForm(): void {
    this.categoryForm.reset();
    this.isEditMode = false;
    this.imagePreview = null;
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
