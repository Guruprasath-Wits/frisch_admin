import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../admin.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Fix NG8004 (date pipe, *ngIf, *ngFor)
import { FormsModule } from '@angular/forms'; // Fix NG8002 (ngModel)
import { NgxPaginationModule } from 'ngx-pagination'; // Fix paginate pipe

@Component({
    selector: 'app-missing-products',
    standalone: true, // Make it standalone
    imports: [CommonModule, FormsModule, NgxPaginationModule], // Import required modules
    templateUrl: './missing-products.component.html',
    styleUrls: ['./missing-products.component.css']
})
export class MissingProductsComponent implements OnInit {
    missingProducts: any[] = [];
    filteredProducts: any[] = [];
    searchTerm: string = '';
    page: number = 1;
    itemsPerPage: number = 10;
    totalPages: number = 0;
    selectedProduct: any = null;
    showPopup: boolean = false;
    selectedDate: string = '';
    selectedStatus: string = 'All';

    constructor(private service: AdminService, private router: Router) { }

    ngOnInit(): void {
        this.getMissingProducts();
    }

    getMissingProducts() {
        this.service.getMissingProducts().subscribe(
            (res) => {
                if (res.status && res.data) {
                    this.missingProducts = res.data;
                    this.filterProducts();
                }
            },
            (error) => {
                console.error('Error fetching missing products', error);
            }
        );
    }

    filterProducts() {
        let filtered = this.missingProducts;

        if (this.searchTerm) {
            filtered = filtered.filter(product =>
                (product.first_name + ' ' + product.last_name).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                product.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                product.mobile_number.includes(this.searchTerm)
            );
        }

        if (this.selectedDate) {
            filtered = filtered.filter(product => {
                if (!product.created_at) return false;
                const productDate = new Date(product.created_at).toISOString().split('T')[0];
                return productDate === this.selectedDate;
            });
        }

        if (this.selectedStatus === 'Read') {
            filtered = filtered.filter(product => product.is_read == 1);
        } else if (this.selectedStatus === 'Un-Read') {
            filtered = filtered.filter(product => product.is_read != 1);
        }
        // If 'All', do nothing (show all)

        this.filteredProducts = filtered;

        // Re-sort
        this.filteredProducts.sort((a, b) => {
            if (a.is_read === b.is_read) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return a.is_read - b.is_read;
        });

        this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        this.page = 1;
    }

    onSearchChange() {
        this.filterProducts();
    }

    previousPage() {
        if (this.page > 1) {
            this.page--;
        }
    }

    nextPage() {
        if (this.page < this.totalPages) {
            this.page++;
        }
    }

    openDetails(product: any) {
        this.selectedProduct = product;
        this.showPopup = true;
    }

    closePopup() {
        this.showPopup = false;
        this.selectedProduct = null;
    }

    markAsRead() {
        if (this.selectedProduct) {
            this.service.markMissingProductAsRead(this.selectedProduct.id).subscribe(
                (res) => {
                    if (res) { // Backend returns { id: ..., is_read: 1 }, so just checking res is sufficient
                        // Actually controller sends `data` directly which is { id: ..., is_read: 1 }
                        // Let's rely on selectedProduct.id

                        // Update local state
                        // Use string comparison or loose equality to handle type mismatch
                        const product = this.missingProducts.find(p => p.id == this.selectedProduct.id);
                        if (product) {
                            product.is_read = 1;
                        }

                        // Re-sort and filter
                        this.missingProducts.sort((a, b) => {
                            if (a.is_read === b.is_read) {
                                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                            }
                            return a.is_read - b.is_read;
                        });

                        this.filterProducts();
                        this.closePopup();
                    }
                },
                (error) => {
                    console.error('Error marking as read', error);
                }
            );
        }
    }
}
