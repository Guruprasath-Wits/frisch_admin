import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
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
  permissions: any[] = []; // Permissions as an array of key-value objects
  allowedNavItems: INavData[] = []; // Filtered navItems based on permissions
  currentUserId: string | null = null;
  roleId: string | null = null; // Current user ID from localStorage
  // Current user ID from localStorage

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private router: Router
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
    const allowedKeys = new Set<string>();
    for (const obj of this.permissions) {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] === 1) {
            allowedKeys.add(key);
          }
        }
      }
    }

    // Mapping from nav item name to permission key
    const navToPermMapping: Record<string, string> = {
      'Dashboard': 'Dashboard',
      'Main_Category': 'Main_Category',
      'Sub_Category': 'Sub_Category',
      'Steuer': 'Steuer',
      'Flasche': 'Bottle',
      'Product': 'Product',
      'Fehlende Produkte': 'Missing_Products',
      'Combo Packs': 'Combo_Packs',
      'Customer_Enquiry': 'Customer_Enquiry',
      'Coupon Management': 'Coupon_Management',
      'OrderList': 'OrderList',
      'Sample_Order': 'Sample_Order',
      'Our_Delivery_Areas': 'Our_Delivery_Areas',
      'User_Advantages': 'User_Advantages',
      'Jobs': 'Jobs',
      'Transactions': 'Subscription_Transactions',
      'FAQ': 'FAQ',
      'Imprint': 'Imprint',
      'Holiday': 'Holiday',
      'Roles': 'Roles',
      'Permissions': 'Permissions',
      'Users': 'Users',
      'Settings': 'Settings'
    };

    // Function to recursively filter nav items
    const filterNavItems = (items: INavData[], parentAllowed: boolean = false): INavData[] => {
      return items.reduce((acc: INavData[], item: INavData) => {
        if (item.title) {
          acc.push(item);
          return acc;
        }

        const permKey = item.name ? (navToPermMapping[item.name] || item.name) : '';
        const hasMapping = item.name && !!navToPermMapping[item.name];

        // Item is explicitly allowed if its key is checked
        const isExplicitlyAllowed = item.name && allowedKeys.has(permKey);

        // If parent is allowed and this child has NO specific mapping, allow it
        const isAllowedByParent = parentAllowed && !hasMapping;

        const isEffectiveAllowed = isExplicitlyAllowed || isAllowedByParent;

        let filteredChildren: INavData[] | undefined;
        if (item.children) {
          filteredChildren = filterNavItems(item.children, isEffectiveAllowed);
        }

        // Keep item if:
        // 1. The item itself is allowed
        // 2. It has children and at least one child is allow (for cases where parent is not in mapping but children are)
        if (isEffectiveAllowed || (filteredChildren && filteredChildren.length > 0)) {
          const newItem = { ...item };
          if (filteredChildren) {
            newItem.children = filteredChildren;
          }
          acc.push(newItem);
        }

        return acc;
      }, []);
    };

    const filteredSource = filterNavItems(originalNavItems);

    // Remove empty titles (headers with no items underneath)
    const finalFilteredSource: INavData[] = [];
    for (let i = 0; i < filteredSource.length; i++) {
      const current = filteredSource[i];
      if (current.title) {
        // If it's a title, check if there's any non-title item before the next title
        let hasContent = false;
        for (let j = i + 1; j < filteredSource.length; j++) {
          if (filteredSource[j].title) break;
          hasContent = true;
          break;
        }
        if (hasContent) finalFilteredSource.push(current);
      } else {
        finalFilteredSource.push(current);
      }
    }

    // Translate names
    this.navItems = this.translateItems(JSON.parse(JSON.stringify(finalFilteredSource)));

    console.log('Final Filtered Nav Items (Translated):', this.navItems);

    // Redirection logic if on Dashboard or root
    const currentUrl = this.router.url.split('?')[0];
    const isAtRoot = currentUrl === '/dashboard' || currentUrl === '/';

    // IMPORTANT: Only perform redirection if permissions have been loaded
    if (isAtRoot && this.permissions.length > 0) {
      // Check raw permissions for Dashboard access
      const hasDashboardPermission = this.permissions.some(p => {
        const value = p['Dashboard'];
        return value == 1 || value == '1' || value == true || String(value).toLowerCase() === 'true';
      });

      console.log(`Navigation check for role: ${this.currentUserId}, URL: ${currentUrl}, HasDashboard: ${hasDashboardPermission}`);

      if (hasDashboardPermission) {
        // Force Dashboard if we are at root
        if (currentUrl !== '/dashboard') {
          console.log('Force navigating Admin to Dashboard');
          this.router.navigateByUrl('/dashboard');
        }
      } else {
        // No dashboard permission, redirect to the first authorized valid navigation item
        const firstValidItem = finalFilteredSource.find(item => item.url && !item.title);
        if (firstValidItem && firstValidItem.url) {
          const targetUrl = firstValidItem.url;
          if (typeof targetUrl === 'string') {
            const absoluteUrl = targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl;
            console.log('No Dashboard access, redirecting to first allowed route:', absoluteUrl);
            this.router.navigateByUrl(absoluteUrl);
          } else {
            console.log('No Dashboard access, redirecting to first allowed route (array):', targetUrl);
            this.router.navigate(targetUrl);
          }
        }
      }
    }

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
      'Main_Category': 'SIDEBAR.CATEGORY',
      'Sub_Category': 'SIDEBAR.SUB_CATEGORY',
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
      'Holiday': 'Holiday',
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
