import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-combo-packs',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './combo-packs.component.html',
    styleUrls: ['./combo-packs.component.scss']
})
export class ComboPacksComponent implements OnInit {
    products: any[] = [];
    allProducts: any[] = [];
    productMap: { [key: string]: string } = {};
    searchTerm: string = '';

    constructor(private apiService: AdminService) { }

    ngOnInit() {
        this.fetchAllProducts();
    }

    fetchAllProducts() {
        this.apiService.getProducts().subscribe(
            (response) => {
                this.allProducts = response.product || [];
                this.allProducts.forEach(p => {
                    this.productMap[p.id] = p.product_name;
                });
                this.loadCombos();
            },
            (error) => {
                console.error('Error fetching products:', error);
                // Still load combos even if products fail, just won't have names
                this.loadCombos();
            }
        );
    }

    loadCombos() {
        this.apiService.getCombos().subscribe(
            (response) => {
                this.products = response.combos || [];
            },
            (error) => {
                console.error('Error fetching combos:', error);
            }
        );
    }

    get filteredCombos() {
        if (!this.searchTerm) {
            return this.products;
        }
        const lowerTerm = this.searchTerm.toLowerCase();
        return this.products.filter(combo => {
            const nameMatch = combo.name.toLowerCase().includes(lowerTerm);
            const productMatch = this.getProductNames(combo.product_ids).toLowerCase().includes(lowerTerm);
            return nameMatch || productMatch;
        });
    }

    getProductNames(productIds: any): string {
        if (!productIds) return '';

        let ids: any[] = [];

        if (Array.isArray(productIds)) {
            ids = productIds;
        } else if (typeof productIds === 'string') {
            let content = productIds;
            let parsedSuccess = false;

            // Try to parse recursively up to 5 times
            for (let i = 0; i < 5; i++) {
                try {
                    // If it looks like a stringified array or object, or just a quoted string
                    if (typeof content === 'string') {
                        const parsed = JSON.parse(content);
                        content = parsed;

                        if (Array.isArray(content)) {
                            ids = content;
                            parsedSuccess = true;
                            break;
                        }
                    } else {
                        // If we reached a non-string (e.g. number or object), stop parsing
                        break;
                    }
                } catch (e) {
                    // Parsing failed, stop trying
                    break;
                }
            }

            if (!parsedSuccess) {
                // If we ended up with a string that wasn't an array, check for commas
                if (typeof content === 'string') {
                    if (content.includes(',')) {
                        ids = content.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                    } else if (content.trim() !== '') {
                        ids = [content.trim().replace(/^"|"$/g, '')];
                    }
                } else if (typeof content === 'number') {
                    ids = [content];
                } else if (Array.isArray(content)) {
                    // Should be covered by loop break, but just in case
                    ids = content;
                }
            }
        } else if (typeof productIds === 'number') {
            ids = [productIds];
        }

        if (ids.length === 0) return '';

        return ids.map(id => {
            let lookupId = id;
            // Handle if id is an object
            if (typeof id === 'object' && id !== null) {
                if ('id' in id) lookupId = id.id;
                else if ('product_id' in id) lookupId = id.product_id;
            }

            // Try both number and string lookup
            const name = this.productMap[lookupId] || this.productMap[String(lookupId)] || this.productMap[Number(lookupId)];

            if (!name) {
                // console.warn(`Product ID ${lookupId} not found in map.`);
                return `Unknown (${lookupId})`;
            }

            return name;
        }).join(', ');
    }

    deleteProduct(id: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.apiService.deleteCombo(id).subscribe(
                    (response) => {
                        Swal.fire('Deleted!', 'Combo pack has been deleted.', 'success');
                        this.loadCombos();
                    },
                    (error) => {
                        Swal.fire('Error!', 'Something went wrong.', 'error');
                    }
                );
            }
        });
    }

    toggleStatus(combo: any) {
        const newStatus = combo.status === 1 ? 0 : 1;
        const formData = new FormData();
        formData.append('name', combo.name);
        formData.append('price', combo.price);
        formData.append('description', combo.description || '');
        formData.append('status', newStatus.toString());
        formData.append('product_ids', JSON.stringify(combo.product_ids));
        formData.append('discount_percentage', (combo.discount_percentage || 0).toString());
        // Image is not being updated here, so we don't append it. 
        // The backend handles existing image if not provided.

        this.apiService.updateCombo(combo.id, formData).subscribe(
            (response) => {
                combo.status = newStatus;
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                })

                Toast.fire({
                    icon: 'success',
                    title: 'Status updated successfully'
                })
            },
            (error) => {
                console.error('Error updating status:', error);
                Swal.fire('Error!', 'Failed to update status.', 'error');
                // Revert the checkbox state in UI if needed, 
                // but since we didn't change the model yet (except via ngModel binding which might be tricky with one-way binding),
                // actually we are using (change) and [checked]. 
                // The [checked] binding updates from the model. 
                // If we don't update the model 'combo.status', it might stay at old value or get out of sync.
                // To be safe, we reload combos or manually revert.
                // Since we only update combo.status on success, the UI might be out of sync if we don't handle the checkbox state.
                // However, (change) doesn't automatically update the model if we don't use [(ngModel)].
                // We are using [checked] and (change).
                // So the checkbox visual state changes by user click.
                // If error, we should revert it.
                // For now, let's just reload combos on error to reset state.
                this.loadCombos();
            }
        );
    }
}
