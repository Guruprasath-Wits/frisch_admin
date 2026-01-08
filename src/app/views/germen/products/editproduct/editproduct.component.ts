import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from 'src/app/admin.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { url } from 'src/app/config';

@Component({
  selector: 'app-editproduct',
  templateUrl: './editproduct.component.html',
  styleUrls: ['./editproduct.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class EditproductComponent implements OnInit {
  productForm: FormGroup;
  productId: string;
  categories: any[] = [];
  selectedFile: File | null = null;
  imagePreview: string | null = null; // For previewing selected or existing image
  oldImage: string = ''; // Store old image path
  newurl: any
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private apiService: AdminService,
    private router: Router
  ) {
    this.newurl = url
    this.productForm = this.fb.group({
      product_name: ['', Validators.required],
      nick_name: [''],
      product_status: [''],
      category_id: ['', Validators.required],
      description: [''],
      price: [null, Validators.min(0)],
      weight: [null, Validators.min(0)],
      ingredients: [''],
      nutri_inform: [''],
      status: [false],
      product_img: [''], // Store image path or base64
      availability: [[]],
      pfand: ['0.00'],
      tax: ['0.00']
    });

    this.productId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    this.loadCategories();
    if (this.productId) {
      this.loadProductData(this.productId);
    }
  }

  // Load product categories
  loadCategories() {
    this.apiService.getCategory({}).subscribe(
      (response) => {
        this.categories = response.category || [];
      },
      (error) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  // Load product data for editing
  loadProductData(id: string) {
    this.apiService.getProductById(id).subscribe(
      (response) => {
        const product = response.product;
        console.log('Product Data:', product); // Debugging

        this.productForm.patchValue({
          product_name: product.product_name,
          nick_name: product.nickname,
          product_status: product.product_status,
          category_id: Array.isArray(product.category_id)
            ? product.category_id
            : String(product.category_id).split(',').map(id => Number(id)),
          description: product.desc || '',
          price: product.price,
          weight: product.weight,
          ingredients: product.ingredients,
          nutri_inform: product.nutri_inform || '',
          status: product.status === 1,
          product_img: product.product_img, // Store existing image path
          availability: product.availability ? JSON.parse(product.availability) : [],
          pfand: product.pfand || '0.00',
          tax: product.tax || '0.00'
        });

        // Store old image
        this.oldImage = product.product_img;

        // Set preview image if available
        if (product.product_img) {
          this.imagePreview = this.getImageUrl(product.product_img);
          console.log(this.imagePreview)
        }
      },
      (error) => {
        console.error('Error loading product data:', error);
      }
    );
  }

  onCategoryChange(id: number, event: Event) {
    const input = event.target as HTMLInputElement;
    let selectedCategories = this.productForm.get('category_id')?.value || [];

    if (!Array.isArray(selectedCategories)) {
      selectedCategories = [];
    }

    if (input.checked) {
      if (!selectedCategories.includes(id)) {
        selectedCategories.push(id);
      }
    } else {
      selectedCategories = selectedCategories.filter((catId: any) => catId !== id);
    }

    this.productForm.get('category_id')?.setValue(selectedCategories);
  }



  isCategorySelected(id: number): boolean {
    const value = this.productForm.get('category_id')?.value;
    return Array.isArray(value) && value.includes(id);
  }


  getSelectedCategoryNames(): string {
    let selectedIds = this.productForm.get('category_id')?.value;

    // Ensure selectedIds is always an array
    if (!Array.isArray(selectedIds)) {
      selectedIds = selectedIds != null ? [selectedIds] : [];
    }

    return this.categories
      .filter(cat => selectedIds.includes(cat.id))
      .map(cat => cat.category_name)
      .join(', ');
  }




  // Remove selected image
  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.productForm.patchValue({ product_img: null });

    console.log('After removing image:', this.productForm.value);
  }

  daysList = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  onDayChange(day: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const currentDays = this.productForm.get('availability')?.value || [];

    if (input.checked) {
      if (!currentDays.includes(day)) {
        currentDays.push(day);
      }
    } else {
      const index = currentDays.indexOf(day);
      if (index > -1) {
        currentDays.splice(index, 1);
      }
    }

    this.productForm.patchValue({ availability: currentDays });
  }

  isDaySelected(day: string): boolean {
    const currentDays = this.productForm.get('availability')?.value || [];
    return Array.isArray(currentDays) && currentDays.includes(day);
  }



  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];

      // Show image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productForm.patchValue({ product_img: e.target.result });
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  categoryDropdownOpen = false;

  toggleCategoryDropdown() {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }



  // Helper function to construct full image URL
  getImageUrl(imagePath: string): string {
    // const baseUrl = 'http://localhost:4001';
    const baseUrl = this.newurl;
    return imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;
  }

  // Submit the form data
  onSubmit() {
    if (this.productForm.valid) {
      const formData = new FormData();
      formData.append('product_name', this.productForm.get('product_name')?.value);
      formData.append('nick_name', this.productForm.get('nick_name')?.value);
      formData.append('product_status', this.productForm.get('product_status')?.value);
      formData.append('category_id', this.productForm.get('category_id')?.value.join(','));
      formData.append('desc', this.productForm.get('description')?.value);
      formData.append('price', this.productForm.get('price')?.value);
      formData.append('weight', this.productForm.get('weight')?.value);
      formData.append('ingredients', this.productForm.get('ingredients')?.value);
      formData.append('nutri_inform', this.productForm.get('nutri_inform')?.value);
      formData.append('status', this.productForm.get('status')?.value ? '1' : '0');
      formData.append('availability', JSON.stringify(this.productForm.get('availability')?.value));
      formData.append('pfand', this.productForm.get('pfand')?.value);
      formData.append('tax', this.productForm.get('tax')?.value);

      if (this.selectedFile) {
        formData.append('product_img', this.selectedFile);
      } else if (this.productForm.get('product_img')?.value) {
        formData.append('product_img', this.productForm.get('product_img')?.value);
      } else {
        formData.append('product_img', '');
      }


      console.log('Submitting FormData:', formData);

      // Call API to update product
      this.apiService.updateProduct(this.productId, formData).subscribe(
        (response) => {
          console.log('Product updated successfully:', response);
          Swal.fire('Success!', 'Product has been updated.', 'success');
          this.router.navigate(['/products']);
        },
        (error) => {
          console.error('Error updating product:', error);
          Swal.fire('Error!', 'Something went wrong.', 'error');
        }
      );
    } else {
      this.productForm.markAllAsTouched();
    }
  }

}
