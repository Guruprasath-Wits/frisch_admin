import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from 'src/app/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { url } from 'src/app/config';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-edit-combo',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './edit-combo.component.html',
    styleUrls: ['./edit-combo.component.scss']
})
export class EditComboComponent implements OnInit {
    comboForm: FormGroup;
    products: any[] = [];
    selectedFile: File | null = null;
    comboDropdownOpen = false;
    productId: string = '';
    newurl: any;
    totalValue: number = 0;

    constructor(
        private fb: FormBuilder,
        private apiService: AdminService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.newurl = url;
        this.comboForm = this.fb.group({
            product_name: ['', Validators.required],
            price: [null, Validators.required],
            discount: [0],
            desc: [''],
            status: [true],
            product_img: [null],
            combo_products: [[]],
            product_type: ['combo']
        });
    }

    ngOnInit() {
        this.productId = this.route.snapshot.paramMap.get('id') || '';
        this.loadProducts();

        // Listen for changes in discount to update price
        this.comboForm.get('discount')?.valueChanges.subscribe(val => {
            this.updatePrice();
        });
    }

    loadProducts() {
        this.apiService.getProducts().subscribe(
            (response) => {
                this.products = (response.product || []).filter((p: any) => p.product_type !== 'combo');
                if (this.productId) {
                    this.loadProductData(this.productId);
                }
            },
            (error) => {
                console.error('Error fetching products:', error);
            }
        );
    }

    loadProductData(id: string) {
        this.apiService.getComboById(Number(id)).subscribe(
            (response) => {
                const combo = response.combo;
                this.comboForm.patchValue({
                    product_name: combo.name,
                    price: combo.price,
                    desc: combo.description,
                    status: combo.status === 1,
                    product_img: combo.image,
                    combo_products: combo.product_ids ? (typeof combo.product_ids === 'string' ? JSON.parse(combo.product_ids) : combo.product_ids) : [],
                    discount: combo.discount_percentage || 0
                });

                // Calculate total
                this.calculateTotal(false);
            },
            (error) => {
                console.error('Error loading combo data:', error);
            }
        );
    }

    toggleComboDropdown() {
        this.comboDropdownOpen = !this.comboDropdownOpen;
    }

    onComboProductChange(id: number, event: Event) {
        const selectedProducts = this.comboForm.get('combo_products')?.value || [];
        const input = event.target as HTMLInputElement;

        if (input.checked) {
            selectedProducts.push(id);
        } else {
            const index = selectedProducts.indexOf(id);
            if (index > -1) {
                selectedProducts.splice(index, 1);
            }
        }
        this.comboForm.get('combo_products')?.setValue(selectedProducts);
        this.calculateTotal(true);
    }

    calculateTotal(updatePrice: boolean = true) {
        const selectedIds = this.comboForm.get('combo_products')?.value || [];
        this.totalValue = this.products
            .filter(p => selectedIds.includes(p.id))
            .reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

        if (updatePrice) {
            this.updatePrice();
        }
    }

    updatePrice() {
        const discount = this.comboForm.get('discount')?.value || 0;
        if (this.totalValue > 0) {
            const discountedPrice = this.totalValue - (this.totalValue * (discount / 100));
            this.comboForm.patchValue({ price: parseFloat(discountedPrice.toFixed(2)) }, { emitEvent: false });
        }
    }

    isComboProductSelected(id: number): boolean {
        const selectedProducts = this.comboForm.get('combo_products')?.value || [];
        return selectedProducts.includes(id);
    }

    getSelectedComboProductNames(): string {
        const selectedIds = this.comboForm.get('combo_products')?.value || [];
        if (selectedIds.length === 0) return 'Select Products';

        const names = this.products
            .filter(p => selectedIds.includes(p.id))
            .map(p => p.product_name);

        if (names.length <= 2) {
            return names.join(', ');
        } else {
            return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
        }
    }

    onFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length) {
            this.selectedFile = input.files[0];
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.comboForm.patchValue({ product_img: e.target.result });
            };
            reader.readAsDataURL(this.selectedFile);
        }
    }

    removeImage() {
        this.selectedFile = null;
        this.comboForm.patchValue({ product_img: null });
    }

    getImageUrl(imagePath: string): string {
        const baseUrl = this.newurl;
        return imagePath && imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;
    }

    onSubmit() {
        if (this.comboForm.valid) {
            const formData = new FormData();
            formData.append('name', this.comboForm.get('product_name')?.value);
            formData.append('price', this.comboForm.get('price')?.value);
            formData.append('description', this.comboForm.get('desc')?.value);
            formData.append('status', '1');
            formData.append('product_ids', JSON.stringify(this.comboForm.get('combo_products')?.value));
            formData.append('discount_percentage', this.comboForm.get('discount')?.value || 0);

            if (this.selectedFile) {
                formData.append('image', this.selectedFile);
            } else if (this.comboForm.get('product_img')?.value) {
                formData.append('image', this.comboForm.get('product_img')?.value);
            } else {
                formData.append('image', '');
            }

            this.apiService.updateCombo(Number(this.productId), formData).subscribe(
                (response) => {
                    Swal.fire('Updated!', 'Combo Pack has been updated.', 'success');
                    this.router.navigate(['/combo-packs']);
                },
                (error) => {
                    Swal.fire('Error!', 'Something went wrong.', 'error');
                    console.error('Error updating combo:', error);
                }
            );
        } else {
            this.comboForm.markAllAsTouched();
        }
    }
}
