import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from '../../../../admin.service';
import Swal from 'sweetalert2';
import { catchError, forkJoin, of, zip } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Order {
  id: number;
  order_id: number;
  product: string;
  quantity: number;
  price: number;
  delivery_date: string;
  address: string;
  contact: string;
  instruction: string;
  status: string;
  driverName: string; // Resolved driver name
  customerName?: string; // Resolved customer name
  driver_id: number;
  lat: string;
  lng: string;
}

export interface Driver {
  id: number;
  username: string;
  role: string;
}

@Component({
  selector: 'app-order-assigned',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './order-assigned.component.html',
  styleUrls: ['./order-assigned.component.scss'],
})
export class OrderAssignedComponent implements OnInit {
  Orders: Order[] = [];
  drivers: Driver[] = [];
  searchTerm: string = '';
  searchEmail: string = '';
  searchPhone: string = '';
  searchOrderId: string = '';
  searchStatus: string = '';
  searchDate: string = '';
  searchDriver: string = '';
  selectedDriver: string = '';
  page: number = 1;
  itemsPerPage: number = 50;
  mergedOrders: any[] = [];
  hasDistanceColumn = false;
  hasTimeColumn = false;
  mainCategories: any[] = [];


  showSubscriptionOrders: boolean = false;
  subscriptionOrders: Order[] = [];
  allUsers: any[] = []; // Store all users for lookup
  isLoading = false;
  isDriverDropdownOpen = false;
  constructor(private router: Router, private adminService: AdminService, private http: HttpClient) { }

  ngOnInit(): void {
    this.loadDriversAndOrders();
    // this.loadOrders();
    this.loadDrivers();
    // this.loadSubsOrder();
    this.loadAllOrders();
    this.loadMainCategories();
  }

  loadMainCategories(): void {
    this.adminService.getMainCategory().subscribe(
      (response: any) => {
        if (response.status) {
          this.mainCategories = response.category;
        }
      },
      (error: any) => {
        console.error('Error fetching main categories:', error);
      }
    );
  }

  loadSubsOrder(): void {
    this.adminService.loadSubsOrders().subscribe(
      (response: any) => {
        this.subscriptionOrders = response.subscribeData
          .filter((order: any) => {
            const status = (order.status || 'assigned').toLowerCase();
            return status === 'assigned';
          })
          .map((order: any) => ({
            id: order.id,
            user_id: order.user_id,
            order_id: order.order_id,
            zipcode: order.zipcode,
            price: order.price,
            delivery_date: order.delivery_date,
            address: order.address,
            contact: order.contact,
            instruction: order.instruction,
            status: order.status || 'assigned',
            tips: order.tips
          }));

      },


      (error: any) => {
        console.error('Error fetching Subscription Orders:', error);
      }
    );
  }

  SubscripOrders(): void {
    if (!this.showSubscriptionOrders && this.subscriptionOrders.length === 0) {
      this.loadSubsOrder();
    }
    this.showSubscriptionOrders = !this.showSubscriptionOrders;
    this.page = 1; // Reset to the first page when toggling.
  }

  loadDrivers(): void {
    this.adminService.loadUsers().subscribe(
      (response: any) => {
        this.drivers = response.user.filter(
          (user: any) => user.role.toLowerCase() === "driver"
        );

        console.log('====================================');
        console.log(this.drivers);
        console.log('====================================');
      },
      (error: any) => {
        console.error('Error fetching drivers:', error);
        Swal.fire('Error', 'Failed to load drivers. Please try again.', 'error');
      }
    );
  }
  loadOrders(): void {
    this.adminService.loadOrders().subscribe(
      (response: { orders: Order[] }) => {

        this.Orders = response.orders
          .filter(order => order.status?.toLowerCase() === 'assigned')
          .map(order => ({
            ...order,
            driverName: this.getDriverName(order.driver_id),
          }));
        console.log('Filtered and mapped Orders:', this.Orders);


      },
      (error: any) => console.error('Error fetching Orders:', error)
    );
  }


  loadDriversAndOrders(): void {
    this.adminService.loadUsers().subscribe(
      (response: { user: Driver[] }) => {
        // this.drivers = response.user.filter((user) => user.role === 'driver');
        // this.loadOrders(); 

        this.drivers = response.user.filter(
          (user: any) => user.role.toLowerCase() === "driver"
        );
      },
      (error: any) => console.error('Error fetching Drivers:', error)
    );
  }




  allOrders: any[] = [];         // Stores all fetched orders
  updateColumnFlags() {
    this.hasDistanceColumn = this.mergedOrders?.some(order => !!order.distanceKm) ?? false;
    this.hasTimeColumn = this.mergedOrders?.some(order => !!order.estimatedTimeInMinutes) ?? false;
  }

