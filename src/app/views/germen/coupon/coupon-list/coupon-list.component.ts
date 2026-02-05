import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { adminService } from '../../../../services/admin.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupon-list.component.html',
  styleUrl: './coupon-list.component.scss'
})
export class CouponListComponent implements OnInit {
  coupons: any[] = [];
  searchTerm: string = '';

  constructor(private router: Router, private adminSvc: adminService) { }

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons() {
    this.adminSvc.getCouponsList().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.coupons = res.coupon || [];
        } else {
          console.error('Failed to fetch coupons:', res.message);
        }
      },
      error: (err: any) => {
        console.error('Error fetching coupons:', err);
      }
    });
  }

  get filteredCoupons() {
    return this.coupons.filter(c =>
      !this.searchTerm ||
      c.type?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.code?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  navigateToAddCoupon() {
    this.router.navigate(['/coupon-management/add-coupon']);
  }

  onEdit(coupon: any) {
    this.router.navigate(['/coupon-management/add-coupon'], { queryParams: { id: coupon.id } });
  }

  onDelete(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this coupon!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminSvc.removeCoupon(id).subscribe({
          next: (res: any) => {
            if (res.status) {
              Swal.fire('Deleted!', 'Your coupon has been deleted.', 'success');
              this.loadCoupons();
            } else {
              Swal.fire('Error!', res.message || 'Failed to delete coupon.', 'error');
            }
          },
          error: (err: any) => {
            console.error('Error deleting coupon:', err);
            Swal.fire('Error!', 'Something went wrong.', 'error');
          }
        });
      }
    });
  }
}
