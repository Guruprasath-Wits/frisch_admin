import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

interface Tax {
    id?: number;
    tax_name: string;
    tax_value: number;
}

@Component({
    selector: 'app-tax',
    templateUrl: './tax.component.html',
    styleUrls: ['./tax.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CommonModule
    ]
})
export class TaxComponent implements OnInit {
    taxForm: FormGroup;
    taxes: Tax[] = [];
    currentTax: Tax | null = null;
    isEditMode: boolean = false;
    currentPage: number = 1;
    itemsPerPage: number = 5;
    totalPages: number = 1;

    constructor(
        private fb: FormBuilder,
        private adminService: AdminService
    ) {
        this.taxForm = this.fb.group({
            tax_name: ['', Validators.required],
            tax_value: ['', [Validators.required, Validators.min(0)]]
        });
    }

    ngOnInit(): void {
        this.getTaxes();
    }

    getTaxes(): void {
        this.adminService.getTaxes().subscribe(
            (response: any) => {
                if (response.status) {
                    this.taxes = response.tax;
                    this.totalPages = Math.ceil(this.taxes.length / this.itemsPerPage);
                }
            },
            error => {
                console.error('Error fetching taxes:', error);
            }
        );
    }

    onSubmit(): void {
        if (this.taxForm.invalid) {
            Swal.fire('Fehler', 'Bitte füllen Sie alle erforderlichen Felder aus', 'error');
            return;
        }

        const taxData = this.taxForm.value;

        if (this.isEditMode && this.currentTax?.id) {
            this.adminService.updateTax(this.currentTax.id, taxData).subscribe(
                response => {
                    Swal.fire('Aktualisiert!', 'Die Steuer wurde aktualisiert.', 'success');
                    this.resetForm();
                    this.getTaxes();
                },
                error => {
                    Swal.fire('Fehler', 'Aktualisierung der Steuer fehlgeschlagen', 'error');
                }
            );
        } else {
            this.adminService.createTax(taxData).subscribe(
                response => {
                    Swal.fire('Hinzugefügt!', 'Die Steuer wurde hinzugefügt.', 'success');
                    this.resetForm();
                    this.getTaxes();
                },
                error => {
                    Swal.fire('Fehler', 'Hinzufügen der Steuer fehlgeschlagen', 'error');
                }
            );
        }
    }

    onEdit(tax: Tax): void {
        this.isEditMode = true;
        this.currentTax = tax;
        this.taxForm.patchValue({
            tax_name: tax.tax_name,
            tax_value: tax.tax_value
        });
    }

    onDelete(id?: number): void {
        if (id === undefined) return;

        Swal.fire({
            title: "Sind Sie sicher?",
            text: "Sie können dies nicht rückgängig machen!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Löschen",
            cancelButtonText: "Abbrechen",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6"
        }).then(result => {
            if (result.isConfirmed) {
                this.adminService.deleteTax(id).subscribe(
                    response => {
                        this.taxes = this.taxes.filter((t) => t.id !== id);
                        Swal.fire('Gelöscht!', 'Die Steuer wurde gelöscht.', 'success');
                    },
                    error => {
                        Swal.fire('Fehler', 'Löschen der Steuer fehlgeschlagen', 'error');
                    }
                );
            }
        });
    }

    resetForm(): void {
        this.taxForm.reset();
        this.isEditMode = false;
        this.currentTax = null;
    }

    previousPage(): void {
        if (this.currentPage > 1) this.currentPage--;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }

    get paginatedTaxes() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.taxes.slice(startIndex, endIndex);
    }
}
