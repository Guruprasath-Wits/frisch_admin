import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../../../admin.service';
import Swal from 'sweetalert2';

interface Holiday {
    id?: number;
    holiday_date: string;
    created_at?: string;
}

@Component({
    selector: 'app-holiday',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
    templateUrl: './holiday.component.html',
    styleUrls: ['./holiday.component.scss']
})
export class HolidayComponent implements OnInit {
    holidayForm: FormGroup;
    holidays: Holiday[] = [];

    constructor(
        private fb: FormBuilder,
        private adminService: AdminService
    ) {
        this.holidayForm = this.fb.group({
            holiday_date: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.getHolidays();
    }

    getHolidays(): void {
        this.adminService.getHolidays().subscribe(
            (response: any) => {
                if (response.status) {
                    this.holidays = response.holidays;
                }
            },
            error => {
                console.error('Error fetching holidays:', error);
            }
        );
    }

    onSubmit(): void {
        if (this.holidayForm.invalid) {
            return;
        }

        this.adminService.addHoliday(this.holidayForm.value).subscribe(
            (response: any) => {
                if (response.status) {
                    Swal.fire('Added!', 'Holiday added successfully.', 'success');
                    this.holidayForm.reset();
                    this.getHolidays();
                }
            },
            error => {
                Swal.fire('Error', 'Failed to add holiday.', 'error');
            }
        );
    }

    onDelete(id: number | undefined): void {
        if (!id) return;

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.adminService.deleteHoliday(id).subscribe(
                    (response: any) => {
                        if (response.status) {
                            Swal.fire('Deleted!', 'Holiday deleted successfully.', 'success');
                            this.getHolidays();
                        }
                    },
                    error => {
                        Swal.fire('Error', 'Failed to delete holiday.', 'error');
                    }
                );
            }
        });
    }
}
