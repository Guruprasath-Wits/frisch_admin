import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../../admin.service';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-addproduct',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './addproduct.component.html',
  styleUrls: ['./addproduct.component.scss'],
})
export class AddproductComponent {
  productForm: FormGroup;
  productId: string;
  categories: any[] = []; // Store categories fetched from API
  taxes: any[] = [];
  bottles: any[] = [];
  selectedFile: File | null = null; // Store selected file for image upload

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private apiService: AdminService,
    private router: Router
  ) {
    // Initialize the form with fields and validators
    this.productForm = this.fb.group({
      product_name: ['', Validators.required],
      nick_name: [''],
      product_status: [''],
      category_id: ['', Validators.required],
      desc: [''],
      price: [null],
      weight: [null],
      ingredients: [''],
      nutri_inform: [''],
      status: [false],
      product_img: [null],
      availability: [[]], // Array for selected days
      pfand: ['0.00'],
      tax: ['0.00']
    });


    this.productId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    this.loadCategories(); // Load categories from API
    this.loadTaxes();
    this.loadBottles();
    if (this.productId) {
      this.loadProductData(this.productId); // Load product data if editing
    }
  }

  // Load product categories for the dropdown
  loadCategories() {
    this.apiService.getCategory({}).subscribe(
      (response: any) => {
        this.categories = response.category;
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  loadTaxes() {
    this.apiService.getTaxes().subscribe(
      (response: any) => {
        this.taxes = response.tax;
      },
      (error: any) => {
        console.error('Error fetching taxes:', error);
      }
    );
  }

  loadBottles() {
    this.apiService.getBottles().subscribe(
      (response: any) => {
        this.bottles = response.bottle;
      },
      (error: any) => {
        console.error('Error fetching bottles:', error);
      }
    );
  }

  // Load product data to populate form fields
  loadProductData(id: string) {
    this.apiService.getProductById(id).subscribe(
      (response: any) => {
        const product = response.product;
        this.productForm.patchValue({
          product_name: product.product_name,
          nick_name: product.nick_name,
          product_status: product.product_status,
          category_id: product.category_id,
          desc: product.desc || '',
          price: product.price,
          weight: product.weight,
          ingredients: product.ingredients,
          nutri_inform: product.nutri_inform || '',
          status: product.status === 1, // Set to true if product is active
          product_img: product.product_img,
          availability: product.availability ? JSON.parse(product.availability) : [],
          pfand: product.pfand,
          tax: product.tax
        });
      },
      (error: any) => {
        console.error('Error loading product data:', error);
      }
    );
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



  onCategoryChange(id: number, event: Event) {
    const selectedCategories = this.productForm.get('category_id')?.value || [];
    const input = event.target as HTMLInputElement;

    if (input.checked) {
      selectedCategories.push(id);
    } else {
      const index = selectedCategories.indexOf(id);
      if (index > -1) {
        selectedCategories.splice(index, 1);
      }
    }

    this.productForm.get('category_id')?.setValue(selectedCategories);
  }

  isCategorySelected(id: number): boolean {
    return this.productForm.get('category_id')?.value.includes(id);
  }

  getSelectedCategoryNames(): string {
    const selectedIds = this.productForm.get('category_id')?.value || [];
    return this.categories
      .filter(cat => selectedIds.includes(cat.id))
      .map(cat => cat.category_name)
      .join(', ');
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
    return currentDays.includes(day);
  }



  // Function to remove the image
  removeImage() {
    this.selectedFile = null;
    this.productForm.patchValue({ product_img: null });
  }



  // Submit the form data to update product
  onSubmit() {
    if (this.productForm.valid) {
      // Formulate FormData for submission
      const formData = new FormData();
      formData.append('product_name', this.productForm.get('product_name')?.value);
      formData.append('nick_name', this.productForm.get('nick_name')?.value);
      formData.append('product_status', this.productForm.get('product_status')?.value);
      formData.append('category_id', this.productForm.get('category_id')?.value);
      formData.append('desc', this.productForm.get('desc')?.value);
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
      }


      this.apiService.createProduct(formData).subscribe(
        (response: any) => {
          console.log('Product Created successfully:', response);
          Swal.fire('Added!', 'Product has been added.', 'success');
          this.router.navigate(['/products'])
        },
        (error: any) => {
          Swal.fire('ErrorX', 'Something Went Wrong.', 'error');
          console.error('Error updating product:', error);
        }
      );
    } else {

      this.productForm.markAllAsTouched();
    }
  }
}
