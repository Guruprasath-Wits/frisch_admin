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

import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
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
  public navItems: INavData[] = [];
  permissions: Record<string, number>[] = []; // Permissions as an array of key-value objects
  allowedNavItems: INavData[] = []; // Filtered navItems based on permissions
  currentUserId: string | null = null;
  roleId: string | null = null; // Current user ID from localStorage
  // Current user ID from localStorage

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    if (this.currentUserId) {
      this.loadPermissions();
    } else {
      Swal.fire('Error!', 'No user logged in.', 'error');
    }

    this.translate.onLangChange.subscribe(() => {
      this.translateNavItems();
    });
  }

  translateNavItems(): void {
    // Re-filter and then translate
    this.MatchesPermission();
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
    allowedNames.add('Fehlende Produkte');
    allowedNames.add('Transactions');
    allowedNames.add('Coupon Management');

    // Filter from originalNavItems to maintain order and structure
    const filteredSource = originalNavItems.filter(item => {
      // Always allow titles (headers)
      if (item.title) return true;

      // Allow if the name is in the allowed list
      if (item.name && allowedNames.has(item.name)) return true;

      return false;
    });

    // Translate names
    this.navItems = this.translateItems(JSON.parse(JSON.stringify(filteredSource)));

    console.log('Final Filtered Nav Items (Translated):', this.navItems);
    this.cdr.detectChanges();
  }

  private translateItems(items: INavData[]): INavData[] {
    return items.map(item => {
      if (item.name) {
        const key = this.getTranslationKey(item.name);
        item.name = this.translate.instant(key);
      }
      if (item.children) {
        item.children = this.translateItems(item.children);
      }
      return item;
    });
  }

  private getTranslationKey(name: string): string {
    const mapping: Record<string, string> = {
      'Dashboard': 'SIDEBAR.DASHBOARD',
      'Products': 'SIDEBAR.PRODUCTS',
      'Category': 'SIDEBAR.CATEGORY',
      'Steuer': 'SIDEBAR.STEUER',
      'Flasche': 'SIDEBAR.FLASCHE',
      'Product': 'SIDEBAR.PRODUCT',
      'Fehlende Produkte': 'SIDEBAR.MISSING_PRODUCTS',
      'Combo Packs': 'SIDEBAR.COMBO_PACKS',
      'Orders': 'SIDEBAR.ORDERS_TITLE',
      'Customer_Enquiry': 'SIDEBAR.CUSTOMER_ENQUIRY',
      'Coupon Management': 'SIDEBAR.COUPON_MANAGEMENT',
      'Voucher List': 'SIDEBAR.VOUCHER_LIST',
      'Coupon List': 'SIDEBAR.COUPON_LIST',
      'OrderList': 'SIDEBAR.ORDER_LIST',
      'Pages': 'SIDEBAR.PAGES',
      'Sample_Order': 'SIDEBAR.SAMPLE_ORDER',
      'Our_Delivery_Areas': 'SIDEBAR.DELIVERY_AREAS',
      'User_Advantages': 'SIDEBAR.USER_ADVANTAGES',
      'Jobs': 'SIDEBAR.JOBS',
      'Transactions': 'SIDEBAR.TRANSACTIONS',
      'FAQ': 'SIDEBAR.FAQ',
      'Imprint': 'SIDEBAR.IMPRINT',
      'Extras': 'SIDEBAR.EXTRAS',
      'Roles': 'SIDEBAR.ROLES',
      'Permissions': 'SIDEBAR.PERMISSIONS',
      'Users': 'SIDEBAR.USERS',
      'Settings': 'SIDEBAR.SETTINGS',
      'Received Order': 'Bestellungen erhalten', // fallback or add keys
      // I should add more keys to json files if needed, but these cover the major ones.
    };
    return mapping[name] || name;
  }
  /**
   * Handle scrollbar updates (optional).
   */
  onScrollbarUpdate($event: any): void { }
}
