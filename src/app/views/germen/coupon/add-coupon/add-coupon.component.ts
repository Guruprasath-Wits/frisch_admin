import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { adminService } from '../../../../services/admin.services';
import {
  ButtonDirective,
  DropdownComponent,
  DropdownMenuDirective,
  DropdownToggleDirective,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective
} from '@coreui/angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-coupon',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownComponent,
    DropdownToggleDirective,
    DropdownMenuDirective,
    ButtonDirective,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective
  ],
  templateUrl: './add-coupon.component.html',
  styleUrl: './add-coupon.component.scss'
})
export class AddCouponComponent implements OnInit {
  couponForm: FormGroup;
  isEditMode = false;
  couponId: number | null = null;
  voucherTypes: any[] = [];
  userList: any[] = [];
  isEmailFieldVisible = false;
  isDiscountFieldVisible = true;
  isFlatDiscount = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private adminSvc: adminService,
    private cdr: ChangeDetectorRef
  ) {
    this.couponForm = this.fb.group({
      code: ['', Validators.required],
      type: ['', Validators.required],
      discount_percentage: ['', Validators.required],
      voucher_amount: [''], // New control for flat amount
      description: [''],
      user_email: [[]], // Changed to array for multi-select
      from_date: ['', Validators.required],
      end_date: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadVoucherTypes();
    this.loadUsers();
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.couponId = +params['id'];
        this.loadCouponDetails(this.couponId);
      }
    });

    // Listen for changes in coupon type to toggle validation for discount_percentage and user_email
    this.couponForm.get('type')?.valueChanges.subscribe(type => {
      const selectedType = type ? String(type).trim().toLowerCase() : '';

      // Update Visibility Properties for Template
      this.isDiscountFieldVisible = !selectedType.includes('versandkostenfrei');
      this.isEmailFieldVisible = selectedType.includes('geld') ||
        selectedType.includes('benutzer') ||
        selectedType.includes('user') ||
        selectedType.includes('mail');

      this.isFlatDiscount = selectedType.includes('geld') ||
        selectedType.includes('benutzer') ||
        selectedType.includes('user') ||
        selectedType.includes('spezifisch');

      const discountControl = this.couponForm.get('discount_percentage');
      const amountControl = this.couponForm.get('voucher_amount');
      const emailControl = this.couponForm.get('user_email');

      // Handle Discount vs Amount Validation
      if (this.isFlatDiscount) {
        // Flat Discount Mode: Amount required, Percentage cleared
        amountControl?.setValidators([Validators.required]);
        discountControl?.clearValidators();
        discountControl?.setValue('');
      } else if (this.isDiscountFieldVisible) {
        // Percentage Mode: Percentage required, Amount cleared
        discountControl?.setValidators([Validators.required]);
        amountControl?.clearValidators();
        amountControl?.setValue('');
      } else {
        // No Discount Field (Free Shipping)
        discountControl?.clearValidators();
        discountControl?.setValue('');
        amountControl?.clearValidators();
        amountControl?.setValue('');
      }
      discountControl?.updateValueAndValidity();
      amountControl?.updateValueAndValidity();

      // Handle User Email Validation
      if (this.isEmailFieldVisible) {
        emailControl?.setValidators([Validators.required]);
      } else {
        emailControl?.clearValidators();
        emailControl?.setValue([]);
      }
      emailControl?.updateValueAndValidity();

      // Force UI refresh
      this.cdr.detectChanges();
    });
  }


  loadUsers() {
    this.adminSvc.getUsers().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.userList = res.user || [];
        }
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);
      }
    });
  }

  loadVoucherTypes() {
    this.adminSvc.getCoupons().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.voucherTypes = res.coupontype || [];
        }
      },
      error: (err: any) => {
        console.error('Error fetching voucher types:', err);
      }
    });
  }

  loadCouponDetails(id: number) {
    this.adminSvc.getCouponsById(id).subscribe({
      next: (res: any) => {
        console.log('Full API Response:', res);
        if (res.status && res.coupon) {
          const coupon = res.coupon;
          console.log('Coupon Object:', coupon);
          console.log('Date fields - fromdate:', coupon.fromdate, 'from_date:', coupon.from_date);
          console.log('Date fields - enddate:', coupon.enddate, 'end_date:', coupon.end_date);

          let userEmails = [];
          if (coupon.user_email) {
            userEmails = typeof coupon.user_email === 'string' ? coupon.user_email.split(',').map((e: string) => e.trim()) : coupon.user_email;
          }

          // Determine if it is a flat discount type for patching
          const t = String(coupon.type || '').toLowerCase();
          const isFlat = t.includes('geld') || t.includes('benutzer') || t.includes('spezifisch') || t.includes('user');

          this.couponForm.patchValue({
            code: coupon.couponcode || coupon.code,
            type: coupon.type,
            discount_percentage: isFlat ? '' : coupon.discount_percentage,
            voucher_amount: isFlat ? coupon.discount_percentage : '', // Patch to amount if flat
            description: coupon.description,
            user_email: userEmails,
            from_date: coupon.fromdate || coupon.from_date,
            end_date: coupon.enddate || coupon.end_date
          });

          console.log('Form values after patch:', this.couponForm.value);

          // Update visibility after patching
          this.isDiscountFieldVisible = !t.includes('versandkostenfrei');
          this.isEmailFieldVisible = t.includes('geld') || t.includes('benutzer') || t.includes('spezifisch') || t.includes('gutschein');
          this.isFlatDiscount = isFlat;

          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error fetching coupon details:', err);
      }
    });
  }

  onSubmit() {
    if (this.couponForm.valid) {
      const payload = { ...this.couponForm.value };

      // Map voucher_amount to discount_percentage for backend compatibility if it's a flat discount
      // Assuming backend uses 'discount_percentage' column for value regardless of type
      if (this.isFlatDiscount && payload.voucher_amount) {
        payload.discount_percentage = payload.voucher_amount;
      }
      // Remove temporary form control if not needed in payload, 
      // or keep it if backend ignores extra fields. Safer to keep mostly, 
      // but let's trust payload construction.

      // Join array values into a comma-separated string if needed by backend
      if (Array.isArray(payload.user_email)) {
        payload.user_email = payload.user_email.join(', ');
      }

      if (this.isEditMode && this.couponId) {
        this.adminSvc.updateCoupon(payload, this.couponId).subscribe({
          next: (res: any) => {
            if (res.status) {
              Swal.fire('Success!', 'Coupon updated successfully.', 'success');
              this.router.navigate(['/coupon-management/manage-vouchers']);
            } else {
              Swal.fire('Error', res.message || 'Failed to update coupon.', 'error');
            }
          },
          error: (err: any) => {
            console.error('Error updating coupon:', err);
            Swal.fire('Error', 'Something went wrong.', 'error');
          }
        });
      } else {
        this.adminSvc.addCoupon(payload).subscribe({
          next: (res: any) => {
            if (res.status) {
              Swal.fire('Success!', 'Coupon added successfully.', 'success');
              this.router.navigate(['/coupon-management/manage-vouchers']);
            } else {
              Swal.fire('Error', res.message || 'Failed to add coupon.', 'error');
            }
          },
          error: (err: any) => {
            console.error('Error adding coupon:', err);
            Swal.fire('Error', 'Something went wrong.', 'error');
          }
        });
      }
    }
  }

  onCancel() {
    this.router.navigate(['/coupon-management/manage-vouchers']);
  }

  isUserSelected(email: string): boolean {
    const selected = this.couponForm.get('user_email')?.value;
    return Array.isArray(selected) && selected.includes(email);
  }

  onUserCheckChange(email: string, event: any) {
    const isChecked = event.target.checked;
    const currentSelection = [...(this.couponForm.get('user_email')?.value || [])];

    if (isChecked) {
      if (!currentSelection.includes(email)) {
        currentSelection.push(email);
      }
    } else {
      const index = currentSelection.indexOf(email);
      if (index > -1) {
        currentSelection.splice(index, 1);
      }
    }

    this.couponForm.get('user_email')?.setValue(currentSelection);
    this.couponForm.get('user_email')?.markAsTouched();
    this.cdr.detectChanges();
  }

  getSelectedUsersDisplay(): string {
    const selected = this.couponForm.get('user_email')?.value;
    if (!Array.isArray(selected) || selected.length === 0) {
      return 'Empfänger wählen...';
    }
    if (selected.length === 1) {
      return selected[0];
    }
    return `${selected.length} Empfänger ausgewählt`;
  }
}
