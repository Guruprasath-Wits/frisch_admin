import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../admin.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface MainCategory {
    id?: number;
    category_name: string;
    category_desc: string;
}

@Component({
    selector: 'app-main-category',
    templateUrl: './main-category.component.html',
    styleUrls: ['./main-category.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CommonModule,
        TranslateModule
    ]
})
export class MainCategoryComponent implements OnInit {
    categoryForm: FormGroup;
    categories: MainCategory[] = [];
    currentCategory: MainCategory | null = null;
    isEditMode: boolean = false;
    currentPage: number = 1;
    itemsPerPage: number = 5;
    totalPages: number = 1;

    constructor(
        private fb: FormBuilder,
        private adminService: AdminService
    ) {
        this.categoryForm = this.fb.group({
            category_name: ['', Validators.required],
            category_desc: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.getCategories();
    }

    getCategories(): void {
        this.adminService.getMainCategory().subscribe(
            (response: any) => {
                if (response.status) {
                    this.categories = response.category;
                    this.totalPages = Math.ceil(this.categories.length / this.itemsPerPage);
                }
            },
            error => {
                console.error('Error fetching categories:', error);
            }
        );
    }

    onSubmit(): void {
        if (this.categoryForm.invalid) {
            Swal.fire('Error', 'Please fill all required fields', 'error');
            return;
        }

        const categoryData = this.categoryForm.value;

        if (this.isEditMode && this.currentCategory?.id) {
            this.adminService.updateMainCategory(this.currentCategory.id, categoryData).subscribe(
                response => {
                    Swal.fire('Updated!', 'Category has been updated.', 'success');
                    this.resetForm();
                    this.getCategories();
                },
                error => {
                    Swal.fire('Error', 'Failed to update category', 'error');
                }
            );
        } else {
            this.adminService.addMainCategory(categoryData).subscribe(
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

    onEdit(category: MainCategory): void {
        this.isEditMode = true;
        this.currentCategory = category;
        this.categoryForm.patchValue({
            category_name: category.category_name,
            category_desc: category.category_desc
        });
    }

    onDelete(id?: number): void {
        if (id === undefined) return;

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
                this.adminService.removeMainCategory(id).subscribe(
                    response => {
                        Swal.fire('Deleted!', 'Category has been deleted.', 'success');
                        this.getCategories();
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
        return this.categories ? this.categories.slice(startIndex, endIndex) : [];
    }
}
