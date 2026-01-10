import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

interface Bottle {
    id?: number;
    bottle_name: string;
    deposit: number;
}

@Component({
    selector: 'app-bottle',
    templateUrl: './bottle.component.html',
    styleUrls: ['./bottle.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CommonModule
    ]
})
export class BottleComponent implements OnInit {
    bottleForm: FormGroup;
    bottles: Bottle[] = [];
    currentBottle: Bottle | null = null;
    isEditMode: boolean = false;
    currentPage: number = 1;
    itemsPerPage: number = 5;
    totalPages: number = 1;

    constructor(
        private fb: FormBuilder,
        private adminService: AdminService
    ) {
        this.bottleForm = this.fb.group({
            bottle_name: ['', Validators.required],
            deposit: ['', [Validators.required, Validators.min(0)]]
        });
    }

    ngOnInit(): void {
        this.getBottles();
    }

    getBottles(): void {
        this.adminService.getBottles().subscribe(
            (response: any) => {
                if (response.status) {
                    this.bottles = response.bottle;
                    this.totalPages = Math.ceil(this.bottles.length / this.itemsPerPage);
                }
            },
            error => {
                console.error('Fehler beim Abrufen der Flaschen:', error);
            }
        );
    }

    onSubmit(): void {
        if (this.bottleForm.invalid) {
            Swal.fire('Fehler', 'Bitte füllen Sie alle erforderlichen Felder aus', 'error');
            return;
        }

        const bottleData = this.bottleForm.value;

        if (this.isEditMode && this.currentBottle?.id) {
            this.adminService.updateBottle(this.currentBottle.id, bottleData).subscribe(
                response => {
                    Swal.fire('Aktualisiert!', 'Die Flasche wurde aktualisiert.', 'success');
                    this.resetForm();
                    this.getBottles();
                },
                error => {
                    Swal.fire('Fehler', 'Aktualisierung der Flasche fehlgeschlagen', 'error');
                }
            );
        } else {
            this.adminService.createBottle(bottleData).subscribe(
                response => {
                    Swal.fire('Hinzugefügt!', 'Die Flasche wurde hinzugefügt.', 'success');
                    this.resetForm();
                    this.getBottles();
                },
                error => {
                    Swal.fire('Fehler', 'Hinzufügen der Flasche fehlgeschlagen', 'error');
                }
            );
        }
    }

    onEdit(bottle: Bottle): void {
        this.isEditMode = true;
        this.currentBottle = bottle;
        this.bottleForm.patchValue({
            bottle_name: bottle.bottle_name,
            deposit: bottle.deposit
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
                this.adminService.deleteBottle(id).subscribe(
                    response => {
                        this.bottles = this.bottles.filter((b) => b.id !== id);
                        Swal.fire('Gelöscht!', 'Die Flasche wurde gelöscht.', 'success');
                        this.getBottles(); // Refresh totalPages
                    },
                    error => {
                        Swal.fire('Fehler', 'Löschen der Flasche fehlgeschlagen', 'error');
                    }
                );
            }
        });
    }

    resetForm(): void {
        this.bottleForm.reset();
        this.isEditMode = false;
        this.currentBottle = null;
    }

    previousPage(): void {
        if (this.currentPage > 1) this.currentPage--;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }

    get paginatedBottles() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.bottles.slice(startIndex, endIndex);
    }
}