  GetOrder() {
    const order = {
      driver_id: this.selectedDriver,
      delivery_date: this.searchDate,
      status: "Assigned"
    };

    this.adminService.getOrder(order).subscribe(
      (res: any) => {
        console.log('Raw API response:', res);

        if (res.status === false) {
          Swal.fire('Please Select Required Fields', '', 'info');
          return;
        }

        console.log('Orders fetched successfully', res.orders);

        // Convert both sides to YYYY-MM-DD for comparison
        const filteredOrders = res.orders.filter((o: any) => {
          // Convert delivery_date to local YYYY-MM-DD
          const apiDate = new Date(o.delivery_date).toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
          const searchDate = new Date(this.searchDate).toLocaleDateString('en-CA');
          return apiDate === searchDate;
        });

        console.log('Filtered Orders by Date:', filteredOrders);


        const sortedOrders = filteredOrders.sort((a: any, b: any) => a.index_id - b.index_id);

        const processedOrders = sortedOrders.map((order: any) => ({
          ...order,
          customerName: this.getUserName(order.user_id || order.userid || order.customer_id)
        }));

        this.allMergedOrders = [...processedOrders];
        this.mergedOrders = [...processedOrders];
        this.updateColumnFlags();

        this.showSubscriptionOrders = false;
      },
      (err: any) => {
        console.error('Error fetching orders', err);
        Swal.fire('Error', 'An error occurred while fetching orders.', 'error');
      }
    );
  }







  // loadOrders(): void {
  //   this.adminService.loadOrders().subscribe(
  //     (response: { orders: Order[] }) => {
  //       if (!response || !response.orders) {
  //         console.error('Invalid response:', response);
  //         return;
  //       }

  //       const referenceLat = 51.5177192; 
  //       const referenceLng = 7.4179611;

  //       this.Orders = response.orders
  //         .filter(order => order.status?.toLowerCase() === 'assigned')
  //         .map(order => {
  //           const distance = this.calculateDistance(referenceLat, referenceLng, Number(order.lat), Number(order.lng));
  //           const estimatedTime = this.getEstimatedTime(distance);

  //           return {
  //             ...order,
  //             driverName: this.getDriverName(order.driver_id),
  //             distance: distance,
  //             estimatedTimeInMinutes: estimatedTime
  //           };
  //         })
  //         .sort((a, b) => a.distance - b.distance);

  //         console.log(this.Orders)

  //       // ✅ Store to new table
  //       const ordersToStore = this.Orders.map(order => {
  //         const { id, ...rest } = order;
  //         return { ...rest }; // Only fields except `id`
  //       });

  //       console.log('Orders to store (without ID):', ordersToStore);

  //       this.adminService.storeProcessedOrders(ordersToStore).subscribe(
  //         res => console.log('Orders stored successfully', res),
  //         err => console.error('Error storing processed orders', err)
  //       );
  //     },
  //     (error) => console.error('Error fetching Orders:', error)
  //   );
  // }
  // async GetOrder(): Promise<void> {

  //   this.mergedOrders = []

  //   // Uncomment if you want to reload data every time
  //   // this.mergedOrders = [];
  //   // await this.loadAllOrders();

  //   const driverId = this.selectedDriver;
  //   const selectedDate = this.searchDate;
  //   const formattedSearchDate = selectedDate
  //     ? new Date(selectedDate).toISOString().split('T')[0]
  //     : null;

  //   // Assign the filtered result back to mergedOrders
  //   this.mergedOrders = this.allMergedOrders.filter((order: any) => {
  //     const isDriverMatch = driverId ? order.driver_id == driverId : true;

  //     const orderDate = new Date(order.delivery_date).toISOString().split('T')[0];
  //     const isDateMatch = formattedSearchDate ? orderDate === formattedSearchDate : true;

  //     const isStatusMatch = order.status?.toLowerCase() === 'assigned';

  //     return isDriverMatch && isDateMatch && isStatusMatch;
  //   });

