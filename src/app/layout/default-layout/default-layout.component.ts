import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import { INavData } from '@coreui/angular'; // Import INavData interface
import { IconDirective } from '@coreui/icons-angular';

import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective,
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav'; // Import navItems array
import { AdminService } from '../../admin.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  standalone: true,
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    RouterLink,
    IconDirective,
    NgScrollbar,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    DefaultHeaderComponent,
    ShadowOnScrollDirective,
    ContainerComponent,
    RouterOutlet,
    DefaultFooterComponent,
  ],
})
export class DefaultLayoutComponent implements OnInit {
  public navItems: INavData[] = navItems; // Original navItems array
  permissions: Record<string, number>[] = []; // Permissions as an array of key-value objects
  allowedNavItems: INavData[] = []; // Filtered navItems based on permissions
  currentUserId: string | null = null;
  roleId: string | null = null; // Current user ID from localStorage
  // Current user ID from localStorage

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    if (this.currentUserId) {
      this.loadPermissions();
    } else {
      Swal.fire('Error!', 'No user logged in.', 'error');
    }
  }

  /**
   * Load the current user ID from localStorage.
   */
  loadCurrentUser(): void {
    this.currentUserId = localStorage.getItem('roleId');
    console.log('Current User ID:', this.currentUserId);
  }



  /**
   * Load permissions from the server based on the current user ID.
   */
  loadPermissions(): void {
    this.adminService.loadPermissionsById(this.currentUserId).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.permissions = response.permissions;
          this.MatchesPermission();
        } else {
          Swal.fire('Error!', 'Failed to load permissions.', 'error');
        }
      },
      error: () => Swal.fire('Error!', 'Failed to load permissions.', 'error'),
    });
  }

  /**
   * Match permissions with navigation items and update the allowedNavItems array.
   */
  MatchesPermission(): void {
    console.log('Permissions:', this.permissions);
    this.allowedNavItems = []; // Reset allowed items for matching

    // Iterate through permissions
    for (const obj of this.permissions) {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            for (const navItem of this.navItems) {
              // Check if the navItem matches the permission key and is allowed
              if (key === navItem.name && obj[key] === 1) {
                console.log(`Adding allowed navItem: ${navItem.name}`);
                if (!this.allowedNavItems.includes(navItem)) {
                  this.allowedNavItems.push(navItem);
                }
              }
            }
          }
        }
      }
    }

    // Ensure 'Coupon Management' is added if it exists in navItems
    const couponManagement = navItems.find(item => item.name === 'Coupon Management');
    if (couponManagement && !this.allowedNavItems.includes(couponManagement)) {
      // Find the correct index to insert (after Customer_Enquiry)
      const customerEnquiryIndex = this.allowedNavItems.findIndex(item => item.name === 'Customer_Enquiry');
      if (customerEnquiryIndex !== -1) {
        this.allowedNavItems.splice(customerEnquiryIndex + 1, 0, couponManagement);
      } else {
        this.allowedNavItems.push(couponManagement);
      }
    }

    // Update navItems with the filtered allowedNavItems
    this.navItems = this.allowedNavItems;
    this.cdr.detectChanges();
    console.log('Allowed Nav Items:', this.allowedNavItems);
  }

  /**
   * Handle scrollbar updates (optional).
   */
  onScrollbarUpdate($event: any): void { }
}
