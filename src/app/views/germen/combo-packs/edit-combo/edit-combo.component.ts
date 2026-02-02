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
    taxes: any[] = [];
    bottles: any[] = [];
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
            product_type: ['combo'],
            nutritional_info: [''],
            ingredients: [''],
            availability: [[]],
            vat: [0],
            pfand: [0],
            nickname: ['']
        });
    }

    daysList = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    onDayChange(day: string, event: Event) {
        const input = event.target as HTMLInputElement;
        const currentDays = this.comboForm.get('availability')?.value || [];

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

        this.comboForm.patchValue({ availability: currentDays });
    }

    isDaySelected(day: string): boolean {
        const currentDays = this.comboForm.get('availability')?.value || [];
        return currentDays.includes(day);
    }

    ngOnInit() {
        this.productId = this.route.snapshot.paramMap.get('id') || '';
        this.loadProducts();
        this.loadTaxes();
        this.loadBottles();

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



    loadTaxes() {
        this.apiService.getTaxes().subscribe(
            (response) => {
                this.taxes = response.tax;
            },
            (error) => {
                console.error('Error fetching taxes:', error);
            }
        );
    }

    loadBottles() {
        this.apiService.getBottles().subscribe(
            (response) => {
                this.bottles = response.bottle;
            },
            (error) => {
                console.error('Error fetching bottles:', error);
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
                    discount: combo.discount_percentage || 0,
                    nutritional_info: combo.nutritional_info || '',
                    ingredients: combo.ingredients || '',
                    availability: combo.availability ? JSON.parse(combo.availability) : [],
                    vat: combo.vat || 0,
                    pfand: combo.pfand || 0,
                    nickname: combo.nickname || ''
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
        if (!imagePath) return '';
        if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
            return imagePath;
        }
        return `${baseUrl}${imagePath}`;
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
            formData.append('nutritional_info', this.comboForm.get('nutritional_info')?.value);
            formData.append('ingredients', this.comboForm.get('ingredients')?.value);
            formData.append('availability', JSON.stringify(this.comboForm.get('availability')?.value));
            formData.append('vat', this.comboForm.get('vat')?.value || 0);
            formData.append('pfand', this.comboForm.get('pfand')?.value || 0);
            formData.append('nickname', this.comboForm.get('nickname')?.value);

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