  //   console.log('Filtered Merged Orders:', this.mergedOrders);
  // }






  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      return Number.MAX_VALUE;
    }

    const R = 6371; // Radius of Earth in km
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // 🕒 Rough estimate based on average speed
  getEstimatedTime(distanceKm: number): number {
    const averageDrivingSpeed = 40; // km/h (realistic speed for city driving)
    const roadFactor = 1.1; // ~20% longer due to roads not being straight
    const adjustedDistance = distanceKm * roadFactor;

    const timeInHours = adjustedDistance / averageDrivingSpeed;
    return Math.round(timeInHours * 60); // in minutes
  }





  getDriverName(driverId: number): string {
    const driver = this.drivers.find((d) => d.id == driverId);
    return driver ? driver.username : 'Unassigned';
  }

  getUserName(userId: any): string {
    if (!userId) {
      console.warn('No userId provided for lookup');
      return 'Unknown Customer';
    }

    // Debug: log once if allUsers is populated
    if (this.allUsers.length > 0 && !this.allUsers[0].logged) {
      console.log('Sample User from allUsers:', this.allUsers[0]);
      this.allUsers[0].logged = true;
    }

    const user = this.allUsers.find((u: any) => u.id == userId);
    if (!user) {
      console.warn(`User not found in allUsers (length: ${this.allUsers.length}) for ID: ${userId}`);
      return `Unknown Customer (ID: ${userId})`;
    }

    // Prioritize username, then fname + lname, then company name
    if (user.username && user.username.trim() !== '') return user.username;
    if (user.fname || user.lname) {
      const fullName = `${user.fname || ''} ${user.lname || ''}`.trim();
      if (fullName !== '') return fullName;
    }
    if (user.company_name && user.company_name.trim() !== '') return user.company_name;

    return user.email || `Customer ${userId}`;
  }

  editOrder(order: Order): void {
    Swal.fire({
      title: 'Assign Driver',
      width: '500px',
      padding: '0',
      showCloseButton: true,
      customClass: {
        popup: 'premium-swal-popup',
        title: 'swal2-title',
        htmlContainer: 'swal2-html-container',
        confirmButton: 'swal2-confirm'
      },
      html: `
        <div class="section-title-premium"><i class="fas fa-user-tag"></i> Reassign Order</div>
        <div class="details-grid-premium">
          <div class="detail-item-premium full-width">
            <label>Select New Driver</label>
            <div class="driver-selection-list">
              ${this.drivers.map(d => `
                <div class="driver-option-card" data-id="${d.id}">
                  <div class="driver-avatar">
                    <i class="fas fa-user-tie"></i>
                  </div>
                  <div class="driver-details">
                    <span class="d-name">${d.username}</span>
                    <span class="d-status"><i class="fas fa-check-circle"></i> Driver Team</span>
                  </div>
                  <i class="fas fa-check-circle check-icon"></i>
                </div>
              `).join('')}
            </div>
            <input type="hidden" id="newDriverId" value="">
          </div>
        </div>
        <p style="margin-top: 20px; color: #b2bec3; font-size: 0.8rem; font-weight: 600; padding: 0 20px;">
          <i class="fas fa-info-circle"></i> Once reassigned, the order will appear in the driver's task list immediately.
        </p>
      `,
      didOpen: () => {
        const cards = document.querySelectorAll('.driver-option-card');
        const hiddenInput = document.getElementById('newDriverId') as HTMLInputElement;

        cards.forEach(card => {
          card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            hiddenInput.value = card.getAttribute('data-id') || '';
          });
        });
      },
      preConfirm: () => {
        const value = (document.getElementById('newDriverId') as HTMLInputElement).value;
        if (!value) {
          Swal.showValidationMessage('Please select a driver from the list');
          return false;
        }
        return value;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newDriverId = Number(result.value);
        this.adminService.updateOrders(order.id, { driverId: newDriverId }).subscribe(
          () => {
            Swal.fire({
              title: 'Success',
              text: 'Driver reassigned successfully!',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadOrders(); // Refresh orders to update driver info
          },
          (error) => {
            Swal.fire('Error', 'Failed to reassign driver.', 'error');
            console.error('Error reassigning driver:', error);
          }
        );
      }
    });
  }


  editOrders(order: Order): void {
    Swal.fire({
      title: 'Assign Driver (Sub)',
      width: '500px',
      padding: '0',
      showCloseButton: true,
      customClass: {
        popup: 'premium-swal-popup',
        title: 'swal2-title',
        htmlContainer: 'swal2-html-container',
        confirmButton: 'swal2-confirm'
      },
      html: `
        <div class="section-title-premium"><i class="fas fa-sync"></i> Reassign Subscription</div>
        <div class="details-grid-premium">
          <div class="detail-item-premium full-width">
            <label>Select New Driver</label>
            <div class="driver-selection-list">
              ${this.drivers.map(d => `
                <div class="driver-option-card" data-id="${d.id}">
                  <div class="driver-avatar">
                    <i class="fas fa-user-tie"></i>
                  </div>
                  <div class="driver-details">
                    <span class="d-name">${d.username}</span>
                    <span class="d-status"><i class="fas fa-check-circle"></i> Driver Team</span>
                  </div>
                  <i class="fas fa-check-circle check-icon"></i>
                </div>
              `).join('')}
            </div>
            <input type="hidden" id="newDriverId" value="">
          </div>
        </div>
      `,
      didOpen: () => {
        const cards = document.querySelectorAll('.driver-option-card');
        const hiddenInput = document.getElementById('newDriverId') as HTMLInputElement;

        cards.forEach(card => {
          card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            hiddenInput.value = card.getAttribute('data-id') || '';
          });
        });
      },
      preConfirm: () => {
        const value = (document.getElementById('newDriverId') as HTMLInputElement).value;
        if (!value) {
          Swal.showValidationMessage('Please select a driver from the list');
          return false;
        }
        return value;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newDriverId = Number(result.value);
        this.adminService.updateSubscriptionOrders(order.id, { driverId: newDriverId }).subscribe(
          () => {
            Swal.fire({
              title: 'Success',
              text: 'Driver reassigned successfully!',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadOrders(); // Refresh orders to update driver info
          },
          (error) => {
            Swal.fire('Error', 'Failed to reassign driver.', 'error');
            console.error('Error reassigning driver:', error);
          }
        );
      }
    });
  }

  // loadAllOrders(): void {
  //   debugger
  //   forkJoin({
  //      normalOrders: this.adminService.loadOrders().pipe(
  //        catchError((error) => {
  //          console.error('Error loading normal orders:', error);
  //          return of({ orders: [] }); // fallback to empty array
  //        })
  //      ),
  //      subsOrders: this.adminService.loadSubsOrders().pipe(
  //        catchError((error) => {
  //          console.error('Error loading subscription orders:', error);
  //          return of({ subscribeData: [] }); // fallback to empty array
  //        })
  //      )
  //    }).subscribe(
  //     ({ normalOrders, subsOrders }: any) => {
  //       const processedOrders = (normalOrders.orders || [])
  //         .filter((order: any) => {
  //           const status = (order.status || '').toLowerCase();
  //           return status === 'Assigned' ;
  //         })
  //         .map((order: any) => ({
  //           id: order.id ?? '',
  //           order_id: order.order_id ?? '',
  //           price: order.price ?? 0,
  //           delivery_date: order.delivery_date ?? '',
  //           address: order.address ?? '',
  //           contact: order.contact ?? '',
  //           instruction: order.instruction ?? '',
  //           status: order.status ? order.status.toLowerCase() : '',
  //           type: 'normal', // To identify source if needed
  //           tips: null
  //         }));

  //       const processedSubsOrders = (subsOrders.subscribeData || [])
  //         .filter((order: any) => {
  //           const status = (order.status || 'Assigned').toLowerCase();
  //           return status === 'Assigned';
  //         })
  //         .map((order: any) => ({
  //           id: order.id ?? '',
  //           order_id: order.order_id ?? '',
  //           price: order.price ?? 0,
  //           delivery_date: order.delivery_date ?? '',
  //           address: order.address ?? '',
  //           contact: order.contact ?? '',
  //           instruction: order.instruction ?? '',
  //           status: order.status ? order.status.toLowerCase() : 'Assigned',
  //           type: 'subscription', // To identify source
  //           tips: order.tips ?? null
  //         }));

  //       // Merge both
  //       this.mergedOrders = [...processedOrders, ...processedSubsOrders];
  //        console.log('Merged Orders:', this.mergedOrders);
  //     },
  //     error => {
  //       console.error('Error loading all orders:', error);
  //     }
  //   );
  // }
  allMergedOrders: any = []
  loadAllOrders(): void {

    // First, load drivers
    this.adminService.loadUsers().pipe(
      catchError((error: any) => {
        console.error('Error updating status:', error);
        Swal.fire('Error', 'Failed to update order status.', 'error');
        return of({ user: [] }); // fallback to empty users
      })
    ).subscribe((userResponse: any) => {
      this.allUsers = userResponse.user || []; // Store all users
      this.drivers = userResponse.user.filter((user: any) =>
        user.role?.toLowerCase() === 'driver'
      );

      forkJoin({
        normalOrders: this.adminService.loadOrders().pipe(
          catchError((error: any) => {
            console.error('Error loading normal orders:', error);
            return of({ orders: [] }); // fallback to empty
          })
        ),
        subsOrders: this.adminService.loadSubsOrders().pipe(
          catchError((error: any) => {
            console.error('Error loading subscription orders:', error);
            return of({ subscribeData: [] }); // fallback to empty
          })
        )
      }).subscribe(
        ({ normalOrders, subsOrders }: any) => {
          const processedOrders = (normalOrders.orders || [])
            .filter((order: any) => (order.status || '').toLowerCase() === 'assigned')
            .map((order: any) => ({
              id: order.id ?? '',
              order_id: order.order_id ?? '',
              price: order.price ?? 0,
              delivery_date: order.delivery_date ?? '',
              address: `${order.address ?? ''}`,
              // address: order.address ?? '' + ',' + order.zipcode ?? '' + ',' + order.ort ?? '',
              // address : order.address ?? '',
              // zipcode: order.zipcode ?? '',
              // ort: order.ort ?? '',
              contact: order.contact ?? '',
              instruction: order.instruction ?? '',
              status: order.status ? order.status.toLowerCase() : '',
              driver_id: order.driver_id ?? null,
              driverName: this.getDriverName(order.driver_id),
              customerName: this.getUserName(order.user_id),
              user_id: order.user_id ?? null,
              type: 'normal',
              tips: null
            }));

          const processedSubsOrders = (subsOrders.subscribeData || [])
            .filter((order: any) => (order.status || 'assigned').toLowerCase() === 'assigned')
            .map((order: any) => ({
              id: order.id ?? '',
              order_id: order.order_id ?? '',
              price: order.price ?? 0,
              delivery_date: order.delivery_date ?? '',
              address: `${order.address ?? ''}`,
              // address: order.address ?? '' + ',' + order.zipcode ?? '' + ',' + order.ort ?? '',
              //  address : order.address ?? '',
              // zipcode: order.zipcode ?? '',
              // ort: order.ort ?? '',
              contact: order.contact ?? '',
              instruction: order.instruction ?? '',
              status: order.status ? order.status.toLowerCase() : 'assigned',
              driver_id: order.driver_id ?? null,
              driverName: this.getDriverName(order.driver_id),
              customerName: this.getUserName(order.user_id || order.id),
              user_id: order.user_id ?? null,
              type: 'subscription',
              tips: order.tips ?? null
            }));

          this.allMergedOrders = [...processedOrders, ...processedSubsOrders];


          this.mergedOrders = [...this.allMergedOrders];
          console.log('Merged Orders with driver names:', this.mergedOrders);
        },
        error => {
          console.error('Error loading all orders:', error);
        }
      );
    });
  }


  get filteredOrders(): Order[] {
    const orders = this.showSubscriptionOrders ? this.subscriptionOrders : this.Orders;
    return this.mergedOrders.filter((order) =>
      (!this.searchTerm || order.product.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (!this.searchEmail || order.address.toLowerCase().includes(this.searchEmail.toLowerCase())) &&
      (!this.searchPhone || order.contact.includes(this.searchPhone)) &&
      (!this.searchOrderId || order.order_id.toString().includes(this.searchOrderId)) &&
      (!this.searchStatus || order.status.toLowerCase().includes(this.searchStatus.toLowerCase())) &&
      (!this.searchDate || new Date(order.delivery_date).toISOString().split('T')[0] === this.searchDate) &&
      (!this.searchDriver || order.driverName.toLowerCase().includes(this.searchDriver.toLowerCase()))
    );
  }

  selectDateAndDownload(): void {
    Swal.fire({
      title: 'Production Report',
      width: '460px',
      padding: '0',
      showCloseButton: true,
      customClass: {
        popup: 'premium-swal-popup',
        title: 'swal2-title',
        htmlContainer: 'swal2-html-container',
        confirmButton: 'swal2-confirm'
      },
      html: `
        <div style="padding: 10px 20px 25px;">
          <!-- 1. Date Selection Section -->
          <div class="selection-card" style="background: #ffffff; border: 2px solid #edeff2; border-radius: 18px; padding: 18px; margin-bottom: 20px; position: relative;">
            <label style="position: absolute; top: -11px; left: 18px; background: white; padding: 0 10px; font-size: 0.65rem; font-weight: 900; color: #a29bfe; text-transform: uppercase; letter-spacing: 1px;">Delivery Date</label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: #fff9e6; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <i class="far fa-calendar-alt" style="color: #f7ce3e; font-size: 1.1rem;"></i>
              </div>
              <input type="date" id="deliveryDate" style="flex: 1; height: 44px; border: 2px solid #f1f2f6; border-radius: 12px; padding: 0 15px; font-weight: 700; color: #2d3436; font-size: 0.95rem; outline: none; background: #fcfcfd;">
            </div>
          </div>

          <!-- 2. Category Selection (No Scroll) -->
          <div style="position: relative;">
            <label style="display: block; font-size: 0.65rem; font-weight: 900; color: #a29bfe; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-left: 5px;">Category Filter</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-height: 300px; overflow-y: auto; padding: 5px;">
              
              ${this.mainCategories.map(cat => `
                <div class="category-mode-card" data-value="${cat.category_name}" style="background: #ffffff; border: 2px solid #edeff2; border-radius: 18px; padding: 15px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); text-align: center; position: relative; overflow: hidden;">
                  <div class="icon-box" style="width: 44px; height: 44px; background: #f8f9fa; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; transition: all 0.3s;">
                    <i class="${this.getCategoryIcon(cat.category_name)}" style="color: ${cat.category_name.toLowerCase().includes('back') ? '#f7ce3e' : '#a29bfe'}; font-size: 1.2rem;"></i>
                  </div>
                  <div style="font-weight: 800; color: #2d3436; font-size: 0.8rem; margin-bottom: 2px; line-height: 1.2;">${cat.category_name}</div>
                  <div class="selection-indicator" style="position: absolute; top: 10px; right: 10px; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #edeff2; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                    <i class="fas fa-check" style="font-size: 0.6rem; color: white; display: none;"></i>
                  </div>
                </div>
              `).join('')}

            </div>
          </div>
          <input type="hidden" id="categoryType" value="">
        </div>

        <style>
          .category-mode-card:hover { border-color: #f7ce3e !important; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.04); }
          .category-mode-card.active { border-color: #f7ce3e !important; background: #fffcf0 !important; box-shadow: 0 10px 25px rgba(247, 206, 62, 0.1) !important; }
          .category-mode-card.active .icon-box { background: white !important; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          .category-mode-card.active .selection-indicator { background: #f7ce3e !important; border-color: #f7ce3e !important; }
          .category-mode-card.active .selection-indicator i { display: block !important; }
          .category-mode-card.active div { color: #f7ce3e !important; }
        </style>
      `,
      didOpen: () => {
        const cards = document.querySelectorAll('.category-mode-card');
        const hiddenInput = document.getElementById('categoryType') as HTMLInputElement;

        cards.forEach(card => {
          card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            hiddenInput.value = card.getAttribute('data-value') || '';
          });
        });
      },
      preConfirm: async () => {
        const dateInput = document.getElementById('deliveryDate') as HTMLInputElement;
        const categorySelect = document.getElementById('categoryType') as HTMLInputElement;

        if (!dateInput?.value) {
          Swal.showValidationMessage('Please select a valid date.');
          return false;
        }

        if (!categorySelect?.value) {
          Swal.showValidationMessage('Please select a category.');
          return false;
        }

        const inputDate = new Date(dateInput.value);
        if (isNaN(inputDate.getTime())) {
          Swal.showValidationMessage('Invalid date format.');
          return false;
        }

        const formattedDate = dateInput.value;
        const isHoliday = await this.checkPublicHoliday(formattedDate);
        const day = inputDate.getDay(); // 0 = Sunday, 6 = Saturday

        if (!isHoliday && day !== 6 && day !== 0) {
          Swal.showValidationMessage('Only Saturdays, Sundays, or public holidays are allowed.');
          return false;
        }

        return {
          date: dateInput.value,
          category: categorySelect.value
        };
      }
    }).then(result => {
      if (result.isConfirmed) {
        const { date, category } = result.value;
        this.getLabels(date, category);
      }
    });
  }

  async checkPublicHoliday(date: string): Promise<boolean> {
    const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${new Date().getFullYear()}/DE`;
    return new Promise((resolve) => {
      this.http.get<{ date: string }[]>(apiUrl).subscribe(
        (holidays: { date: string }[]) => {
          const isHoliday = holidays.some((holiday: { date: string }) => holiday.date === date);
          resolve(isHoliday);
        },
        (error: any) => {
          console.error('Error fetching public holidays:', error);
          resolve(false);
        }
      );
    });
  }


  // Fetch PDF from backend
  getLabels(date: string, category: string): void {
    this.isLoading = true; // Start loader

    this.adminService.getLabels(date, category).subscribe(
      (response: Blob) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank'); // Open PDF in new tab
        this.isLoading = false; // Stop loader
      },
      (error: any) => {
        this.isLoading = false; // Stop loader on error
        console.error('Error fetching PDF:', error);
        Swal.fire('Error', 'There was an error fetching the labels. Please try again later.', 'error');
      }
    );
  }


  getLabelReport(): void {
    let data: any = [];
    if (this.showSubscriptionOrders) {
      data = this.mergedOrders;
    } else {
      data = this.mergedOrders;
    }
    this.adminService.getLabelReport(data).subscribe(
      (response: Blob) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        Swal.fire('Success', 'File opened in a new tab.', 'success');
      },
      (error: any) => {
        Swal.fire('Error', 'Could not open file.', 'error');
      }
    );

    // this.adminService.getLabelReport(data).subscribe(
    //   (response: Blob) => {
    //     const blob = new Blob([response], { type: 'application/pdf' }); // Set the correct MIME type for PDF
    //     const blobUrl = URL.createObjectURL(blob);

    //     // Open the PDF in a new tab
    //     window.open(blobUrl, '_blank');

    //     // Optionally, revoke the URL after some time
    //     setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

    //     Swal.fire('Success', 'File is opened in a new tab.', 'success');
    //   },
    //   (error) => {
    //     console.error('Error opening the file:', error);
    //     Swal.fire('Error', 'There was an error opening the file. Please try again later.', 'error');
    //   }
    // );
  }






  viewOrder(order_id: any): void {
    const orderDetails$ = this.adminService.loadDetailsOrder(order_id);

    console.log("Order Detaisl", orderDetails$)


    const order$ = this.adminService.loadOrders();
    const subscriptionOrder$ = this.adminService.loadSubsOrders();

    Promise.all([orderDetails$.toPromise(), order$.toPromise(), subscriptionOrder$.toPromise()]).then(([orderDetailsResponse, ordersResponse, subscriptionOrdersResponse]: any[]) => {

      const orderDetails = orderDetailsResponse.orders.map((order: any) => ({
        product_name: order.product_name,
        quantity: order.quantity,
        price: order.price
      }));

      // console.log("orderDetails",orderDetails)

      const mergedOrders = [
        ...(ordersResponse.orders || []),
        ...(subscriptionOrdersResponse.subscribeData || [])
      ];
      // console.log("Merged Orders:", mergedOrders);

      // 🔍 Find the order by ID in merged array
      const order = mergedOrders.find((o: any) => o.order_id === order_id);
      console.log("Selected Order for modal (Normal):", order);

      if (order) {
        const userId = order.user_id || order.userid || order.customer_id;
        // Fallback: If user not in allUsers, fetch it
        const userExists = this.allUsers.find(u => u.id == userId);
        const userPromise = userExists ? Promise.resolve(userExists) : this.adminService.getUserById(userId).toPromise().then((res: any) => res.user[0]).catch(() => null);

        userPromise.then((fetchedUser: any) => {
          if (fetchedUser && !userExists) this.allUsers.push(fetchedUser);

          Swal.fire({
            title: `Order Details - ${order_id}`,
            width: '750px',
            padding: '0',
            showCloseButton: true,
            customClass: {
              popup: 'premium-swal-popup',
              title: 'swal2-title',
              htmlContainer: 'swal2-html-container',
              confirmButton: 'swal2-confirm'
            },
            html: `
              <div class="section-title-premium"><i class="fas fa-info-circle"></i> View Summary</div>
              <div class="details-grid-premium">
                <div class="detail-item-premium">
                  <label>Order ID</label>
                  <span>#${order.order_id}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Customer Name</label>
                  <span>${this.getUserName(userId)}</span>
                </div>
                <div class="detail-item-premium full-width">
                  <label>Address</label>
                  <span>${order.address}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Contact</label>
                  <span>${order.contact}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Status</label>
                  <span style="text-transform: capitalize;">${order.status}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Delivery Date</label>
                  <span>${order.delivery_date}</span>
                </div>
                <div class="detail-item-premium full-width">
                  <label>Instruction</label>
                  <span>${order.instruction || 'No instructions'}</span>
                </div>
              </div>

              <div class="section-title-premium"><i class="fas fa-shopping-basket"></i> Products</div>
              <div class="product-list-premium">
                ${orderDetails.map((detail: any) => `
                  <div class="product-row">
                    <span class="name">${detail.product_name}</span>
                    <span class="qty">x ${detail.quantity}</span>
                    <span class="price">€${detail.price}</span>
                  </div>
                `).join('')}
              </div>

              <div class="section-title-premium"><i class="fas fa-box"></i> Bags Allocation</div>
              <div class="bags-section-premium">
                <div class="bags-grid" style="grid-template-columns: repeat(2, 1fr);">
                  <div class="bag-display-item">
                    <label>Große Tüte</label>
                    <span class="bag-val">${order.gro_bag || 0}</span>
                  </div>
                  <div class="bag-display-item">
                    <label>Mittlere Tüte</label>
                    <span class="bag-val">${order.mitt_bag || 0}</span>
                  </div>
                  <div class="bag-display-item">
                    <label>Baguette Tüte</label>
                    <span class="bag-val">${order.bagu_bag || 0}</span>
                  </div>
                  <div class="bag-display-item">
                    <label>Zusätzliche Tüte</label>
                    <span class="bag-val">${order.zusätzliche_tüte || 0}</span>
                  </div>
                </div>
              </div>

              <div class="pricing-summary-premium">
                <div class="price-row-mini">
                  <span>Price: ${Number(order.price).toFixed(2)}€</span>
                  <span>Tipps: ${Number(order.tips).toFixed(2)}€</span>
                </div>
                <div class="total-label">Total Amount</div>
                <div class="total-value">${(Number(order.price) + Number(order.tips)).toFixed(2)}€</div>
              </div>
            `,
            confirmButtonText: "Close",
          });
        });
      } else {
        Swal.fire("Error", "Order not found!", "error");
      }
    })
      .catch((error: any) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Error", "Failed to fetch order details. Please try again later.", "error");
      });
  }

  viewOrders(order_id: any): void {
    const orderDetails$ = this.adminService.loadDetailsSubscriptionOrder(order_id);


    const order$ = this.adminService.loadSubsOrders();


    Promise.all([orderDetails$.toPromise(), order$.toPromise()])
      .then(([orderDetailsResponse, ordersResponse]: any[]) => {

        const orderDetails = orderDetailsResponse.orders.map((order: any) => ({
          product_name: order.product_name,
          quantity: order.quantity,
          price: order.price
        }));


        const order = ordersResponse.orders.find((o: any) => o.order_id === order_id);
        console.log("Selected Order for modal (Subscription):", order);

        if (order) {
          const userId = order.user_id || order.userid || order.customer_id || order.id;
          // Fallback: If user not in allUsers, fetch it
          const userExists = this.allUsers.find(u => u.id == userId);
          const userPromise = userExists ? Promise.resolve(userExists) : this.adminService.getUserById(userId).toPromise().then((res: any) => res.user[0]).catch(() => null);

          userPromise.then((fetchedUser: any) => {
            if (fetchedUser && !userExists) this.allUsers.push(fetchedUser);

            Swal.fire({
              title: `Order Details - ${order_id}`,
              width: '750px',
              padding: '0',
              showCloseButton: true,
              customClass: {
                popup: 'premium-swal-popup',
                title: 'swal2-title',
                htmlContainer: 'swal2-html-container',
                confirmButton: 'swal2-confirm'
              },
              html: `
                <div class="section-title-premium"><i class="fas fa-info-circle"></i> Subscription Overview</div>
                <div class="details-grid-premium">
                  <div class="detail-item-premium">
                    <label>User ID</label>
                    <span>#${order.id}</span>
                  </div>
                  <div class="detail-item-premium">
                    <label>Order ID</label>
                    <span>#${order.order_id}</span>
                  </div>
                  <div class="detail-item-premium full-width">
                    <label>Address</label>
                    <span>${order.address}</span>
                  </div>
                  <div class="detail-item-premium">
                    <label>Contact</label>
                    <span>${order.contact}</span>
                  </div>
                  <div class="detail-item-premium">
                    <label>Status</label>
                    <span style="text-transform: capitalize;">${order.status}</span>
                  </div>
                  <div class="detail-item-premium">
                    <label>Delivery Date</label>
                    <span>${order.delivery_date}</span>
                  </div>
                  <div class="detail-item-premium full-width">
                    <label>Instruction</label>
                    <span>${order.instruction || 'No instructions'}</span>
                  </div>
                </div>

                <div class="section-title-premium"><i class="fas fa-shopping-basket"></i> Products</div>
                <div class="product-list-premium">
                  ${orderDetails.map((detail: any) => `
                    <div class="product-row">
                      <span class="name">${detail.product_name}</span>
                      <span class="qty">x ${detail.quantity}</span>
                      <span class="price">€${detail.price}</span>
                    </div>
                  `).join('')}
                </div>

                <div class="section-title-premium"><i class="fas fa-box"></i> Bags Allocation</div>
                <div class="bags-section-premium">
                  <div class="bags-grid" style="grid-template-columns: repeat(2, 1fr);">
                    <div class="bag-display-item">
                      <label>Große Tüte</label>
                      <span class="bag-val">${order.gro_bag || 0}</span>
                    </div>
                    <div class="bag-display-item">
                      <label>Mittlere Tüte</label>
                      <span class="bag-val">${order.mitt_bag || 0}</span>
                    </div>
                    <div class="bag-display-item">
                      <label>Baguette Tüte</label>
                      <span class="bag-val">${order.bagu_bag || 0}</span>
                    </div>
                    <div class="bag-display-item">
                      <label>Zusätzliche Tüte</label>
                      <span class="bag-val">${order.zusätzliche_tüte || 0}</span>
                    </div>
                  </div>
                </div>

                <div class="pricing-summary-premium">
                  <div class="total-label">Total Amount</div>
                  <div class="total-value">${order.price}€</div>
                </div>
              `,
              confirmButtonText: "Close",
            });
          });
        } else {
          Swal.fire("Error", "Order not found!", "error");
        }
      })
      .catch((error: any) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Error", "Failed to fetch order details. Please try again later.", "error");
      });
  }

  get paginatedOrders(): Order[] {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  previousPage(): void {
    if (this.page > 1) this.page--;
  }
  toggleDriverDropdown(): void {
    this.isDriverDropdownOpen = !this.isDriverDropdownOpen;
  }

  selectDriverOption(driver: Driver): void {
    this.selectedDriver = driver.id.toString();
    this.isDriverDropdownOpen = false;
  }

  getSelectedDriverName(): string {
    const driver = this.drivers.find(d => d.id.toString() == this.selectedDriver);
    return driver ? driver.username : 'Select a Driver';
  }

  async printPremiumLabels(): Promise<void> {
    if (this.mergedOrders.length === 0) {
      Swal.fire('No Orders', 'Please load orders first.', 'info');
      return;
    }

    this.isLoading = true;

    // Fetch details for all visible orders to get products
    try {
      const detailRequests = this.mergedOrders.map(order =>
        this.adminService.loadDetailsOrder(order.order_id).pipe(
          catchError(() => of({ orders: [] }))
        )
      );

      const allDetails = await forkJoin(detailRequests).toPromise();

      const ordersWithProducts = this.mergedOrders.map((order, index) => {
        const details = allDetails ? allDetails[index] : null;
        const productsSummary = details ? details.orders.map((p: any) => `${p.quantity} ${p.product_name}`).join(', ') : '';
        return {
          ...order,
          productsSummary: productsSummary || 'No items'
        };
      });

      localStorage.setItem('printOrders', JSON.stringify(ordersWithProducts));
      this.isLoading = false;
      window.open('/#/orders/label-print', '_blank');
    } catch (error) {
      this.isLoading = false;
      console.error('Error preparing labels:', error);
      Swal.fire('Error', 'Failed to prepare premium labels.', 'error');
    }
  }

  getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('back') || name.includes('bread') || name.includes('bakery')) {
      return 'fas fa-bread-slice';
    } else if (name.includes('drink') || name.includes('getränk') || name.includes('wine') || name.includes('bier')) {
      return 'fas fa-wine-glass-alt';
    } else if (name.includes('fruit') || name.includes('obst') || name.includes('gemüse') || name.includes('vegetable')) {
      return 'fas fa-apple-alt';
    } else if (name.includes('dairy') || name.includes('milk') || name.includes('milch') || name.includes('käse')) {
      return 'fas fa-cheese';
    } else if (name.includes('meat') || name.includes('fleisch') || name.includes('wurst')) {
      return 'fas fa-drumstick-bite';
    }
    return 'fas fa-box';
  }
}
