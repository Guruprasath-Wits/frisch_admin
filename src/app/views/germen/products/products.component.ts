import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/admin.service';
import { url } from 'src/app/config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  products: any[] = []; 
  searchTerm: string = '';
  page: number = 1; 
  itemsPerPage: number = 5;

  constructor(private router: Router, private productService: AdminService) {}

  ngOnInit(): void {
    this.loadProducts(); // Load products on component initialization
  }

  loadProducts() {
    this.productService.fetchProducts().subscribe(
      (response) => {
        console.log(response)
        if (response.status) {
          // Map API response to fit component requirements
          this.products = response.product.map((item: any) => ({
            id: item.id,
            name: item.product_name,
            category: item.category_id, // Map category as needed
            price: item.price,
            stockQuantity: item.weight, // Assuming weight is equivalent to stock
            imageUrl: `${url}${item.product_img}`, // Adjust image URL
          }));
        }
      },
      (error) => {
        console.error('Error fetching products:', error);
      }
    );
  }

  get filteredProducts() {
    return this.products.filter(product =>
      !this.searchTerm || product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  addProduct() {
    this.router.navigate(['/products/add']);
  }

  editProduct(product: any) {
    console.log('====================================');
    console.log(product.id);
    console.log('====================================');
    this.router.navigate(['/products/edit', product.id]);
  }

  deleteProduct(id: number) {
    this.products = this.products.filter(product => product.id !== id);
    console.log('Deleted product with ID:', id);

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
        this.productService.removeProduct(id).subscribe(
          response => {
            Swal.fire('Deleted!', 'Product has been deleted.', 'success');
            this.loadProducts();
          },
          error => {
            Swal.fire('Error', 'Failed to delete Product', 'error');
          }
        );
      }
    });
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }
}
