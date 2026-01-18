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
import { navItems as originalNavItems } from './_nav'; // Import navItems as originalNavItems
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
  public navItems: INavData[] = [...originalNavItems]; // Copy original navItems array
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

    // Create a set of allowed names based on permissions
    const allowedNames = new Set<string>();
    for (const obj of this.permissions) {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] === 1) {
            allowedNames.add(key);
          }
        }
      }
    }

    // Explicitly allow essential menu items
    allowedNames.add('Steuer');
    allowedNames.add('Flasche');
    allowedNames.add('Dashboard');
    allowedNames.add('Combo Packs');

    // Filter from originalNavItems to maintain order and structure
    this.navItems = originalNavItems.filter(item => {
      // Always allow titles (headers)
      if (item.title) return true;

      // Allow if the name is in the allowed list
      if (item.name && allowedNames.has(item.name)) return true;

      return false;
    });

    console.log('Final Filtered Nav Items:', this.navItems);
    this.cdr.detectChanges();
  }

  /**
   * Handle scrollbar updates (optional).
   */
  onScrollbarUpdate($event: any): void { }
}
