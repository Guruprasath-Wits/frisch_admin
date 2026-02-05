import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { adminService } from '../../../../services/admin.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-voucher',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-voucher.component.html',
  styleUrl: './add-voucher.component.scss'
})
export class AddVoucherComponent implements OnInit {
  voucherForm: FormGroup;
  isEditMode = false;
  voucherId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private adminSvc: adminService
  ) {
    this.voucherForm = this.fb.group({
      type: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.voucherId = +params['id'];
        this.loadVoucherDetails(this.voucherId);
      }
    });
  }

  loadVoucherDetails(id: number) {
    this.adminSvc.getCouponById(id).subscribe({
      next: (res: any) => {
        if (res.status && res.coupontype) {
          const coupon = res.coupontype;
          this.voucherForm.patchValue({
            type: coupon.type,
            description: coupon.description
          });
        }
      },
      error: (err: any) => {
        console.error('Error fetching voucher details:', err);
      }
    });
  }

  onSubmit() {
    if (this.voucherForm.valid) {
      const payload = this.voucherForm.value;

      if (this.isEditMode && this.voucherId) {
        this.adminSvc.updateCoupons(payload, this.voucherId).subscribe({
          next: (res: any) => {
            if (res.status) {
              Swal.fire('Success!', 'Voucher updated successfully.', 'success');
              this.router.navigate(['/coupon-management/voucher-type']);
            } else {
              Swal.fire('Error', res.message || 'Failed to update voucher.', 'error');
            }
          },
          error: (err: any) => {
            console.error('Error updating voucher:', err);
            Swal.fire('Error', 'Something went wrong.', 'error');
          }
        });
      } else {
        this.adminSvc.addCoupons(payload).subscribe({
          next: (res: any) => {
            if (res.status) {
              Swal.fire('Success!', 'Voucher added successfully.', 'success');
              this.router.navigate(['/coupon-management/voucher-type']);
            } else {
              Swal.fire('Error', res.message || 'Failed to add voucher.', 'error');
            }
          },
          error: (err: any) => {
            console.error('Error adding voucher:', err);
            Swal.fire('Error', 'Something went wrong.', 'error');
          }
        });
      }
    }
  }

  onCancel() {
    this.router.navigate(['/coupon-management/voucher-type']);
  }
}
