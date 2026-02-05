import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { adminService } from '../../../../services/admin.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-voucher-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voucher-list.component.html',
  styleUrl: './voucher-list.component.scss'
})
export class VoucherListComponent implements OnInit {
  vouchers: any[] = [];
  searchTerm: string = '';

  constructor(private router: Router, private adminSvc: adminService) { }

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers() {
    this.adminSvc.getCoupons().subscribe({
      next: (res: any) => {
        console.log('API Response:', res);
        if (res.status) {
          this.vouchers = res.coupontype || [];
        } else {
          console.error('Failed to fetch vouchers:', res.message);
        }
      },
      error: (err: any) => {
        console.error('Error fetching vouchers:', err);
      }
    });
  }

  get filteredVouchers() {
    return this.vouchers.filter(v =>
      !this.searchTerm ||
      v.type?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      v.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  navigateToAddVoucher() {
    this.router.navigate(['/coupon-management/manage-vouchers']);
  }

  onEdit(voucher: any) {
    this.router.navigate(['/coupon-management/manage-vouchers'], { queryParams: { id: voucher.id } });
  }

  onDelete(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this voucher!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminSvc.removeCoupons(id).subscribe({
          next: (res: any) => {
            if (res.status) {
              Swal.fire('Deleted!', 'Your voucher has been deleted.', 'success');
              this.loadVouchers();
            } else {
              Swal.fire('Error!', res.message || 'Failed to delete voucher.', 'error');
            }
          },
          error: (err: any) => {
            console.error('Error deleting voucher:', err);
            Swal.fire('Error!', 'Something went wrong.', 'error');
          }
        });
      }
    });
  }
}
