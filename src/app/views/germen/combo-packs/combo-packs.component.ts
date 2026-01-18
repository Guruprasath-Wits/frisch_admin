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
    productMap: { [key: number]: string } = {};
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

        let ids: number[] = [];
        if (Array.isArray(productIds)) {
            ids = productIds;
        } else if (typeof productIds === 'string') {
            try {
                ids = JSON.parse(productIds);
            } catch (e) {
                return '';
            }
        }

        return ids.map(id => this.productMap[id] || 'Unknown').join(', ');
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
}
