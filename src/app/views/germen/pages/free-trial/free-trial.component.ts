import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../../admin.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';

// interface SampleOrder {
//   id: number;
//   product_id: number;
//   product_name: string;
//   sample_order_description: string;
//   description: string;
// }
interface SampleOrder {
  id: number;
  desc: string;
  description: string;
  sample_order_description: string;
  products?: { id: number; name: string }[];  // Multi-product array
}

interface Product {
  id: number;
  name: string;
}

@Component({
  selector: 'app-free-trial',
  templateUrl: './free-trial.component.html',
  styleUrls: ['./free-trial.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class FreeTrialComponent implements OnInit {
  sample_orderForm: FormGroup;
  products: Product[] = [];
  sampleOrders: SampleOrder[] = [];
  isEditMode: boolean = false;
  selectedSampleOrder: SampleOrder | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  selectedFile: File | null = null;


  constructor(private fb: FormBuilder, private adminService: AdminService, private cdRef: ChangeDetectorRef) {
    this.sample_orderForm = this.fb.group({
      sample_order_product: ['', Validators.required],
      sample_order_description: [''],
      description: [''],
      product_img: ['']
    });
  }

  ngOnInit(): void {
    this.getProducts();
    this.getSampleOrders();
  }

  getProducts(): void {
    this.adminService.getProducts().subscribe(
      (response) => {
        if (response.status) {
          this.products = response.product.map((product: any) => ({
            id: product.id,
            name: product.product_name,
          }));
        } else {
          console.error('Failed to fetch products:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching products:', error);
      }
    );
  }
  isProductSelected(productId: number): boolean {
    const selectedProducts = this.sample_orderForm.get('sample_order_product')?.value || [];

    // If stored as array of product IDs
    if (selectedProducts.length && typeof selectedProducts[0] === 'number') {
      return selectedProducts.includes(productId);
    }

    // If stored as array of product objects { id, name }
    if (selectedProducts.length && typeof selectedProducts[0] === 'object') {
      return selectedProducts.some((p: any) => p.id === productId);
    }

    return false;
  }




  getSampleOrders(): void {
    this.adminService.getSampleOrders().subscribe(
      (response) => {
        if (response.status) {

          // Directly assign products from API response
          this.sampleOrders = response.sampleOrder.map((order: any) => ({
            id: order.id,
            desc: order.desc,
            description: order.description,
            products: order.products || [], // Array of products {id, name}
            sample_order_description: order.desc, // Keep for display if needed
          }));

          this.calculateTotalPages();
        } else {
          console.error('Failed to fetch sample orders:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching sample orders:', error);
      }
    );
  }


  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.sampleOrders.length / this.itemsPerPage);
  }



  // onSubmit(): void {
  //   if (this.sample_orderForm.valid) {
  //     const formValue = this.sample_orderForm.value;


  //     const sampleOrderData: { product_id: number; desc: string; id?: number , description: string;} = {
  //       product_id: formValue.sample_order_product,
  //       desc: formValue.sample_order_description,
  //       description: formValue.description
  //     };

  //     if (this.isEditMode && this.selectedSampleOrder) {

  //       sampleOrderData.id = this.selectedSampleOrder.id;

  //       this.adminService.updateSampleOrder(sampleOrderData).subscribe(
  //         (response) => {
  //           if (response.status) {
  //              Swal.fire({
  //               icon: 'success',
  //               title: 'Success',
  //               text: 'Edited Successfully'
  //             });
  //             this.getSampleOrders();
  //             this.resetForm();
  //             this.calculateTotalPages();
  //           } else {
  //             Swal.fire('error',"Something went Wrong");
  //           }
  //         },
  //         (error) => {
  //           Swal.fire('error',"Something went Wrong");
  //           console.error('Error updating sample order:', error);
  //         }
  //       );
  //     } else {
  //       this.adminService.createSampleOrder(sampleOrderData).subscribe(
  //         (response) => {
  //           if (response.status) {
  //              Swal.fire({
  //               icon: 'success',
  //               title: 'Success',
  //               text: 'Added Successfully'
  //             });

  //             this.getSampleOrders();
  //             this.resetForm();
  //             this.calculateTotalPages();
  //           } else {
  //             Swal.fire('error',"Something went Wrong");

  //             console.error('Failed to create sample order:', response.message);
  //           }
  //         },
  //         (error) => {
  //           Swal.fire('error',"Something went Wrong");

  //           console.error('Error creating sample order:', error);
  //         }
  //       );
  //     }
  //   }
  //   else{
  //     Swal.fire({
  //       title:"Error",
  //       text:"All flieds are required"
  //     })
  //   }
  // }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];

      // Show image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.sample_orderForm.patchValue({ product_img: e.target.result });
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
  removeImage() {
    this.selectedFile = null;
    this.sample_orderForm.patchValue({ product_img: null });
  }
  uploadProductImage(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('product_img', this.selectedFile);

      this.adminService.uploadProductImage(formData).subscribe({
        next: (response) => {
          if (response.status && response.filePath) {
            this.sample_orderForm.patchValue({ product_img: response.filePath });
            Swal.fire('success', 'Image uploaded successfully');
          } else {
            Swal.fire('error', 'Failed to upload image');
          }
        },
        error: () => Swal.fire('error', 'Something went wrong while uploading image')
      });
    } else {
      Swal.fire('info', 'Please select an image first');
    }
  }

  onSubmit(): void {
    if (this.sample_orderForm.valid) {

      const formValue = this.sample_orderForm.value;

      if (!formValue.product_img) {
        Swal.fire('warning', 'Please upload product image before submitting');
        return;
      }

      const selectedProducts = (formValue.sample_order_product || []).map((p: any) => {
        if (typeof p === 'number') {
          const product = this.products.find(prod => prod.id === p);
          return { id: p, name: product ? product.name : '' };
        }
        return { id: p.id, name: p.name };
      });

      const sampleOrderData = {
        products: selectedProducts,
        desc: formValue.sample_order_description,
        description: formValue.description,
        product_img: formValue.product_img,
        id: this.isEditMode && this.selectedSampleOrder ? this.selectedSampleOrder.id : undefined
      };

      console.log("Submitting payload:", sampleOrderData);

      if (this.isEditMode && this.selectedSampleOrder) {
        this.adminService.updateSampleOrder(sampleOrderData).subscribe({
          next: (response) => {
            if (response.status) {
              Swal.fire('success', "Edited Successfully");
              this.getSampleOrders();
              this.resetForm();
              this.calculateTotalPages();
            } else {
              Swal.fire('error', "Something went wrong");
            }
          },
          error: () => Swal.fire('error', "Something went wrong")
        });
      } else {
        this.adminService.createSampleOrder(sampleOrderData).subscribe({
          next: (response) => {
            if (response.status) {
              Swal.fire('success', "Added Successfully");
              this.getSampleOrders();
              this.resetForm();
              this.calculateTotalPages();
            } else {
              Swal.fire('error', "Something went wrong");
            }
          },
          error: () => Swal.fire('error', "Something went wrong")
        });
      }

    } else {
      Swal.fire({
        icon: 'error',
        title: "Error",
        text: "All fields are required"
      });
    }
  }


  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onProductChange(productId: number, event: Event): void {
    const selectedIds: number[] = this.sample_orderForm.get('sample_order_product')?.value || [];
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.sample_orderForm.patchValue({
        sample_order_product: [...selectedIds, productId]
      });
    } else {
      this.sample_orderForm.patchValue({
        sample_order_product: selectedIds.filter((id: number) => id !== productId)
      });
    }
  }



  // onProductChange(id: number, event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   const control = this.sample_orderForm.get('sample_order_product');
  //   const selectedProducts = control?.value || [];

  //   if (input.checked) {
  //     selectedProducts.push(id);
  //   } else {
  //     const index = selectedProducts.indexOf(id);
  //     if (index > -1) {
  //       selectedProducts.splice(index, 1);
  //     }
  //   }

  //   control?.setValue(selectedProducts);
  // }
  dropdownOpen = false;




  // getSelectedProductNames(): string {
  //   const selectedIds = this.sample_orderForm.get('sample_order_product')?.value || [];
  //   const selectedNames = this.products
  //     .filter(p => selectedIds.includes(p.id))
  //     .map(p => p.name);
  //   return selectedNames.join(', ');
  // }

  onEdit(sampleOrder: SampleOrder): void {
    this.isEditMode = true;
    this.selectedSampleOrder = sampleOrder;

    this.sample_orderForm.patchValue({
      sample_order_product: sampleOrder.products?.map(p => p.id) || [],
      sample_order_description: sampleOrder.desc,
      description: sampleOrder.description
    });

    this.cdRef.detectChanges();
  }

  getSelectedProductNames(): string {
    const selectedProductIds = this.sample_orderForm.get('sample_order_product')?.value || [];

    if (!selectedProductIds.length) {
      return '';
    }

    const selectedNames = this.products
      .filter(p => selectedProductIds.includes(p.id))
      .map(p => p.name);

    return selectedNames.join(', ');
  }






  // onEdit(sampleOrder: SampleOrder): void {
  //   this.isEditMode = true;
  //   this.selectedSampleOrder = sampleOrder;
  //   this.sample_orderForm.patchValue({
  //     sample_order_product: sampleOrder.product_id,
  //     sample_order_description: sampleOrder.sample_order_description,
  //     description : sampleOrder.description
  //   });
  // }

  onDelete(sampleOrderId: number): void {
    if (sampleOrderId === undefined) {
      console.error('No SampleOrder ID provided for deletion');
      return;

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
        this.adminService.deleteSampleOrder(sampleOrderId).subscribe(
          response => {
            this.sampleOrders = this.sampleOrders.filter((f) => f.id !== sampleOrderId);
            Swal.fire('Deleted!', 'SampleOrder Product has been deleted.', 'success');
            this.calculateTotalPages();
            // this.getSampleOrders();
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
    this.selectedSampleOrder = null;
    this.sample_orderForm.reset();
  }

  formatDescription(description: string): string {
    return description.replace(/\n/g, '<br>');
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }



  get paginatedCategories(): SampleOrder[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    // const endIndex = startIndex + this.itemsPerPage;
    return this.sampleOrders.slice(startIndex, startIndex + this.itemsPerPage);
  }
}